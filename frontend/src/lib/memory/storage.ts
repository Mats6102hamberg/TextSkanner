import { MemoryBook, MemoryMode } from "./types";

const STORAGE_KEY = "textskanner.memory.projects.v1";

export interface StoredMemoryProject {
  id: string;
  title: string;
  personName?: string;
  timeSpan?: string;
  mode: MemoryMode;
  createdAt: string;
  updatedAt: string;
  book: MemoryBook;
}

function isBrowser() {
  return typeof window !== "undefined";
}

function readAllProjects(): StoredMemoryProject[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredMemoryProject[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (err) {
    console.error("[memory-storage] Failed to read projects:", err);
    return [];
  }
}

function writeAllProjects(projects: StoredMemoryProject[]) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (err) {
    console.error("[memory-storage] Failed to write projects:", err);
  }
}

export function listMemoryProjects(): StoredMemoryProject[] {
  return readAllProjects();
}

export function getMemoryProject(id: string): StoredMemoryProject | undefined {
  return readAllProjects().find((p) => p.id === id);
}

export function createMemoryProject(input: {
  id: string;
  title: string;
  personName?: string;
  timeSpan?: string;
  mode: MemoryMode;
  book: MemoryBook;
}): StoredMemoryProject {
  const now = new Date().toISOString();
  const project: StoredMemoryProject = {
    id: input.id,
    title: input.title,
    personName: input.personName,
    timeSpan: input.timeSpan,
    mode: input.mode,
    createdAt: now,
    updatedAt: now,
    book: input.book,
  };

  const all = readAllProjects();
  all.push(project);
  writeAllProjects(all);

  return project;
}

export function updateMemoryProject(
  id: string,
  updates: Partial<Omit<StoredMemoryProject, "id" | "createdAt">>
): StoredMemoryProject | undefined {
  const all = readAllProjects();
  const idx = all.findIndex((p) => p.id === id);
  if (idx === -1) return undefined;

  const current = all[idx];
  const updated: StoredMemoryProject = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  all[idx] = updated;
  writeAllProjects(all);
  return updated;
}

export function deleteMemoryProject(id: string): void {
  const all = readAllProjects();
  const filtered = all.filter((p) => p.id !== id);
  writeAllProjects(filtered);
}

export function saveMemoryBookForProject(id: string, book: MemoryBook) {
  updateMemoryProject(id, { book });
}
