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
    this.muted(
      "A comprehensive guide on using templates, variables and transformations"
    );
    this.newLine();

    // scaffold.config.json
    this.info("scaffold.config.json");

    this.muted(
      `  This is the configuration file for scaffoldjs. It contains templates, injects and groups.`,
      true
    );

    this.muted("  • template sample", true);
    this.muted(
      `    "controller": {
        "description": "Generate a controller file (optional)",
        "src": "./scaffolds/controller.tp",
        "dest": "./src/{{module}}/controllers/{{resource.singular.lowerCase}}.controller.ts"
      }`,
      true
    );

    this.muted("  • inject sample", true);
    this.muted(
      `    "import-statement": {
        "description": "Import statement for injection (optional)",
        "src": "./scaffolds/{{feature}}-import.tp",
        "dest": "inject"
      }`,
      true
    );

    this.muted("  • group sample", true);
    this.muted(
      `    "crud-group": ["controller", "service", "dto", "entity"]`,
      true
    );

    this.dim("  N.B:", true);
    this.dim(
      "  • make sure the templates and injects src paths are correct and the files exist"
    );
    this.dim(
      "  • both src and dest paths can contain variables and transformations"
    );
    this.dim("  • groups cannot contain inject templates");
    this.dim(
      "  • do not remove this file after setup, it is required for scaffolding"
    );

    // variables
    this.info("variables");

    this.muted(
      "  These are placeholders that get replaced with actual values during scaffolding.",
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
      "  • {{variable.hyphenCase}}\t\tconverts the value to hyphen case (e.g User account -> user-account)",
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
      `  • ${chalk.bold.blueBright("resource")} is automatically provided as the primary variable`
    );
    this.dim(
      "  • custom variables can be passed using the -v option (e.g., -v module=auth feature=users)"
    );
    this.dim(
      "  • any variable name is supported (module, feature, domain, etc.)"
    );

    // examples section
    this.info("examples");

    this.muted("  • Basic resource generation:", true);
    this.muted("    npx scaffold make user controller");
    this.muted("    → generates: ./src/controllers/user.controller.ts");

    this.muted("  • With custom variables:", true);
    this.muted(
      "    npx scaffold make table controller -v module=restaurant feature=dining"
    );
    this.muted(
      "    → generates: ./src/restaurant/controllers/table.controller.ts"
    );

    this.muted("  • Multiple templates:", true);
    this.muted(
      "    npx scaffold make booking crud-group -v module=hotel feature=reservations"
    );
    this.muted("    → generates multiple files in ./src/hotel/");

    this.muted("  • Template injection:", true);
    this.muted(
      "    npx scaffold inject import-statement src/app.module.ts -r user -v module=auth"
    );
    this.muted("    → injects import statement into app.module.ts");

    this.muted("  • Variable usage in templates:", true);
    this.muted(
      "    Template: @Controller('{{module}}/{{feature}}/{{resource.plural.lowerCase}}')"
    );
    this.muted("    Result: @Controller('restaurant/dining/tables')");
  }

  static help() {
    // description
    this.muted(
      "A CLI tool for scaffolding code templates with multi-variable support"
    );
    this.newLine();

    // usages
    this.info("Usage:");

    this.muted("  npx scaffold help", true);
    this.muted("  npx scaffold guide", true);
    this.muted("  npx scaffold setup [-f]", true);
    this.muted("  npx scaffold list", true);
    this.muted(
      "  npx scaffold make <resource> <template> [-v <vars...>] [-f]",
      true
    );
    this.muted(
      "  npx scaffold inject <template> <file> [-t] [-r] [-v <vars...>]",
      true
    );

    // commands
    this.info("Commands:");

    this.muted("  • help\t\tdisplays this help information", true);
    this.muted(
      "  • guide\t\tcomprehensive guide on using templates, variables and transformations",
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
      "  • <resource>\t\ta new resource. (e.g user, user-account, booking-request)",
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
    this.dim("\t\t\tit can be a predefined template group (e.g crud-group)");
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
    this.dim("\t\t\te.g //inject:method or <!-- inject:imports -->");
    this.muted("  • -r, --resource\tthe resource name.", true);
    this.dim("\t\t\te.g user-account (used in inject templates)");
    this.muted("  • -v, --vars\t\tcustom variables in key=value format", true);
    this.dim("\t\t\te.g -v module=auth feature=users domain=admin");
    this.dim("\t\t\tmultiple variables are space-separated");

    // examples section
    this.info("Examples:");

    this.muted("  • Basic scaffolding:", true);
    this.muted("    npx scaffold make user controller");

    this.muted("  • With custom module:", true);
    this.muted("    npx scaffold make product controller -v module=inventory");

    this.muted("  • Multiple variables:", true);
    this.muted(
      "    npx scaffold make booking service -v module=hotel feature=reservations"
    );

    this.muted("  • Generate multiple files:", true);
    this.muted("    npx scaffold make order crud-group -v module=ecommerce");

    this.muted("  • Template injection:", true);
    this.muted(
      "    npx scaffold inject method-injection src/services/user.service.ts -r user"
    );

    this.muted("  • Injection with variables:", true);
    this.muted(
      "    npx scaffold inject import-statement src/app.module.ts -v module=auth feature=users"
    );

    this.muted("  • Force overwrite:", true);
    this.muted(
      "    npx scaffold make table controller -v module=restaurant --force"
    );
  }
}
