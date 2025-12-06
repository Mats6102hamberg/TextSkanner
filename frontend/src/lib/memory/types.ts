export type MemoryMode = "raw" | "structured" | "story";

export interface MemorySourceEntry {
  id: string; // id för skanning/dagbokssida
  text: string; // renskriven text (gärna redan maskad)
  date?: string; // ISO-sträng om du har
}

export interface MemoryEntry {
  sourceId: string;
  date?: string;
  rawText?: string;
  bookText: string;
}

export interface MemoryChapter {
  title: string;
  summary?: string;
  entries: MemoryEntry[];
}

export interface MemoryBook {
  mode: MemoryMode;
  chapters: MemoryChapter[];
}

export interface FamilyMagicPerson {
  name: string;
  mentioned: number;
  guessedRole?: string;
}

export interface FamilyMagic {
  persons: FamilyMagicPerson[];
  places: string[];
  themes: string[];
  earliestDate?: string;
  latestDate?: string;
  timelineSummary?: string;
}

export interface MemoryProject {
  id: string;
  title: string;
  personName?: string;
  timeSpan?: string;
  mode: MemoryMode;
  book: MemoryBook;
  familyMagic?: FamilyMagic;
}
