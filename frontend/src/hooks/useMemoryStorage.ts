"use client";

import { useEffect, useState, useCallback } from "react";

import {
  StoredMemoryProject,
  listMemoryProjects,
  getMemoryProject,
  createMemoryProject,
  updateMemoryProject,
  deleteMemoryProject,
  saveMemoryBookForProject,
} from "@/lib/memory/storage";
import { FamilyMagic, MemoryBook, MemoryMode } from "@/lib/memory/types";

export function useMemoryProjects() {
  const [projects, setProjects] = useState<StoredMemoryProject[]>([]);

  useEffect(() => {
    setProjects(listMemoryProjects());
  }, []);

  const refresh = useCallback(() => {
    setProjects(listMemoryProjects());
  }, []);

  const create = useCallback(
    (input: {
      id: string;
      title: string;
      personName?: string;
      timeSpan?: string;
      mode: MemoryMode;
      book: MemoryBook;
      familyMagic?: FamilyMagic;
    }) => {
      const project = createMemoryProject(input);
      setProjects(listMemoryProjects());
      return project;
    },
    []
  );

  const remove = useCallback((id: string) => {
    deleteMemoryProject(id);
    setProjects(listMemoryProjects());
  }, []);

  return {
    projects,
    refresh,
    create,
    remove,
  };
}

export function useMemoryProject(id: string | undefined) {
  const [project, setProject] = useState<StoredMemoryProject | undefined>();

  useEffect(() => {
    if (!id) return;
    setProject(getMemoryProject(id));
  }, [id]);

  const saveBook = useCallback(
    (book: MemoryBook) => {
      if (!id) return;
      saveMemoryBookForProject(id, book);
      setProject(getMemoryProject(id));
    },
    [id]
  );

  const updateMeta = useCallback(
    (updates: Partial<Omit<StoredMemoryProject, "id" | "createdAt" | "book">>) => {
      if (!id) return;
      const updated = updateMemoryProject(id, updates);
      setProject(updated);
    },
    [id]
  );

  return {
    project,
    saveBook,
    updateMeta,
  };
}
