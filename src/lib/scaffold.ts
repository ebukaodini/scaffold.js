import path from "path";
import { Logger } from "./logger";
import { IO } from "./io";
import { Transform } from "./transformer";

export class Scaffold {
  private static pkgDir = path.resolve(__dirname, ".."); // Get the absolute path of the package directory
  private static pkgScaffolds = path.join(this.pkgDir, "scaffolds");

  private static templateDir = "scaffolds";
  private static configFile = "scaffold.config.json";
  private static config: any;

  // Regex to handle any variable
  private static variableRegex =
    /\{{2}([a-zA-Z_][a-zA-Z0-9_]*)(\.(raw|singular|plural|lowerCase|upperCase|sentenceCase|camelCase|pascalCase|snakeCase|hyphenCase|spaceCase))*\}{2}/g;

  private static commandVariables: Record<string, string> = {};

  static async setup(force: boolean = false) {
    try {
      // adding config file
      await this.createConfigFile(force);
      await this.createScaffolds(force);

      Logger.success("Setup completed successfully 🎉");
    } catch (error) {
      this.handleError(error, false);
    }
  }

  static list() {
    try {
      this.parseConfig();

      const templates = this.config.templates;
      const templateKeys = Object.keys(templates);

      if (templateKeys.length === 0) {
        throw new Error("No templates found in configuration");
      }

      const maxKeyLength = Math.max(...templateKeys.map((k) => k.length));

      // List individual templates
      const individualTemplates = templateKeys.filter(
        (key) =>
          !Array.isArray(templates[key]) && templates[key].dest !== "inject"
      );
      if (individualTemplates.length > 0) {
        Logger.info("Individual templates:");
        individualTemplates.forEach((template) => {
          const templateInfo = templates[template];
          Logger.muted(
            `• ${template.padEnd(maxKeyLength)}\t\t\t${templateInfo.description || "No description"}`
          );
        });
      }

      // List injected templates
      const injectedTemplates = templateKeys.filter(
        (key) => templates[key].dest === "inject"
      );
      if (injectedTemplates.length > 0) {
        Logger.info("Injected templates:");
        injectedTemplates.forEach((inject) => {
          const templateInfo = templates[inject];
          Logger.muted(
            `• ${inject}\t\t\t${templateInfo.description || "No description"}`
          );
        });
      }

      // List predefined groups
      const groups = templateKeys.filter((key) =>
        Array.isArray(templates[key])
      );
      if (groups.length > 0) {
        Logger.info("Predefined groups:");
        groups.forEach((group) => {
          const groupTemplates = templates[group];
          Logger.muted(`• ${group}\t\t\t${groupTemplates.join(", ")}`);
        });
      }
    } catch (error) {
      this.handleError(error, false);
    }
  }

  static async make(
    resource: string,
    template: string,
    vars: string[] = [],
    force: boolean = false
  ) {
    try {
      // Parse the config
      this.parseConfig();

      Logger.info(`Generating resources for: ${resource}`);

      // Get available templates from config
      const templates = this.config.templates;
      const templateKeys = Object.keys(templates);

      if (templateKeys.length === 0) {
        throw new Error("No templates found in configuration");
      }

      // Parse variables from command line
      const parsedVars = this.parseVariables(vars);
      // Add resource as the default variable
      this.commandVariables = { resource, ...parsedVars };

      // Parse the template parameter to get list of templates to generate
      const templatesToGenerate = this.parseTemplateParameter(
        template,
        templates
      );

      if (templatesToGenerate.length === 0) {
        throw new Error(`No valid templates found for: ${template}`);
      }

      let templateGenerated = 0;
      // Generate each selected template
      for (const templateKey of templatesToGenerate) {
        const templateConfig = templates[templateKey];
        const generated = await this.generateFromTemplate(
          templateKey,
          templateConfig,
          force
        );

        if (generated) templateGenerated++;
      }

      if (templateGenerated > 0)
        Logger.success(
          `Successfully generated ${templateGenerated} resource(s) for: ${resource} 🎉`
        );
    } catch (error) {
      this.handleError(error, false);
    }
  }

