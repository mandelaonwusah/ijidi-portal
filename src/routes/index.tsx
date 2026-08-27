/* ============================================================
   CUSTOM SCROLLBAR — consistent across Chrome + Edge
   ============================================================ */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: var(--background);
  border-radius: 8px;
  border: 1px solid var(--border);
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--primary);
  border-radius: 999px;
  transition: background 0.2s;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: var(--accent);
}

/* Firefox */
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: var(--primary) var(--background);
}
