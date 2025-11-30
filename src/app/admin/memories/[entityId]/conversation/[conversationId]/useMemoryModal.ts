import { useState } from "react";
import type { MemoryResponse } from "@/lib/memories";

type ModalMode = "add" | "edit" | null;

export function useMemoryModal() {
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedMemory, setSelectedMemory] = useState<MemoryResponse | null>(null);
  const [formText, setFormText] = useState("");
  const [formKeywords, setFormKeywords] = useState("");

  const openAddModal = () => {
    setModalMode("add");
    setSelectedMemory(null);
    setFormText("");
    setFormKeywords("");
  };

  const openEditModal = (memory: MemoryResponse) => {
    setModalMode("edit");
    setSelectedMemory(memory);
    const content = memory.memory_content as Record<string, unknown>;
    setFormText((content.full_text as string) || "");
    setFormKeywords(memory.keywords.join(", "));
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedMemory(null);
    setFormText("");
    setFormKeywords("");
  };

  return {
    modalMode,
    selectedMemory,
    formText,
    formKeywords,
    setFormText,
    setFormKeywords,
    openAddModal,
    openEditModal,
    closeModal,
  };
}
