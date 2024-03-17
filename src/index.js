#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const pluralize = require("pluralize");
const chalk = require("chalk");
const yaml = require("yaml");

class Scaffold {
  projectRoot = "./src";
  scaffoldJsDir = path.resolve(__dirname, ".."); // Get the absolute path of the package directory
  prebuiltScaffolds = path.join(this.scaffoldJsDir, "src/scaffolds");
  configFile = "./scaffold.config.json";
  config = { framework: "express" };

  constructor() {
    console.log(chalk.yellow("\nScaffolding... 🏗️\n"));

    // check for config file
    this.parseConfig();

    const command = process.argv[2];
    const resource = process.argv[3] ? process.argv[3].toLowerCase() : "";
    const options = process.argv.slice(4);
    const context = this.generateContext(resource);

    this.handle(command, context, options);
  }

  parseConfig() {
    try {
      // check that file exists
      if (!fs.existsSync(this.configFile))
        throw new Error(
          "`scaffold.config.json` file is required to be in your root folder."
        );

      this.config = JSON.parse(fs.readFileSync(this.configFile, "utf8")) ?? {};

      // validate file
      if (
        !this.config.framework ||
        ["express", "serverless"].includes(this.config.framework) === false
      )
        throw new Error(
          "Invalid configuration: `framework` key must be one of express, serverless."
        );
    } catch (error) {
      this.handleError(error);
    }
  }

  handle(command, context, options) {
    switch (command) {
      case "help":
        this.showHelp();
        break;

      case "entity":
        this.scaffold("entity", context, options);
        break;
      case "dto":
        this.scaffold("dto", context, options);
        break;
      case "route":
        this.scaffold("route", context, options);
        break;
      case "controller":
        this.scaffold("controller", context, options);
        break;
      case "repo":
        this.scaffold("repo", context, options);
        break;
      case "handler":
        this.scaffold("handler", context, options);
        break;
      case "resource":
        this.scaffoldResource(context, options);
        break;

      default:
        this.hintHelp(command);
        process.exit();
    }

    console.log(this.success("\nDone!\n"));
  }

  scaffold(command, context, options) {
    try {
      const _options = Array(...options);

      console.log(
        this.info(`\nCreating ${context.resource_file_name}.${command}.ts`)
      );

      if (_options.includes(`--no-${command}`)) {
        console.log(
          this.info(
            `Skipping ${context.resource_file_name}.${command}... (reason: --no-${command} option set.)`
          )
        );
        return;
      }

      if (
        fs.existsSync(
          `./src/${pluralize.plural(command)}/${
            context.resource_file_name
          }.${command}.ts`
        )
      ) {
        if (!_options.includes("--force")) {
          console.log(
            this.muted(
              `Skipping ${context.resource_file_name}.${command}... (reason: file already exist, use --force to enforce.)`
            )
          );
          return;
        } else
          console.log(
            this.muted(
              `Forcing ${context.resource_file_name}.${command}... (reason: file already exist.)`
            )
          );
      }

      const template = fs.readFileSync(
        `${this.prebuiltScaffolds}/${command}.tp`,
        "utf8"
      );
      fs.writeFileSync(
        `${this.projectRoot}/${pluralize.plural(command)}/${
          context.resource_file_name
        }.${command}.ts`,
        this.format(template, context)
      );

      console.log(
        this.success(`Created ${context.resource_file_name}.${command}.ts ✅`)
      );
    } catch (error) {
      this.handleError(error);
    }
  }

  scaffoldHandler(subCommand, context, options) {
    try {
      const _options = Array(...options);

      console.log(
        this.info(`\nCreating ${context.resource_file_name}/${subCommand}.ts`)
      );

      if (_options.includes(`--no-${subCommand}-handler`)) {
        console.log(
          this.info(
            `Skipping ${context.resource_file_name}/${subCommand}... (reason: --no-${subCommand}-handler option set.)`
          )
        );
        return;
      }

      if (
        fs.existsSync(
          `./src/handlers/${context.resource_file_name}/${subCommand}.ts`
        )
      ) {
        if (!_options.includes("--force")) {
          console.log(
            this.muted(
              `Skipping ${context.resource_file_name}/${subCommand}... (reason: file already exist, use --force to enforce.)`
            )
          );
          return;
        } else
          console.log(
            this.muted(
              `Forcing ${context.resource_file_name}/${subCommand}... (reason: file already exist.)`
            )
          );
      }

      const template = fs.readFileSync(
        `${this.prebuiltScaffolds}/handler.${subCommand}.tp`,
        "utf8"
      );
      fs.writeFileSync(
        `${this.projectRoot}/handlers/${context.resource_file_name}/${subCommand}.ts`,
        this.format(template, context)
      );

      console.log(
        this.success(
          `Created ${context.resource_file_name}/${subCommand}.ts ✅`
        )
      );

      this.appendFunctionToServerlessFunctions(subCommand, context, options);
    } catch (error) {
      this.handleError(error);
    }
  }

