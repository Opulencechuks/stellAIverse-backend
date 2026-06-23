import { AsyncLocalStorage } from 'async_hooks';

export interface LoggerContext {
  correlationId: string;
}

export const loggerContextStore = new AsyncLocalStorage<LoggerContext>();
