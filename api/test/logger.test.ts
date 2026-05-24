/**
 * Unit tests for the structured logger utility.
 */
import { logger, log } from "../src/utils/logger";

describe("Logger", () => {
  it("should export logger object with standard log levels", () => {
    expect(logger).toHaveProperty("debug");
    expect(logger).toHaveProperty("info");
    expect(logger).toHaveProperty("warn");
    expect(logger).toHaveProperty("error");
    expect(logger).toHaveProperty("child");

    expect(typeof logger.info).toBe("function");
    expect(typeof logger.error).toBe("function");
    expect(typeof logger.warn).toBe("function");
    expect(typeof logger.debug).toBe("function");
  });

  it("should export pre-created component loggers", () => {
    expect(log).toHaveProperty("email");
    expect(log).toHaveProperty("cron");
    expect(log).toHaveProperty("queue");
    expect(log).toHaveProperty("auth");
    expect(log).toHaveProperty("db");
    expect(log).toHaveProperty("api");
    expect(log).toHaveProperty("pdf");
    expect(log).toHaveProperty("samvad");
    expect(log).toHaveProperty("audit");
  });

  it("child() should create a logger with fixed context", () => {
    const childLogger = logger.child("TEST_CONTEXT");
    expect(typeof childLogger.info).toBe("function");
    expect(typeof childLogger.error).toBe("function");
  });

  it("log functions should complete without throwing", () => {
    expect(() => {
      logger.info("TEST", "Test info message");
      logger.warn("TEST", "Test warn message");
      logger.debug("TEST", "Test debug message");
      logger.error("TEST", "Test error message");
    }).not.toThrow();
  });

  it("log functions should accept optional data parameter", () => {
    expect(() => {
      logger.info("TEST", "With data", { key: "value", count: 42 });
      logger.error("TEST", "With error", { operation: "test" }, new Error("test error"));
    }).not.toThrow();
  });

  it("pre-created loggers should work", () => {
    expect(() => {
      log.email.info("Test email log");
      log.cron.warn("Test cron warning");
      log.queue.error("Test queue error");
      log.auth.info("Test auth log");
      log.samvad.info("Test samvad log");
    }).not.toThrow();
  });
});
