import mongoose from "mongoose";

import config from "@/config/env";
import log from "@/utils/logging";

const MONGO_URI = config.db.db_uri;

const mongooseOpt: mongoose.ConnectOptions = {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  maxPoolSize: 10,
  minPoolSize: 2,
};

class DB_Init {
  private static instance: DB_Init;
  private isConnected = false;

  private constructor() {}

  static getInstance(): DB_Init {
    if (!DB_Init.instance) DB_Init.instance = new DB_Init();
    return DB_Init.instance;
  }

  async connect(): Promise<void> {
    if (this.isConnected) {
      log.info("📦 MongoDB already connected");
      return;
    }

    try {
      this.registerEventListeners();
      await mongoose.connect(MONGO_URI, mongooseOpt);
      this.isConnected = true;
      log.info("Connected to MongoDB");
    } catch (error: any) {
      log.error("💥 MongoDB initial connection failed: ", error.message);
      process.exit(1);
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) return;

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      log.info("🔌 MongoDB disconnected");
    } catch (error: any) {
      log.error("Error duringMongoDB disconnect: ", error.message);
    }
  }

  private registerEventListeners(): void {
    mongoose.connection.on("connected", () =>
      log.info("📦 MongoDB connected & ✅ Mongoose connected to MongoDB"),
    );

    mongoose.connection.on("disconnected", () => {
      log.warn("🔴 Mongoose disconnected");
      this.isConnected = false;
    });

    mongoose.connection.on("reconnected", () => {
      log.info("🔁 Mongoose reconnected");
      this.isConnected = true;
    });

    mongoose.connection.on("error", (err: any) => {
      log.error("❌ Mongoose connection error", err);
      this.isConnected = false;
    });

    process.on("SIGINT", () => this.gracefulShutdown("SIGINT"));
    process.on("SIGTERM", () => this.gracefulShutdown("SIGTERM"));
  }

  private async gracefulShutdown(signal: string): Promise<void> {
    log.warn(`⚠️  Received ${signal}, closing MongoDB connection...`);
    await this.disconnect();
    process.exit(0);
  }

  getisReady(): boolean {
    return this.isConnected;
  }

  get state(): string {
    const states: Record<number, string> = {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting",
    };
    return states[mongoose.connection.readyState] ?? "unknown";
  }
}

export const DatabaseInitialize = DB_Init.getInstance();
