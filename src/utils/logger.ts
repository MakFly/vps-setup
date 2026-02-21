import chalk from "chalk";

type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

let currentLevel: LogLevel = "info";

/**
 * Set the current log level
 */
export function setLogLevel(level: LogLevel): void {
  currentLevel = level;
}

/**
 * Log debug message
 */
export function debug(message: string, ...args: unknown[]): void {
  if (LOG_LEVELS[currentLevel] <= LOG_LEVELS.debug) {
    console.log(chalk.gray(`[DEBUG] ${message}`), ...args);
  }
}

/**
 * Log info message
 */
export function info(message: string, ...args: unknown[]): void {
  if (LOG_LEVELS[currentLevel] <= LOG_LEVELS.info) {
    console.log(chalk.blue(`ℹ ${message}`), ...args);
  }
}

/**
 * Log success message
 */
export function success(message: string, ...args: unknown[]): void {
  if (LOG_LEVELS[currentLevel] <= LOG_LEVELS.info) {
    console.log(chalk.green(`✓ ${message}`), ...args);
  }
}

/**
 * Log warning message
 */
export function warn(message: string, ...args: unknown[]): void {
  if (LOG_LEVELS[currentLevel] <= LOG_LEVELS.warn) {
    console.log(chalk.yellow(`⚠ ${message}`), ...args);
  }
}

/**
 * Log error message
 */
export function error(message: string, ...args: unknown[]): void {
  if (LOG_LEVELS[currentLevel] <= LOG_LEVELS.error) {
    console.log(chalk.red(`✗ ${message}`), ...args);
  }
}

/**
 * Log a step in a process
 */
export function step(step: number, total: number, message: string): void {
  console.log(chalk.cyan(`  [${step}/${total}] ${message}`));
}

/**
 * Clear the current line and write a new message
 */
export function updateLine(message: string): void {
  process.stdout.write(`\r${message}`);
}

/**
 * Print a blank line
 */
export function newline(): void {
  console.log();
}

/**
 * Print a header
 */
export function header(title: string): void {
  const line = "═".repeat(title.length + 4);
  console.log(chalk.cyan(`\n╔${line}╗`));
  console.log(chalk.cyan(`║  ${chalk.bold(title)}  ║`));
  console.log(chalk.cyan(`╚${line}╝\n`));
}
