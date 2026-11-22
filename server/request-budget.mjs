import {
  closeSync,
  openSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { resolve } from "node:path";

const windowMs = 31 * 24 * 3600000;

export function freeRequestBudget(
  limit,
  path = resolve(".movieofthenight-usage.json"),
) {
  return () => {
    const lock = path + ".lock";
    const fd = openSync(lock, "wx");
    try {
      let calls;
      try {
        calls = JSON.parse(readFileSync(path, "utf8"));
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
        calls = [];
      }
      if (!Array.isArray(calls) || !calls.every(Number.isSafeInteger)) {
        throw new Error("Invalid request budget");
      }
      const now = Date.now();
      calls = calls
        .filter((time) => time > now - windowMs)
        .sort((a, b) => a - b);
      if (calls.length >= limit)
        return Math.ceil((calls[0] + windowMs - now) / 1000);
      writeFileSync(path + ".next", JSON.stringify([...calls, now]));
      renameSync(path + ".next", path);
      return 0;
    } finally {
      closeSync(fd);
      unlinkSync(lock);
    }
  };
}
