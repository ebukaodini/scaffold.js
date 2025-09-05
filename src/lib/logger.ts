import chalk from "chalk";

export class Logger {
  static brand() {
    console.log(
      "\n",
      `${chalk.yellowBright(chalk.bold("Scaffolding... 🏗️"))}`,
      "\n"
    );
  }

  static muted(log: string, nl: boolean = false) {
    console.log(nl ? "\n" : "\r", chalk.grey(log));
  }

  static dim(log: string, nl: boolean = false) {
    console.log(nl ? "\n" : "\r", chalk.dim(log));
  }

  static info(log: string, nl: boolean = true) {
    console.log(nl ? "\n" : "\r", chalk.blueBright(log));
  }

  static success(log: string, nl: boolean = true) {
    console.log(nl ? "\n" : "\r", chalk.greenBright(log));
  }

  static failure(log: string, nl: boolean = true) {
    console.log(nl ? "\n" : "\r", chalk.redBright(log));
  }

  static newLine(x: number = 1) {
    console.log("\n".repeat(x));
  }

  static exit(code: number = 1) {
    this.newLine();
    process.exit(code);
  }

  static guide() {
    // description
    this.muted("A guide on using templates, variables and transformations");
    this.newLine();

    // scaffold.config.json
    this.info("scaffold.config.json");

    this.muted(
      `  This is the configuration file for scaffoldjs. It contains templates, injects and groups.`,
      true
    );

    this.muted("  • template sample", true);
    this.muted(
      `    "template": {
        "description": "A brief description for the template (optional)",
        "src": "Filepath to the template file e.g ./scaffolds/controller.tp",
        "dest": "Filepath to the destination file e.g ./src/controllers/{{resource.singular.lowerCase}}.controller.ts"
      }`,
      true
    );

    this.muted("  • inject sample", true);
    this.muted(
      `    "inject": {
        "description": "A brief description for the template (optional)",
        "src": "Filepath to the template file e.g ./scaffolds/author.tp",
        "dest": "inject" -- indicates that this is an inject template
      }`,
      true
    );

    this.muted("  • group sample", true);
    this.muted(`    "group": ["template1", "template2", "template3"]`, true);

    this.dim("  N.B:", true);
    this.dim(
      "  • make sure the templates and injects src paths are correct and the files exist"
    );
    this.dim("  • the dest path can contain variables and transformations");
    this.dim("  • groups cannot contain inject templates");
    this.dim(
      "  • do not remove this file after setup, it is required for scaffolding"
    );
    // this.newLine();

    // variables
    this.info("variables");

    this.muted(
      "  These are placeholders in that get replaced with actual values during scaffolding.",
      true
    );
    this.muted(
      "  They are placed within double curly braces and can be transformed using the following methods:"
    );

    this.muted(
      "  • {{variable}}\t\t\ta variable without any transformation. It returns the value as-is",
      true
    );
    this.muted(
      "  • {{variable.raw}}\t\t\treturns the value as-is without any transformation",
      true
    );
    this.muted(
      "  • {{variable.singular}}\t\tconverts the value to its singular form (e.g users -> user)",
      true
    );
    this.muted(
      "  • {{variable.plural}}\t\tconverts the value to its plural form (e.g user -> users)",
      true
    );
    this.muted(
      "  • {{variable.camelCase}}\t\tconverts the value to camel case (e.g user-account -> userAccount)",
      true
    );
    this.muted(
      "  • {{variable.pascalCase}}\t\tconverts the value to pascal case (e.g user-account -> UserAccount)",
      true
    );
    this.muted(
      "  • {{variable.snakeCase}}\t\tconverts the value to snake case (e.g user-account -> user_account)",
      true
    );
    this.muted(
      "  • {{variable.spaceCase}}\t\tconverts the value to space case (e.g user-account -> user account)",
      true
    );
    this.muted(
      "  • {{variable.lowerCase}}\t\tconverts the value to lower case (e.g User -> user)",
      true
    );
    this.muted(
      "  • {{variable.upperCase}}\t\tconverts the value to upper case (e.g user -> USER)",
      true
    );
    this.muted(
      "  • {{variable.sentenceCase}}\t\tconverts the value to sentence case (e.g user-account -> Useraccount)",
      true
    );
    this.dim("  N.B:", true);
    this.dim(
      "  • multiple transformations can be chained e.g {{variable.singular.pascalCase}}"
    );
    this.dim(
      `  • ${chalk.bold.blueBright("resource")} is a the only predefined and allowed variable for now. Custom variables can be added in future releases`
    );
  }

  static help() {
    // description
    this.muted("A CLI tool for scaffolding code templates");
    this.newLine();

    // usages
    this.info("Usage:");

    this.muted("  npx scaffold help", true);
    this.muted("  npx scaffold guide", true);
    this.muted("  npx scaffold setup [--force]", true);
    this.muted("  npx scaffold list", true);
    this.muted("  npx scaffold make <resource> <template> [--force]", true);
    this.muted(
      "  npx scaffold inject <template> <file> [--target] [--resource]",
      true
    );

    // commands
    this.info("Commands:");

    this.muted("  • help\t\tdisplays this help information", true);
    this.muted(
      "  • guide\t\tbasic guide on using templates, variables and transformations",
      true
    );
    this.muted(
      "  • setup\t\tcreates a scaffold.config.json file and the scaffolds/ directory",
      true
    );
    this.muted(
      "  • list\t\tshows a list of available templates, injects and groups in the scaffold.config.json file",
      true
    );
    this.muted(
      "  • make\t\tgenerates a new resource(s) with one or more templates",
      true
    );
    this.muted(
      "  • inject\t\tinjects a snippet (template) into an existing file at a specific point",
      true
    );

    // arguments
    this.info("Arguments:");

    this.muted(
      "  • <resource>\t\ta new resource. (e.g user, user-account)",
      true
    );
    this.dim(
      "\t\t\tN.B: a resource with multiple words should be separated with hyphen (-)"
    );
    this.muted(
      "  • <template>\t\ta template registered in scaffold.config.json",
      true
    );
    this.dim("\t\t\tit could be a single template (e.g dto)");
    this.dim(
      "\t\t\tit can be a comma-separated list of templates (e.g entity,repo,test)"
    );
    this.dim("\t\t\tit can be a predefined template group (e.g resources)");
    this.dim(
      "\t\t\tit can be an inject template (N.B: injects cannot be used in a group)"
    );
    this.muted("  • <file>\t\tthe file to be injected into.", true);
    this.dim("\t\t\te.g src/app.module.ts");

    // options
    this.info("Options:");

    this.muted("  • -f, --force\tforce an operation", true);
    this.dim("\t\t\tuse with caution, existing files would be overwritten!");
    this.muted("  • -t, --target\tthe target point within the file.", true);
    this.dim("\t\t\te.g //inject:method");
    this.muted("  • -r, --resource\tthe resource name.", true);
    this.dim("\t\t\te.g user-account (used in inject templates)");
  }
}
