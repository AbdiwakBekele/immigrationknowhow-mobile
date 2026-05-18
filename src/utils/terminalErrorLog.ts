const BANNER = '══════════════════════════════════════════════════';
export const TERMINAL_ERROR_PREFIX = '[IKH ERROR]';

function formatUnknown(error: unknown): string[] {
  if (error instanceof Error) {
    const lines = [`${error.name}: ${error.message}`];
    if (error.stack) lines.push(error.stack);
    return lines;
  }
  if (error === undefined || error === null) return ['(no details)'];
  if (typeof error === 'string') return [error];
  try {
    return [JSON.stringify(error, null, 2)];
  } catch {
    return [String(error)];
  }
}

/** Prints a highly visible error block in the Metro / Expo terminal. */
export function logTerminalError(
  kind: string,
  error: unknown,
  details?: Record<string, string | number | boolean | null | undefined>
) {
  if (!__DEV__) return;

  const lines: string[] = ['', BANNER, `${TERMINAL_ERROR_PREFIX} ${kind}`];

  if (details) {
    for (const [key, value] of Object.entries(details)) {
      if (value === undefined) continue;
      lines.push(`${TERMINAL_ERROR_PREFIX}   ${key}: ${value}`);
    }
  }

  for (const line of formatUnknown(error)) {
    lines.push(`${TERMINAL_ERROR_PREFIX}   ${line}`);
  }

  lines.push(BANNER, '');
  console.error(lines.join('\n'));
}

type ErrorUtilsGlobal = {
  getGlobalHandler: () => (error: Error, isFatal?: boolean) => void;
  setGlobalHandler: (handler: (error: Error, isFatal?: boolean) => void) => void;
};

function shouldSkipConsoleErrorBanner(args: unknown[]): boolean {
  const first = args[0];
  if (typeof first !== 'string') return false;
  return (
    first.includes(TERMINAL_ERROR_PREFIX) ||
    first.includes(BANNER) ||
    first.startsWith('[API]')
  );
}

function shouldBannerConsoleError(args: unknown[]): boolean {
  if (args.some((arg) => arg instanceof Error)) return true;
  const first = args[0];
  if (typeof first !== 'string') return false;
  return /\b(error|failed|exception|fatal|reject|referenceerror|typeerror)\b/i.test(first);
}

export function installTerminalErrorLogging() {
  if (!__DEV__) return;

  const errorUtils = (global as typeof globalThis & { ErrorUtils?: ErrorUtilsGlobal }).ErrorUtils;
  if (errorUtils?.getGlobalHandler && errorUtils.setGlobalHandler) {
    const previous = errorUtils.getGlobalHandler();
    errorUtils.setGlobalHandler((error, isFatal) => {
      logTerminalError(isFatal ? 'FATAL JS ERROR' : 'UNCAUGHT JS ERROR', error, {
        fatal: !!isFatal,
      });
      previous(error, isFatal);
    });
  }

  const proc = (global as typeof globalThis & { process?: NodeJS.Process }).process;
  if (proc?.on) {
    proc.on('unhandledRejection', (reason: unknown) => {
      logTerminalError('UNHANDLED PROMISE REJECTION', reason);
    });
  }

  const originalConsoleError = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    if (!shouldSkipConsoleErrorBanner(args) && shouldBannerConsoleError(args)) {
      const err = args.find((arg): arg is Error => arg instanceof Error);
      logTerminalError('console.error', err ?? args.map((arg) => String(arg)).join(' '));
    }
    originalConsoleError(...args);
  };

  console.log(
    '[IKH] Terminal error logging is ON — look for [IKH ERROR] banners in this Metro window.'
  );
}
