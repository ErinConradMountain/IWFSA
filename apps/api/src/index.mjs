import { loadEnvFile } from "../../common/load-env.mjs";
import { getApiConfig } from "./env.mjs";
import { runMigrations } from "./db/migrate.mjs";
import { startApiServer } from "./server.mjs";

loadEnvFile();

const config = getApiConfig();
runMigrations({ databasePath: config.databasePath });

const server = await startApiServer(config);
console.log(`api running on http://${server.host}:${server.port}`);
