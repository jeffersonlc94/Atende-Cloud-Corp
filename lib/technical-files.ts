import crypto from "crypto";
import path from "path";
import { mkdir, unlink, writeFile } from "fs/promises";

export const TECHNICAL_FILE_TYPES = ["Driver", "Firmware", "Manual", "Utilitario", "Outro"] as const;
export type TechnicalFileTypeValue = (typeof TECHNICAL_FILE_TYPES)[number];

export const TECHNICAL_FILE_EXTENSIONS = new Set([
  ".zip", ".rar", ".7z", ".exe", ".msi", ".inf", ".cab",
  ".bin", ".rom", ".fw", ".hex", ".img", ".iso",
  ".pdf", ".doc", ".docx", ".txt", ".dmg", ".pkg", ".deb", ".rpm",
]);

export const TECHNICAL_STORAGE_DIR = path.join(process.cwd(), "storage", "technical-files");

export function isTechnicalFileType(value: string): value is TechnicalFileTypeValue {
  return TECHNICAL_FILE_TYPES.includes(value as TechnicalFileTypeValue);
}

export function technicalFilePath(storedName: string): string {
  return path.join(TECHNICAL_STORAGE_DIR, path.basename(storedName));
}

export async function saveTechnicalFile(file: File): Promise<{ storedName: string; originalName: string }> {
  const extension = path.extname(file.name).toLowerCase();
  if (!TECHNICAL_FILE_EXTENSIONS.has(extension)) {
    throw new Error("Formato não permitido. Envie driver, firmware, pacote compactado, manual ou utilitário técnico.");
  }

  await mkdir(TECHNICAL_STORAGE_DIR, { recursive: true });
  const originalBase = path.basename(file.name, extension) || "arquivo";
  const safeBase = originalBase
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100) || "arquivo";
  const buffer = Buffer.from(await file.arrayBuffer());

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const suffix = attempt === 0 ? "" : `-${Date.now()}${crypto.randomInt(100, 999)}`;
    const storedName = `${safeBase}${suffix}${extension}`;
    try {
      await writeFile(technicalFilePath(storedName), buffer, { flag: "wx" });
      return { storedName, originalName: file.name };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST" || attempt === 9) throw error;
    }
  }
  throw new Error("Não foi possível reservar um nome seguro para o arquivo.");
}

export async function removeTechnicalFile(storedName: string): Promise<void> {
  await unlink(technicalFilePath(storedName)).catch(() => undefined);
}
