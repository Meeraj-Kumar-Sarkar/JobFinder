import crypto from "crypto";
import path from "path";

export function generateFileName(originalName: string): string {
  const extension = path.extname(originalName);

  const unique = crypto.randomBytes(16).toString("hex");

  return `${Date.now()}-${unique}${extension}`;
}