  static async inject(
    template: string,
    file: string,
    target?: string,
    resource?: string,
    vars: string[] = []
  ) {
    try {
      // Parse the config
      this.parseConfig();

      Logger.info(`Injecting ${template} into ${file} at: ${target ?? "N/A"}`);

      // Check if target file exists
      if (!IO.exists(file)) {
        Logger.failure(`Target file ${file} does not exist`);
        return;
      }

      // Get available templates from config
      const templates = this.config.templates;

      // Check if template exists
      if (!templates[template]) {
        Logger.failure(`Template '${template}' not found in configuration`);
        return;
      }

      const templateConfig = templates[template];

      // Parse variables from command line
      const parsedVars = this.parseVariables(vars);
      // Add resource if provided
      this.commandVariables = resource
        ? { resource, ...parsedVars }
        : parsedVars;

      // Process template source path with variables
      const srcPath = this.processVariables(templateConfig.src);

      // Check if source template exists
      if (!IO.exists(srcPath)) {
        Logger.failure(`Template file not found: ${srcPath}`);
        return;
      }

      // Read template content
      let content = IO.readFile(srcPath);

      // Find out if there are any variables in the template
      const containsVars = this.variableRegex.test(content);
      const requiredVars = this.extractVariablesFromContent(content);

      // Check if all required variables are provided
      if (containsVars && requiredVars.length > 0) {
        const missingVars = requiredVars.filter(
          (varName) => !this.commandVariables[varName]
        );
        if (missingVars.length > 0) {
          throw new Error(
            `Template ${template} requires variables: ${missingVars.join(", ")} but they were not provided`
          );
        }
      }

      // Process template variables
      content = this.processVariables(content);

      // Read target file
      let targetContent = IO.readFile(file);
      let injectedContent = targetContent;

      if (target === undefined) {
        const promptInput = await IO.promptInput<"t" | "b">(
          "Target point not found. Attach to file top/bottom? (t/b/N): "
        );
        const shouldAppendToFile = promptInput.toLowerCase() === "b";
        const shouldPrependToFile = promptInput.toLowerCase() === "t";

        if (!shouldAppendToFile && !shouldPrependToFile) {
          Logger.muted(`Skipping injection`);
          return;
        }

        // Check if content already exists (to avoid duplicates)
        if (targetContent.includes(content.trim())) {
          Logger.muted(`Content already exists in ${file}, skipping injection`);
          return;
        }

        // Inject content at the start of the file
        if (shouldPrependToFile) {
          injectedContent = content.concat(`\n${targetContent}`);
        }

        // Inject content at the end of the file
        if (shouldAppendToFile) {
          injectedContent = targetContent.concat(`\n${content}`);
        }
      } else {
        // Check if injection point exists
        if (!targetContent.includes(target)) {
          throw new Error(`Injection point '${target}' not found in ${file}`);
        }

        // Check if content already exists (to avoid duplicates)
        if (targetContent.includes(content.trim())) {
          Logger.muted(`Content already exists in ${file}, skipping injection`);
          return;
        }

        // Inject content at the specified point
        injectedContent = targetContent.replace(
          target,
          `${target}\n${content}\n`
        );
      }

      // Write the modified file
      IO.writeFile(file, injectedContent, true);

      Logger.success(`Successfully injected ${srcPath} into ${file} 🎉`);
    } catch (error) {
      this.handleError(error, false);
    }
  }

  private static async createConfigFile(force: boolean) {
    Logger.info("Adding scaffold.config.json...");
    const configContent = IO.readFile(path.join(this.pkgDir, this.configFile));

    // Check if destination file exists and handle override logic
    if (IO.exists(this.configFile)) {
      if (!force) {
        const shouldOverwrite = await IO.promptUser(
          `File ${this.configFile} already exists. Overwrite? (y/N): `
        );
        if (!shouldOverwrite) {
          Logger.muted(`Skipping ${this.configFile} (file exists)`);
          return;
        }
      }
    }

    // Write the config content
    IO.writeFile(this.configFile, configContent, true);
    Logger.success("Added ✅", false);
  }

