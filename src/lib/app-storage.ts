import fs from 'fs/promises';
import path from 'path';
import { AppRegistryItem, CreateAppDto, UpdateAppDto } from '@/types/sso';
import { WORKSPACE_APPS as DEFAULT_SEED_APPS } from '@/config/apps';

const DATA_DIR = path.join(process.cwd(), 'data');
const APPS_FILE = path.join(DATA_DIR, 'apps.json');

// In-memory cache to guarantee < 1ms read performance
let memoryCache: AppRegistryItem[] | null = null;

async function ensureDataDirectory(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error('Error creating data directory:', err);
  }
}

async function persistToFile(apps: AppRegistryItem[]): Promise<void> {
  await ensureDataDirectory();
  const tempFile = `${APPS_FILE}.tmp.${Date.now()}`;
  const serialized = JSON.stringify(apps, null, 2);

  // Write atomically: write to temp file then rename
  await fs.writeFile(tempFile, serialized, 'utf-8');
  await fs.rename(tempFile, APPS_FILE);
  memoryCache = apps;
}

/**
 * Loads all applications from persistent storage or initializes with seed apps.
 */
export async function getAllApps(): Promise<AppRegistryItem[]> {
  if (memoryCache) {
    return [...memoryCache].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  try {
    await ensureDataDirectory();
    const data = await fs.readFile(APPS_FILE, 'utf-8');
    const parsed: AppRegistryItem[] = JSON.parse(data);
    memoryCache = parsed;
    return [...parsed].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  } catch {
    // If file does not exist or corrupted, seed with defaults
    console.info('Storage file not found, initializing with default seed apps...');
    const seedApps = [...DEFAULT_SEED_APPS];
    await persistToFile(seedApps);
    return seedApps;
  }
}

/**
 * Returns only active applications, sorted by order.
 */
export async function getActiveApps(): Promise<AppRegistryItem[]> {
  const all = await getAllApps();
  return all.filter((app) => app.isActive !== false);
}

/**
 * Finds an application by its unique ID.
 */
export async function getAppById(id: string): Promise<AppRegistryItem | null> {
  const all = await getAllApps();
  const normalizedId = id.trim().toLowerCase();
  return all.find((app) => app.id.toLowerCase() === normalizedId) || null;
}

/**
 * Creates and persists a new application.
 */
export async function createApp(dto: CreateAppDto): Promise<AppRegistryItem> {
  const all = await getAllApps();
  const slug = dto.id.trim().toLowerCase();

  // Validate unique ID
  if (all.some((app) => app.id.toLowerCase() === slug)) {
    throw new Error(`Đã tồn tại ứng dụng với mã ID "${slug}"`);
  }

  const newApp: AppRegistryItem = {
    id: slug,
    title: dto.title.trim(),
    shortName: dto.shortName?.trim() || undefined,
    description: dto.description.trim(),
    icon: dto.icon.trim() || 'Sparkles',
    url: dto.url.trim(),
    path: dto.url.trim(),
    badge: dto.badge?.trim() || undefined,
    tags: dto.tags && dto.tags.length > 0 ? dto.tags : undefined,
    accentColor: dto.accentColor || 'bg-indigo-600',
    order: typeof dto.order === 'number' ? dto.order : all.length + 1,
    isActive: dto.isActive !== undefined ? dto.isActive : true,
  };

  const updatedList = [...all, newApp];
  await persistToFile(updatedList);
  return newApp;
}

/**
 * Updates an existing application.
 */
export async function updateApp(id: string, dto: UpdateAppDto): Promise<AppRegistryItem | null> {
  const all = await getAllApps();
  const normalizedId = id.trim().toLowerCase();
  const index = all.findIndex((app) => app.id.toLowerCase() === normalizedId);

  if (index === -1) {
    return null;
  }

  const existing = all[index];
  const updated: AppRegistryItem = {
    ...existing,
    title: dto.title !== undefined ? dto.title.trim() : existing.title,
    shortName: dto.shortName !== undefined ? dto.shortName.trim() : existing.shortName,
    description: dto.description !== undefined ? dto.description.trim() : existing.description,
    icon: dto.icon !== undefined ? dto.icon.trim() : existing.icon,
    url: dto.url !== undefined ? dto.url.trim() : existing.url,
    path: dto.url !== undefined ? dto.url.trim() : existing.path,
    badge: dto.badge !== undefined ? dto.badge.trim() : existing.badge,
    tags: dto.tags !== undefined ? dto.tags : existing.tags,
    accentColor: dto.accentColor !== undefined ? dto.accentColor : existing.accentColor,
    order: dto.order !== undefined ? dto.order : existing.order,
    isActive: dto.isActive !== undefined ? dto.isActive : existing.isActive,
  };

  all[index] = updated;
  await persistToFile(all);
  return updated;
}

/**
 * Toggles an application between active and inactive.
 */
export async function toggleAppActive(id: string): Promise<AppRegistryItem | null> {
  const all = await getAllApps();
  const normalizedId = id.trim().toLowerCase();
  const target = all.find((app) => app.id.toLowerCase() === normalizedId);

  if (!target) {
    return null;
  }

  return updateApp(id, { isActive: !target.isActive });
}

/**
 * Permanently removes an application from storage.
 */
export async function deleteApp(id: string): Promise<boolean> {
  const all = await getAllApps();
  const normalizedId = id.trim().toLowerCase();
  const filtered = all.filter((app) => app.id.toLowerCase() !== normalizedId);

  if (filtered.length === all.length) {
    return false; // Nothing was deleted
  }

  await persistToFile(filtered);
  return true;
}
