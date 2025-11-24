import chalk from 'chalk';

export class Logger {
  static info(message: string): void {
    console.log(chalk.blue('ℹ'), message);
  }

  static success(message: string): void {
    console.log(chalk.green('✓'), message);
  }

  static error(message: string): void {
    console.error(chalk.red('✗'), message);
  }

  static warn(message: string): void {
    console.warn(chalk.yellow('⚠'), message);
  }

  static log(message: string): void {
    console.log(message);
  }

  static verbose(message: string, verbose: boolean = false): void {
    if (verbose) {
      console.log(chalk.gray('→'), message);
    }
  }
}