  private static async createScaffolds(force: boolean) {
    Logger.info("Adding default templates to ./scaffolds");

    // Check if destination file exists and handle override logic
    if (IO.exists(this.templateDir)) {
      if (!force) {
        const shouldOverwrite = await IO.promptUser(
          `Directory ${this.templateDir} already exists. Overwrite? (y/N): `
        );
        if (!shouldOverwrite) {
          Logger.muted(`Skipping ${this.templateDir} (directory exists)`);
          return;
        }
      }
    }

    // Write the scaffolds
    IO.copyDir(this.pkgScaffolds, this.templateDir, true);
    Logger.success("Added ✅", false);
  }

  private static parseConfig() {
    if (!IO.exists(this.configFile)) {
      throw new Error(
        `Config file ${this.configFile} does not exist. Run \`npx scaffold setup\``
      );
    }

    this.config = JSON.parse(IO.readFile(this.configFile));
  }

  private static parseTemplateParameter(
    template: string,
    templates: any
  ): string[] {
    // Handle predefined groups
    if (templates[template] && Array.isArray(templates[template])) {
      const groupTemplates: string[] = templates[template];
      Logger.muted(
        `Using predefined group '${template}': ${groupTemplates.join(", ")}`
      );

      const validTemplates = groupTemplates.filter(
        (t) => templates[t] && templates[t].dest !== "inject"
      );

      if (validTemplates.length !== groupTemplates.length) {
        const invalidTemplates = groupTemplates.filter(
          (t) => !validTemplates.includes(t)
        );

        Logger.muted(
          `Invalid templates ignored: ${invalidTemplates.join(", ")} ⚠️`
        );
      }

      return validTemplates;
    }

    // Handle comma-separated templates (like "controller,dto,entity")
    if (template.includes(",")) {
      const templateList = template.split(",").map((t) => t.trim());
      const validTemplates = templateList.filter(
        (t) => templates[t] && templates[t].dest !== "inject"
      );

      if (validTemplates.length !== templateList.length) {
        const invalidTemplates = templateList.filter(
          (t) => !validTemplates.includes(t)
        );

        Logger.muted(
          `Invalid templates ignored: ${invalidTemplates.join(", ")} ⚠️`
        );
      }

      return validTemplates;
    }

    // Handle single template (like "controller")
    if (templates[template]) {
      return [template];
    }

    // Template not found
    return [];
  }

  private static async generateFromTemplate(
    templateKey: string,
    template: any,
    force: boolean
  ) {
    try {
      Logger.info(`Generating ${templateKey}...`);

      // Collect ALL missing variables from template config and content
      await this.collectAllRequiredVariables(template);

      // Now safely process paths with complete variables
      const srcPath = this.processVariables(template.src);
      const destPath = this.processVariables(template.dest);

      // Check if source template exists
      if (!IO.exists(srcPath)) {
        Logger.muted(`Template not found: ${srcPath} ⚠️`);
        return false;
      }

      // Read and process template content
      let content = IO.readFile(srcPath);
      content = this.processVariables(content);

      // Create destination directory if it doesn't exist
      const destDir = path.dirname(destPath);
      if (!IO.exists(destDir)) {
        IO.makeDir(destDir, force);
      }

      // Handle file overwriting
      if (IO.exists(destPath)) {
        if (!force) {
          const shouldOverwrite = await IO.promptUser(
            `File ${destPath} already exists. Overwrite? (y/N): `
          );
          if (!shouldOverwrite) {
            Logger.muted(`Skipping ${templateKey} (file exists)`);
            return false;
          }
        }
      }

      // Write the generated file
      IO.writeFile(destPath, content, true);

      Logger.success(`Generated: ${destPath} ✅`, false);
      return true;
    } catch (error: any) {
      Logger.failure(
        `Failed to generate ${templateKey}: ${error.message} ‼️`,
        false
      );
      return false;
    }
  }

