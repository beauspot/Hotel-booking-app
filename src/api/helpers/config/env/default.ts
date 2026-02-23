import * as dotenv from "dotenv";

import { AppConfig } from "@/interface/config";
dotenv.config();

// Default configuration for the application
// This file is used to set up default values for the environment variables
// and can be overridden by environment-specific configurations.

// put an interface here to make sure the config matches certain criteria.
// Set validation with zod.

const default_config: AppConfig = {
  node_env: process.env.NODE_ENV || "development",
  node_config_dir: process.env.NODE_CONFIG_DIR,
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
  },
  db: {
    db_uri: process.env.MONGO_URI as string,
  },
  jwt_token: {
    j_token: process.env.JWT_TOKEN as string,
  },
  refresh_token: {
    r_token: process.env.REFRESH_TOKEN as string,
  },
  session: {
    session_secret: process.env.SESSION_SECRET,
  },
  redis: {
    redis_url_host: process.env.REDIS_URL_HOST,
    redis_url_port: process.env.REDIS_URL_PORT,
  },
};

export default default_config;
