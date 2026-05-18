import fs from "fs/promises";
import path from "path";

export async function loadPromptFile(filename: string): Promise<string> {
  const dir = path.join(process.cwd(), "prompts");
  const full = path.join(dir, filename);
  return fs.readFile(full, "utf8");
}
