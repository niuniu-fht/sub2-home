import { promises as fs } from "fs";
import path from "path";
import type { Config } from "./types";

const DATA_PATH = path.join(process.cwd(), "data", "config.json");
// 模板文件（随仓库分发）。config.json 属于运行时数据，不入库，首次运行时从模板生成。
const DEFAULT_PATH = path.join(process.cwd(), "data", "config.default.json");

// 内存中不缓存，直接读文件，保证后台保存后立即生效。
export async function readConfig(): Promise<Config> {
  try {
    const raw = await fs.readFile(DATA_PATH, "utf-8");
    return JSON.parse(raw) as Config;
  } catch {
    // config.json 不存在（首次运行）：从模板初始化并落盘。
    const seed = await fs.readFile(DEFAULT_PATH, "utf-8");
    await fs.writeFile(DATA_PATH, seed, "utf-8").catch(() => {});
    return JSON.parse(seed) as Config;
  }
}

export async function writeConfig(config: Config): Promise<void> {
  const json = JSON.stringify(config, null, 2);
  // 先写临时文件再重命名，避免写入过程中被读到半个文件。
  const tmp = `${DATA_PATH}.tmp`;
  await fs.writeFile(tmp, json, "utf-8");
  await fs.rename(tmp, DATA_PATH);
}
