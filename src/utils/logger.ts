/* eslint-disable no-console */
const isDev = process.env.NODE_ENV !== 'production';

export interface Logger {
  debug: (...args: unknown[]) => void;
  info:  (...args: unknown[]) => void;
  warn:  (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

const noop = (): void => {};

export const logger: Logger = {
  debug: isDev ? console.debug.bind(console) : noop,
  info:  isDev ? console.info.bind(console)  : noop,
  warn:  console.warn.bind(console),
  error: (...args: unknown[]) => {
    console.error(...args);
    // Future: forward to error tracking (Sentry/Datadog) here.
    // Keep this branch silent in tests — do not throw.
  },
};

export default logger;
