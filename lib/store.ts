import { promises as fs } from "fs";
import path from "path";
import type { Config } from "./types";

const DATA_PATH = path.join(process.cwd(), "data", "config.json");

// 内存中不缓存，直接读文件，保证后台保存后立即生效。
export async function readConfig(): Promise<Config> {
  const raw = await fs.readFile(DATA_PATH, "utf-8");
  return JSON.parse(raw) as Config;
}

export async function writeConfig(config: Config): Promise<void> {
  const json = JSON.stringify(config, null, 2);
  // 先写临时文件再重命名，避免写入过程中被读到半个文件。
  const tmp = `${DATA_PATH}.tmp`;
  await fs.writeFile(tmp, json, "utf-8");
  await fs.rename(tmp, DATA_PATH);
}
