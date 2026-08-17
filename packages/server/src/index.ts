import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { readEnv } from "@/env/env";
import { buildServer } from "@/server/server";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

config({ path: resolve(repoRoot, ".env"), quiet: true });

const env = readEnv();
const { app, rounds, commentary } = buildServer(env);

async function start(): Promise<void> {
  try {
    await app.listen({ port: env.port, host: env.host });
    app.log.info(
      {
        ai: rounds.available,
        aiKeysIssued: env.accessKeys.length,
        roundModel: rounds.available ? env.aiModel : null,
        commentaryModel: commentary.available ? env.commentaryModel : null,
      },
      "letter-game server ready"
    );
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

start();
