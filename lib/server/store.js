import { promises as fs } from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import {
  ADMIN_CREDENTIALS,
  defaultAnnouncements,
  defaultChallenges,
  defaultClubs,
  defaultEvents,
  defaultGallery,
  defaultProjects,
  defaultTeam
} from "../storage";

const memoryStoreKey = "__clubsphere_memory_store__";
const runtimeDataDir = process.env.STORE_DATA_DIR || (process.env.VERCEL === "1" ? "/tmp/clubsphere" : path.join(process.cwd(), "data"));
const dataDir = runtimeDataDir;
const storeFile = path.join(runtimeDataDir, "platform.json");

const baseState = () => ({
  clubs: defaultClubs,
  events: defaultEvents,
  challenges: defaultChallenges,
  projects: defaultProjects,
  team: defaultTeam,
  gallery: defaultGallery,
  announcements: defaultAnnouncements,
  challengeSubmissions: {},
  registrations: {},
  clubRegistrations: {},
  emailNotifications: {},
  userProfiles: {},
  bannedUsers: [],
  adminAuditLog: []
});

const clone = (value) => JSON.parse(JSON.stringify(value));

export const normalizeEmail = (email = "") => email.trim().toLowerCase();

const ensureShape = (store) => ({
  users: Array.isArray(store?.users) ? store.users : [],
  state: {
    ...baseState(),
    ...(store?.state || {})
  }
});

const createInitialStore = async () => {
  const passwordHash = await bcrypt.hash(ADMIN_CREDENTIALS.password, 10);
  return {
    users: [
      {
        id: "admin-1",
        name: "ClubSphere Admin",
        email: ADMIN_CREDENTIALS.email.toLowerCase(),
        passwordHash,
        role: "admin",
        authType: "credentials",
        createdAt: new Date().toISOString()
      }
    ],
    state: baseState()
  };
};

const isReadonlyError = (error) => {
  const code = error?.code || "";
  return code === "EROFS" || code === "EACCES" || code === "EPERM";
};

const readMemoryStore = () => globalThis[memoryStoreKey] || null;

const writeMemoryStore = (store) => {
  globalThis[memoryStoreKey] = ensureShape(store);
  return globalThis[memoryStoreKey];
};

async function ensureStoreFile() {
  try {
    await fs.mkdir(dataDir, { recursive: true });
    try {
      await fs.access(storeFile);
    } catch {
      const initialStore = await createInitialStore();
      await fs.writeFile(storeFile, JSON.stringify(initialStore, null, 2), "utf8");
    }
    return { mode: "file" };
  } catch (error) {
    if (!isReadonlyError(error)) throw error;
    if (!readMemoryStore()) {
      writeMemoryStore(await createInitialStore());
    }
    return { mode: "memory" };
  }
}

export async function getStore() {
  const { mode } = await ensureStoreFile();
  if (mode === "memory") return ensureShape(readMemoryStore());
  try {
    const raw = await fs.readFile(storeFile, "utf8");
    return ensureShape(JSON.parse(raw));
  } catch (error) {
    if (!isReadonlyError(error)) throw error;
    if (!readMemoryStore()) writeMemoryStore(await createInitialStore());
    return ensureShape(readMemoryStore());
  }
}

export async function saveStore(store) {
  const next = ensureShape(store);
  const { mode } = await ensureStoreFile();
  if (mode === "memory") return writeMemoryStore(next);
  try {
    await fs.writeFile(storeFile, JSON.stringify(next, null, 2), "utf8");
    return next;
  } catch (error) {
    if (!isReadonlyError(error)) throw error;
    return writeMemoryStore(next);
  }
}

export async function updateStore(updater) {
  const current = await getStore();
  const draft = clone(current);
  const updated = (await updater(draft)) || draft;
  return saveStore(updated);
}

export function sanitizeUser(user) {
  if (!user) return null;
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

export function publicStore(store) {
  const safe = ensureShape(store);
  return {
    ...safe.state,
    users: safe.users.map(sanitizeUser)
  };
}

export function findUserByEmail(store, email) {
  const normalized = normalizeEmail(email);
  return ensureShape(store).users.find((user) => user.email === normalized) || null;
}
