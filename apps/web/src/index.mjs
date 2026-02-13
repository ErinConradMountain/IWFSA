import { loadEnvFile } from "../../common/load-env.mjs";
import { getWebConfig } from "./env.mjs";
import { startWebServer } from "./server.mjs";

loadEnvFile();

const config = getWebConfig();
const server = await startWebServer(config);
console.log(`web running on http://${server.host}:${server.port}`);
