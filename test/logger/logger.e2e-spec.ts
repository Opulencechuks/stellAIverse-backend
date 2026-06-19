import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PinoLogger } from '../../src/config/nest-pino-logger';
import { logger } from '../../src/config/logger';

describe('Logging E2E Tests', () => {
  let app: INestApplication;
  let loggedChunks: any[] = [];
  let writeSpy: jest.SpyInstance;

  beforeAll(async () => {
    writeSpy = jest.spyOn((logger as any)[Symbol.for('pino.stream.write') || 'stream'] || process.stdout, 'write').mockImplementation((chunk: any) => {
      try {
        const str = typeof chunk === 'string' ? chunk : chunk.toString();
        const parsed = JSON.parse(str);
        loggedChunks.push(parsed);
      } catch (err) {
        // Fallback for non-JSON lines or when pretty print is used
      }
      return true;
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useLogger(app.get(PinoLogger));
    await app.init();
  });

  afterAll(async () => {
    writeSpy.mockRestore();
    await app.close();
  });

  beforeEach(() => {
    loggedChunks = [];
  });

  it('should include correlation ID in request/response logs and custom headers', async () => {
    const response = await request(app.getHttpServer())
      .get('/info')
      .set('x-correlation-id', 'test-correlation-123')
      .expect(200);

    expect(response.headers['x-correlation-id']).toBe('test-correlation-123');

    // Wait a brief tick to ensure log callbacks/events complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verify logs
    const reqLog = loggedChunks.find(chunk => chunk.type === 'request');
    const resLog = loggedChunks.find(chunk => chunk.type === 'response');

    expect(reqLog).toBeDefined();
    expect(reqLog.correlationId).toBe('test-correlation-123');
    expect(reqLog.method).toBe('GET');

    expect(resLog).toBeDefined();
    expect(resLog.correlationId).toBe('test-correlation-123');
    expect(resLog.statusCode).toBe(200);
  });

  it('should generate a new correlation ID if not provided in request', async () => {
    const response = await request(app.getHttpServer())
      .get('/info')
      .expect(200);

    const generatedId = response.headers['x-correlation-id'];
    expect(generatedId).toBeDefined();
    expect(typeof generatedId).toBe('string');
    expect(generatedId.length).toBeGreaterThan(0);

    await new Promise((resolve) => setTimeout(resolve, 100));

    const reqLog = loggedChunks.find(chunk => chunk.type === 'request');
    expect(reqLog).toBeDefined();
    expect(reqLog.correlationId).toBe(generatedId);
  });
});
