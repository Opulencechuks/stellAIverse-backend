import { loggerContextStore } from '../../src/common/logger-context.store';
import { logger } from '../../src/config/logger';

describe('Pino Logger with Correlation ID', () => {
  it('should include correlationId when context is set', () => {
    const testId = 'test-correlation-id';
    loggerContextStore.run({ correlationId: testId }, () => {
      const logSpy = jest.spyOn(logger, 'info');
      logger.info({ message: 'test' });
      expect(logSpy).toHaveBeenCalledWith({
        message: 'test',
        correlationId: testId,
      });
    });
  });
});
