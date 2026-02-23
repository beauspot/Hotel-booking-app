export interface AppConfig {
  node_env: string;
  node_config_dir: string | undefined;
  server: {
    port: number;
  };

  db: {
    db_uri: string | undefined;
  };

  session: {
    session_secret: string | undefined;
  };

  jwt_token: {
    j_token: string | undefined;
  };

  refresh_token: {
    r_token: string | undefined;
  };

  redis: {
    redis_url_host: string | undefined;
    redis_url_port: string | undefined;
  };
}
