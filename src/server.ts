// uncomment all console.logs() to ensure that config works the way its supposed to work.

import "reflect-metadata";
import path from "path";

import dotenv from "dotenv";
import ip from "ip";

import "@/utils/logging";
import config from "@/api/helpers/config/env";
import createAppServer from "@/app";
import { DatabaseInitialize } from "@/config/db.config";
// import { db_init } from "@/config/db.config";

dotenv.config();
process.env.NODE_CONFIG_DIR =
  config.node_config_dir || path.join(__dirname, "../config");

const Port = config.server.port;

// Check if .env loaded
// console.log("PORT from process.env:", process.env.PORT);

// Check if custom-environment-variables.json is loaded via the port
// console.log("Port from custom-env-var.json: ", config.server.port);

const initServer = async () => {
  try {
    const app = createAppServer();
    // always connect to the db before accepting traffic.
    await DatabaseInitialize.connect();
    app.listen(Port, () => {
      log.info("API Initialized");
      log.info(`Documentation with Swagger : ${ip.address()}:${Port}/api-docs`);
      log.info(`🚀 Server running on ${ip.address()}:${Port}`);
    });
  } catch (error: any) {
    log.error("Database connection error: " + error);
  }
};

// start the server
initServer();
