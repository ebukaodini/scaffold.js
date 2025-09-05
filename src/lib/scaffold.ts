import path from "path";
import { Logger } from "./logger";
import { IO } from "./io";
import { Transform } from "./transformer";

type Template = {
  src: string;
  dest: string | "inject";
  vars?: Record<string, string>;
};

export class Scaffold {
  private static pkgDir = path.resolve(__dirname, ".."); // Get the absolute path of the package directory
  private static pkgScaffolds = path.join(this.pkgDir, "scaffolds");

  private static templateDir = "scaffolds";
  private static configFile = "scaffold.config.json";
  private static config: any;

  private static resourceVarRegex =
    /\{{2}(resource)(\.(raw|singular|plural|lowerCase|upperCase|sentenceCase|camelCase|pascalCase|snakeCase|spaceCase))*\}{2}/g;

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

      // Parse the template parameter to get list of templates to generate
      const templatesToGenerate = this.parseTemplateParameter(
        template,
        templates
      );

      if (templatesToGenerate.length === 0) {
        throw new Error(`No valid templates found for: ${template}`);
      }

      // Generate each selected template
      for (const templateKey of templatesToGenerate) {
        const template = templates[templateKey];
        await this.generateFromTemplate(templateKey, template, resource, force);
      }

      Logger.success(
        `Successfully generated ${templatesToGenerate.length} resource(s) for: ${resource} 🎉`
      );
    } catch (error) {
      this.handleError(error, false);
    }
  }

  static async inject(
    template: string,
    file: string,
    target?: string,
    resource?: string
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

      // Check if source template exists

      const srcPath = this.processVariables(templateConfig.src, resource ?? "");
      if (!IO.exists(srcPath)) {
        Logger.failure(`Template file not found: ${srcPath}`);
        return;
      }

      // Read template content
      let content = IO.readFile(srcPath);

      // Find out if there are any resource variables in the template
      const containsVars = this.resourceVarRegex.test(content);

      if (resource === undefined && containsVars) {
        throw new Error(
          `Template ${template} contains resource variable but no resource was provided`
        );
      }

      // Process template variables
      content = this.processVariables(
        content,
        resource ?? ""
        // templateConfig.vars || ["resource"]
      );

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
          injectedContent = targetContent.concat(`\n${content}\n`);
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
    resource: string,
    force: boolean
  ) {
    try {
      Logger.info(`Generating ${templateKey}...`);

      // Process template source and destination paths
      const srcPath = this.processVariables(template.src, resource);
      const destPath = this.processVariables(template.dest, resource);

      // Check if source template exists
      if (!IO.exists(srcPath)) {
        Logger.muted(`Template not found: ${srcPath} ⚠️`);
        return;
      }

      // Read template content
      let content = IO.readFile(srcPath);

      // Process template variables
      content = this.processVariables(
        content,
        resource
        // template.vars || ["resource"]
      );

      // Create destination directory if it doesn't exist
      const destDir = path.dirname(destPath);
      if (!IO.exists(destDir)) {
        IO.makeDir(destDir, force);
      }

      // Check if destination file exists and handle override logic
      if (IO.exists(destPath)) {
        if (!force) {
          const shouldOverwrite = await IO.promptUser(
            `File ${destPath} already exists. Overwrite? (y/N): `
          );
          if (!shouldOverwrite) {
            Logger.muted(`Skipping ${templateKey} (file exists)`);
            return;
          }
        }
      }

      // Write the generated file
      IO.writeFile(destPath, content, true);

      Logger.success(`Generated: ${destPath} ✅`, false);
    } catch (error: any) {
      Logger.failure(
        `Failed to generate ${templateKey}: ${error.message} ‼️`,
        false
      );
    }
  }

  private static parseVariables(vars: string[]) {
    let variables = {};

    vars.forEach((v) => {
      if (v.includes("=")) {
        const [k, value] = v.split("=");
        variables = { ...variables, [k!]: value };
      }
    });

    return variables;
  }

  // In the future, this method would accept a list of variables and their values
  // Now, it is processing any variable and replace it with the resource value transformed
  private static processVariables(content: string, resource: string): string {
    let processedContent = content;

    // Process each variable
    // for (const varName of vars) {
    // }

    const varName = "resource";
    // Replace all instances of {{varName.transformation}} with transformed values
    processedContent = processedContent.replace(
      this.resourceVarRegex,
      (match) => {
        // Extract the transformation part (e.g., "resource.singular.lowerCase" -> "singular.lowerCase")
        const transformation = match
          .replace(`{{${varName}.`, "")
          .replace("}}", "");
        return Transform.transform(transformation, resource);
      }
    );

    return processedContent;
  }

  static handleError(error: any, nl: boolean = true) {
    Logger.failure(`${error.code ?? "Error"}: ${error.message} 🚨`, nl);
  }
}
