import fs from "fs";
import readline from "readline";
import { Logger } from "./logger";
import chalk from "chalk";

export class IO {
  static exists(path: string) {
    return fs.existsSync(path);
  }

  static readFile(path: string) {
    if (!this.exists(path)) {
      throw new Error(`File ${path} does not exist.`);
    }

    return fs.readFileSync(path, "utf8");
  }

  static writeFile(path: string, content: string, force: boolean = false) {
    if (this.exists(path)) {
      if (force) Logger.muted(`Overwriting existing file: ${path}...`);
      else
        throw new Error(`File ${path} already exists, use --force to enforce.`);
    }

    fs.writeFileSync(path, content);
  }

  static makeDir(dir: string, force: boolean = false) {
    if (this.exists(dir)) {
      if (force) {
        Logger.muted(`Overwriting existing directory: ${dir}...`);
        // Remove existing directory if force is true
        fs.rmSync(dir, { recursive: true, force: true });
      } else {
        throw new Error(
          `Directory ${dir} already exists, use --force to enforce.`
        );
      }
    }

    fs.mkdirSync(dir, { recursive: true });
  }

  static copyDir(src: string, dest: string, force: boolean = false) {
    if (!this.exists(src)) {
      throw new Error(`Path ${src} does not exist.`);
    }

    this.makeDir(dest, force);
    fs.cpSync(src, dest, { recursive: true });
  }

  static copy(src: string, dest: string, force: boolean = false) {
    if (!this.exists(src)) {
      throw new Error(`File ${src} does not exist.`);
    }

    if (this.exists(dest)) {
      if (force) Logger.muted(`Overwriting existing file: ${dest}...`);
      else
        throw new Error(`File ${dest} already exists, use --force to enforce.`);
    }

    fs.copyFileSync(src, dest);
  }

  static async promptUser(question: string): Promise<boolean> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) => {
      rl.question(` ${chalk.grey(question)}`, (answer) => {
        rl.close();
        resolve(answer.toLowerCase().startsWith("y"));
      });
    });
  }

  static async promptInput<T>(question: string): Promise<T> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) => {
      rl.question(` ${chalk.grey(question)}`, (answer) => {
        rl.close();
        resolve(answer as unknown as T);
      });
    });
  }
}
