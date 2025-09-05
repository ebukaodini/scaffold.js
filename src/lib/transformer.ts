import { plural, singular } from "pluralize";

export type Transformation =
  | "raw"
  | "singular"
  | "plural"
  | "lowerCase"
  | "upperCase"
  | "sentenceCase"
  | "camelCase"
  | "pascalCase"
  | "snakeCase"
  | "spaceCase"
  | "hyphenCase";

export class Transform {
  static transform(transformation: string, value: string) {
    if (!transformation) {
      return value;
    }

    // split the transformation string into individual transformations
    const transformChain = transformation.split(".") as Transformation[];

    // transform the variable value
    let transformedValue = value;
    transformChain.forEach((t: Transformation) => {
      switch (t) {
        case "raw":
          // Return the value as-is without any transformation
          transformedValue = value;
          break;
        case "singular":
          transformedValue = this.singularize(transformedValue);
          break;
        case "plural":
          transformedValue = this.pluralize(transformedValue);
          break;
        case "lowerCase":
          transformedValue = this.toLowerCase(transformedValue);
          break;
        case "upperCase":
          transformedValue = this.toUpperCase(transformedValue);
          break;
        case "sentenceCase":
          transformedValue = this.toSentenceCase(transformedValue);
          break;
        case "camelCase":
          transformedValue = this.toCamelCase(transformedValue);
          break;
        case "pascalCase":
          transformedValue = this.toPascalCase(transformedValue);
          break;
        case "snakeCase":
          transformedValue = this.toSnakeCase(transformedValue);
          break;
        case "spaceCase":
          transformedValue = this.toSpaceCase(transformedValue);
          break;
        case "hyphenCase":
          transformedValue = this.toHyphenCase(transformedValue);
          break;
        default:
          break;
      }
    });

    return transformedValue;
  }

  static singularize(value: string) {
    return singular(value);
  }

  static pluralize(value: string) {
    return plural(value);
  }

  static toLowerCase(value: string) {
    return value.toLowerCase();
  }

  static toUpperCase(value: string) {
    return value.toUpperCase();
  }

  static toSentenceCase(value: string) {
    return [
      this.toUpperCase(value.charAt(0)),
      this.toLowerCase(value.substring(1)),
    ].join("");
  }

  static toCamelCase(value: string) {
    return value
      .split("-")
      .map((w, i) => (i === 0 ? this.toLowerCase(w) : this.toSentenceCase(w)))
      .join("");
  }

  static toPascalCase(value: string) {
    return value
      .split("-")
      .map((w) => this.toSentenceCase(w))
      .join("");
  }

  static toSnakeCase(value: string) {
    return this.toLowerCase(value).replace(/-/g, "_");
  }

  static toSpaceCase(value: string) {
    return this.toLowerCase(value).replace(/-/g, " ");
  }

  static toHyphenCase(value: string) {
    return this.toLowerCase(value).replace(/ /g, "-");
  }
}
