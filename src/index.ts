#!/usr/bin/env node

import { Command } from "commander";
import { Scaffold } from "./lib/scaffold";
import { Logger } from "./lib/logger";
import pkg from "../package.json";

// Main CLI program
const program = new Command();

// Configure the main program
program.description(pkg.description);
// .version(pkg.version, "-v, --version");

// Help command - display help information
program
  .command("help")
  .description("setup scaffoldjs configuration and default templates")
  .action(() => {
    Logger.brand();
    Logger.help();
    Logger.exit(0);
  });

// Guide command - guide to using scaffoldjs
program
  .command("guide")
  .description("guide to using scaffoldjs")
  .action(() => {
    Logger.brand();
    Logger.guide();
    Logger.exit(0);
  });

// Setup command - setup scaffoldjs configuration and default templates
program
  .command("setup")
  .option("-f, --force", "force setup - this would override existing files")
  .description("setup scaffoldjs configuration and default templates")
  .action(async (options) => {
    Logger.brand();
    await Scaffold.setup(options.force);
    Logger.exit(0);
  });

// List command - list available templates and groups
program
  .command("list")
  .description("list available templates and groups")
  .action(() => {
    Logger.brand();
    Scaffold.list();
    Logger.exit(0);
  });

// Make command - generate a new resource
program
  .command("make <resource> <template>")
  .description(
    "generate a new resource (template can be: single template, comma-separated templates, or predefined group)"
  )
  .option("-v, --vars [vars...]", "list of var=value")
  .option("-f, --force", "force setup - this would override existing files")
  .action(async (resource, template, options) => {
    Logger.brand();
    console.log({ vars: options.vars });
    await Scaffold.make(resource, template, options.force);
    Logger.exit(0);
  });

// Inject command - inject a template into an existing file
program
  .command("inject <template> <file>")
  .description("inject a template into an existing file at a specific point")
  .option("-t, --target [target]", "the target point within the file")
  .option("-r, --resource [resource]", "the resource name")
  .action(async (template, file, options) => {
    Logger.brand();
    await Scaffold.inject(template, file, options.target, options.resource);
    Logger.exit(0);
  });

// Parse command line arguments
try {
  program.parse(process.argv);
} catch (error) {
  Scaffold.handleError(error);
  Logger.exit(1);
}

// Export for potential programmatic usage
export { Scaffold, Logger };