  private static parseVariables(vars: string[]): Record<string, string> {
    const variables: Record<string, string> = {};

    vars.forEach((v) => {
      if (v.includes("=")) {
        const [key, value] = v.split("=");
        if (key && value) {
          variables[key.trim()] = value.trim();
        }
      }
    });

    return variables;
  }

  private static async collectAllRequiredVariables(
    template: any
  ): Promise<void> {
    const allRequiredVars = new Set<string>();

    // Extract variables from template src and dest paths
    const srcVars = this.extractVariablesFromContent(template.src);
    const destVars = this.extractVariablesFromContent(template.dest);

    srcVars.forEach((v) => allRequiredVars.add(v));
    destVars.forEach((v) => allRequiredVars.add(v));

    // Try to process src path to read template content
    // First, collect variables needed for src path
    const srcMissingVars = srcVars.filter((v) => !this.commandVariables[v]);

    if (srcMissingVars.length > 0) {
      for (const varName of srcMissingVars) {
        const value = await this.promptForVariable(varName);
        if (value) {
          this.commandVariables[varName] = value;
        }
      }
    }

    // Now process src path and read template content
    const srcPath = this.processVariables(template.src);

    if (IO.exists(srcPath)) {
      const templateContent = IO.readFile(srcPath);
      const contentVars = this.extractVariablesFromContent(templateContent);
      contentVars.forEach((v) => allRequiredVars.add(v));
    } else {
      Logger.muted(`Cannot read template content from: ${srcPath}`);
    }

    // Collect any remaining missing variables
    const allMissingVars = Array.from(allRequiredVars).filter(
      (v) => !this.commandVariables[v]
    );

    if (allMissingVars.length > 0) {
      for (const varName of allMissingVars) {
        const value = await this.promptForVariable(varName);
        if (value) {
          this.commandVariables[varName] = value;
        }
      }
    }
  }

  private static async promptForVariable(
    varName: string
  ): Promise<string | null> {
    try {
      const promptValue = await IO.promptInput<string>(
        `Enter value for '${varName}' (or press Enter to skip): `
      );

      const variableValue = promptValue.trim();

      if (variableValue) {
        return variableValue;
      } else {
        return null;
      }
    } catch (error) {
      Logger.muted(`Error collecting variable '${varName}', skipping.`);
      return null;
    }
  }

  private static extractVariablesFromContent(content: string): string[] {
    const variables = new Set<string>();

    // Reset regex to start from beginning
    this.variableRegex.lastIndex = 0;

    let match;
    while ((match = this.variableRegex.exec(content)) !== null) {
      const varName = match[1];
      if (varName) {
        variables.add(varName);
      }
    }

    return Array.from(variables);
  }

  private static processVariables(content: string): string {
    let processedContent = content;

    // Reset regex to start from beginning
    this.variableRegex.lastIndex = 0;

    // Replace all variable instances with their transformed values
    processedContent = processedContent.replace(
      this.variableRegex,
      (match, varName) => {
        // Check if variable exists
        if (!this.commandVariables[varName]) {
          // Log warning and return the original match unchanged
          Logger.muted(
            `Variable '${varName}' not found in provided variables, leaving as-is ⚠️`
          );
          return match;
        }

        // Extract the transformation part (e.g., "resource.singular.lowerCase" -> "singular.lowerCase")
        const transformation = match
          .replace(`{{${varName}.`, "")
          .replace("}}", "");

        return Transform.transform(
          transformation,
          this.commandVariables[varName]
        );
      }
    );

    return processedContent;
  }

  static handleError(error: any, nl: boolean = true) {
    Logger.failure(`${error.code ?? "Error"}: ${error.message} 🚨`, nl);
  }
}
