import { logger, createLogger } from "./logger";

describe("Logger Configuration Unit Tests", () => {
  it("should initialize logger correctly", () => {
    expect(logger).toBeDefined();
    expect(logger.level).toBeDefined();
  });

  it("should create child loggers with context properties", () => {
    const child = createLogger({ testKey: "testValue" });
    expect(child).toBeDefined();
    expect(typeof child.info).toBe("function");
  });
});
