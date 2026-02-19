import { prisma } from "./prisma";

// Get a config value from DB, falling back to env var
export async function getConfig(key: string): Promise<string | null> {
  try {
    const config = await prisma.systemConfig.findUnique({ where: { key } });
    if (config?.value) return config.value;
  } catch {
    // Table might not exist yet, ignore
  }

  // Fallback to env var
  return process.env[key] || null;
}

// Set a config value in DB
export async function setConfig(key: string, value: string): Promise<void> {
  await prisma.systemConfig.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

// Get all config entries
export async function getAllConfig(): Promise<Record<string, string>> {
  try {
    const configs = await prisma.systemConfig.findMany();
    const result: Record<string, string> = {};
    for (const c of configs) {
      result[c.key] = c.value;
    }
    return result;
  } catch {
    return {};
  }
}

// Delete a config entry
export async function deleteConfig(key: string): Promise<void> {
  try {
    await prisma.systemConfig.delete({ where: { key } });
  } catch {
    // Ignore if not found
  }
}
