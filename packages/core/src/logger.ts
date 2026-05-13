import pino from "pino";
import type { Logger } from "./types.js";

export function createLogger(level = "info"): Logger {
  return pino({ level });
}