  readServerlessFile() {
    try {
      let file = fs.readFileSync(`./serverless.yml`, "utf8");

      let newlineCount = 0;
      file = file.replace(/\n\n/gm, () => {
        return `\n"newline${newlineCount++}": true\n`;
      });
      file = file.replace(/#(.+)(")(.+)(")/gm, "#$1`$3`");
      file = file.replace(/#(.+)/gm, '"#$1": true');

      return yaml.parse(file, {
        logLevel: "silent",
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  appendFunctionToServerlessFunctions(subCommand, context, options) {
    try {
      const _options = Array(...options);

      console.log(
        this.info(
          `\nAdding ${subCommand}${context.resource_sentence_case} function to serverless.yml`
        )
      );

      if (_options.includes(`--no-function`)) {
        console.log(
          this.info(
            `Skip adding ${subCommand}${context.resource_sentence_case} function to serverless.yml... (reason: --no-function option set.)`
          )
        );
        return;
      }

      const subCommandMap = {
        create: {
          path: `/api/v1/${context.resource_lower_case_plural}`,
          method: "post",
        },
        findAll: {
          path: `/api/v1/${context.resource_lower_case_plural}`,
          method: "get",
        },
        findOne: {
          path: `/api/v1/${context.resource_lower_case_plural}/{${context.resource_lower_case}Id}`,
          method: "get",
        },
        update: {
          path: `/api/v1/${context.resource_lower_case_plural}/{${context.resource_lower_case}Id}`,
          method: "patch",
        },
        delete: {
          path: `/api/v1/${context.resource_lower_case_plural}/{${context.resource_lower_case}Id}`,
          method: "delete",
        },
      };

      const serverless = this.readServerlessFile();
      const newFunction = JSON.parse(`
      {
        "${subCommand}${context.resource_sentence_case}":{
          "handler":"src/handlers/${context.resource_file_name}/${subCommand}.handler",
          "events":[{
            "http":{
              "path":"${subCommandMap[subCommand]["path"]}",
              "method":"${subCommandMap[subCommand]["method"]}"
            }
          }]
        }
      }`);

      serverless.functions = {
        ...serverless.functions,
        ...newFunction,
      };

      let serverlessString = yaml.stringify(serverless);
      serverlessString = serverlessString.replace(
        /\nnewline(.*): true\n/gm,
        "\n\n"
      );
      serverlessString = serverlessString.replace(/"#(.+)": true/gm, "#$1");
      serverlessString = serverlessString.replace(/`/gm, '"');

      fs.writeFileSync("./serverless.yml", serverlessString);

      console.log(
        this.success(
          `Adding ${subCommand}${context.resource_sentence_case} function to serverless.yml ✅`
        )
      );
    } catch (error) {
      this.handleError(error);
    }
  }

  scaffoldResource(context, options) {
    try {
      console.log(
        this.info(`Creating new resource - ${context.resource_file_name} ✨`)
      );

      this.scaffold("entity", context, options);
      this.scaffold("dto", context, options);
      if (this.config.framework === "express") {
        this.scaffold("route", context, options);
        this.scaffold("controller", context, options);
      }
      if (this.config.framework === "serverless") {
        this.scaffoldHandler("create", context, options);
        this.scaffoldHandler("findAll", context, options);
        this.scaffoldHandler("findOne", context, options);
        this.scaffoldHandler("update", context, options);
        this.scaffoldHandler("delete", context, options);
      }
      this.scaffold("repo", context, options);
    } catch (error) {
      this.handleError(error);
    }
  }

  hintHelp(command) {
    console.log(`${this.failure(
      `Unknown command - ${command}.`
    )}\n\nrun: ${this.info("npx scaffold help")} for guidance.
    `);
  }

  showHelp() {
    if (this.config.framework === "express") {
      console.log(`Help
  
      npx scaffold <command> <resource> [<options>]
      
      available commands:
      \tresource\t\t${this.muted(
        "creates a new resource with entity, dto, routes, controller and repo."
      )}
      \tentity\t\t\t${this.muted("creates a resource entity only.")}
      \tdto\t\t\t${this.muted("creates a resource dto only.")}
      \troute\t\t\t${this.muted("creates a resource routes only.")}
      \tcontroller\t\t${this.muted("creates a resource controller only.")}
      \trepo\t\t\t${this.muted("creates a resource repo only.")}
      \thelp\t\t\t${this.muted("shows this help.")}
  
      resource e.g:
      \tuser\t\t\t${this.muted("resource with single word.")}
      \tuser-account\t\t${this.muted(
        "resource with multiple words should be seperated with hyphen (-)."
      )}
  
      available options:
      \t--force\t\t\t${this.muted("force an operation.")}
      \t--no-dto\t\t${this.muted("don't create a dto for the resource.")}
      \t--no-entity\t\t${this.muted("don't create an entity for the resource.")}
      \t--no-route\t\t${this.muted("don't create a route for the resource.")}
      \t--no-controller\t\t${this.muted(
        "don't create a controller for the resource."
      )}
      \t--no-repo\t\t${this.muted("don't create a repo for the resource.")}
      `);
    }

    if (this.config.framework === "serverless") {
      console.log(`Help
  
      npx scaffold <command> <resource> [<options>]
      
      available commands:
      \tresource\t\t${this.muted(
        "creates a new resource with entity, dto, handlers and repo."
      )}
      \tentity\t\t\t${this.muted("creates a resource entity only.")}
      \tdto\t\t\t${this.muted("creates a resource dto only.")}
      \thandler\t\t\t${this.muted("creates a single resource handler only.")}
      \trepo\t\t\t${this.muted("creates a resource repo only.")}
      \thelp\t\t\t${this.muted("shows this help.")}
  
      resource e.g:
      \tuser\t\t\t${this.muted("resource with single word.")}
      \tuser-account\t\t${this.muted(
        "resource with multiple words should be seperated with hyphen (-)."
      )}
  
      available options:
      \t--force\t\t\t${this.muted("force an operation.")}
      \t--no-dto\t\t${this.muted("don't create a dto for the resource.")}
      \t--no-entity\t\t${this.muted("don't create an entity for the resource.")}
      \t--no-create-handler\t${this.muted(
        "don't create a resource/create handler for the resource."
      )}
      \t--no-findAll-handler\t${this.muted(
        "don't create a resource/findAll handler for the resource."
      )}
      \t--no-findOne-handler\t${this.muted(
        "don't create a resource/findOne handler for the resource."
      )}
      \t--no-update-handler\t${this.muted(
        "don't create a resource/update handler for the resource."
      )}
      \t--no-delete-handler\t${this.muted(
        "don't create a resource/delete handler for the resource."
      )}
      \t--no-function\t\t${this.muted(
        "don't create a serverless function for the resource handler."
      )}
      \t--no-repo\t\t${this.muted("don't create a repo for the resource.")}
      `);
    }
  }

  muted(log) {
    return chalk.dim(log);
  }

  info(log) {
    return chalk.blueBright(log);
  }

  success(log) {
    return chalk.greenBright(log);
  }

  failure(log) {
    return chalk.redBright(log);
  }

  format(content, context) {
    const {
      resource_file_name,
      resource_lower_case,
      resource_sentence_case,
      resource_lower_case_plural,
      resource_sentence_case_plural,
    } = context;
    content = String(content).replace(
      /{{resource_file_name}}/gm,
      resource_file_name
    );
    content = String(content).replace(
      /{{resource_lower_case}}/gm,
      resource_lower_case
    );
    content = String(content).replace(
      /{{resource_sentence_case}}/gm,
      resource_sentence_case
    );
    content = String(content).replace(
      /{{resource_lower_case_plural}}/gm,
      resource_lower_case_plural
    );
    content = String(content).replace(
      /{{resource_sentence_case_plural}}/gm,
      resource_sentence_case_plural
    );

    return content;
  }

  handleError(error) {
    console.error(this.failure(`${error.message}\n`), error.code);
    process.exit(1);
  }

  toSentenceCase(word) {
    return `${String(word).charAt(0).toUpperCase()}${String(word).substring(
      1
    )}`;
  }

  generateContext(resource) {
    const _resource = resource
      .split("-")
      .map((word, i) => {
        return i === 0 ? word : this.toSentenceCase(word);
      })
      .join("");

    return {
      resource_file_name: pluralize.singular(resource),
      resource_lower_case: pluralize.singular(_resource),
      resource_sentence_case: this.toSentenceCase(
        pluralize.singular(_resource)
      ),
      resource_lower_case_plural: pluralize.plural(_resource),
      resource_sentence_case_plural: this.toSentenceCase(
        pluralize.plural(_resource)
      ),
    };
  }
}

new Scaffold();
