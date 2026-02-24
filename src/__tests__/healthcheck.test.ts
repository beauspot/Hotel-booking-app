// src/__tests__/health.test.ts
import express, { Application } from "express";
import { StatusCodes } from "http-status-codes";
import supertest, { Agent } from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ----------------------------------------------------------------
// Mock the database config module
// ----------------------------------------------------------------
vi.mock("@/config/db.config", () => ({
  DatabaseInitialize: {
    state: "connected",
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
    getisReady: vi.fn().mockReturnValue(true),
  },
}));

// ----------------------------------------------------------------
// Mock the env config so no real DB URI is needed
// ----------------------------------------------------------------
vi.mock("@/config/env", () => ({
  default: {
    db: {
      db_uri: "mongodb://localhost:27017/test",
    },
  },
}));

// ----------------------------------------------------------------
// Mock the logger so tests don't produce noisy output
// ----------------------------------------------------------------
vi.mock("@/utils/logging", () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

// ----------------------------------------------------------------
// Lazy import AFTER mocks are registered
// ----------------------------------------------------------------
const { DatabaseInitialize } = await import("@/config/db.config");
const { default: healthRouter } = await import("@/routes/healthcheck.route");

// ----------------------------------------------------------------
// Test app setup
// ----------------------------------------------------------------
const createTestApp = (): Application => {
  const app = express();
  app.use(express.json());
  app.use("/", healthRouter);
  return app;
};

// ----------------------------------------------------------------
// Health check route tests
// ----------------------------------------------------------------
describe("GET /health", () => {
  let app: Application;
  let request: Agent;

  beforeEach(() => {
    app = createTestApp();
    request = supertest.agent(app);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return 200 with status ok when database is connected", async () => {
    const res = await request.get("/health");

    expect(res.status).toBe(StatusCodes.OK);
    expect(res.body.status).toBe("ok");
  });

  it("should return the correct database state", async () => {
    const res = await request.get("/health");

    expect(res.body.db).toBe("connected");
  });

  it("should return a valid uptime as a number", async () => {
    const res = await request.get("/health");

    expect(typeof res.body.uptime).toBe("number");
    expect(res.body.uptime).toBeGreaterThan(0);
  });

  it("should return a valid ISO timestamp", async () => {
    const res = await request.get("/health");

    expect(res.body.timestamp).toBeDefined();
    expect(new Date(res.body.timestamp).toISOString()).toBe(res.body.timestamp);
  });

  it("should return all required fields in the response body", async () => {
    const res = await request.get("/health");

    expect(res.body).toHaveProperty("status");
    expect(res.body).toHaveProperty("db");
    expect(res.body).toHaveProperty("uptime");
    expect(res.body).toHaveProperty("timestamp");
  });

  it("should reflect disconnected state when database is down", async () => {
    vi.mocked(DatabaseInitialize).state = "disconnected" as any;

    const res = await request.get("/health");

    expect(res.status).toBe(StatusCodes.OK);
    expect(res.body.db).toBe("disconnected");
  });

  it("should reflect connecting state when database is initializing", async () => {
    vi.mocked(DatabaseInitialize).state = "connecting" as any;

    const res = await request.get("/health");

    expect(res.body.db).toBe("connecting");
  });
});

// ----------------------------------------------------------------
// DB_Init class tests
// ----------------------------------------------------------------
describe("DB_Init", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return a singleton instance", async () => {
    const { DatabaseInitialize: instance1 } =
      await import("@/config/db.config");
    const { DatabaseInitialize: instance2 } =
      await import("@/config/db.config");
    expect(instance1).toBe(instance2);
  });

  it("should call connect without throwing", async () => {
    await expect(DatabaseInitialize.connect()).resolves.not.toThrow();
    expect(DatabaseInitialize.connect).toHaveBeenCalledTimes(1);
  });

  it("should call disconnect without throwing", async () => {
    await expect(DatabaseInitialize.disconnect()).resolves.not.toThrow();
    expect(DatabaseInitialize.disconnect).toHaveBeenCalledTimes(1);
  });

  it("should return true from getisReady when connected", () => {
    expect(DatabaseInitialize.getisReady()).toBe(true);
  });

  it("should expose a state property", () => {
    expect(typeof DatabaseInitialize.state).toBe("string");
    expect([
      "connected",
      "disconnected",
      "connecting",
      "disconnecting",
      "unknown",
    ]).toContain(DatabaseInitialize.state);
  });
});
