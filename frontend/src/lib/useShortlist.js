import { useEffect, useState, useCallback } from "react";

const KEY = "mcm.shortlist.v1";

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(items) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* quota exceeded etc — silent */
  }
}

// Cross-instance pub-sub: every mounted hook subscribes to "storage"
// (multi-tab) and to a synthetic in-tab event so multiple components in
// the same page stay consistent.
const SYNTHETIC = "mcm-shortlist-changed";

export function useShortlist() {
  const [items, setItems] = useState(read);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === KEY) setItems(read());
    };
    const onSynthetic = () => setItems(read());
    window.addEventListener("storage", onStorage);
    window.addEventListener(SYNTHETIC, onSynthetic);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(SYNTHETIC, onSynthetic);
    };
  }, []);

  const add = useCallback((entry) => {
    const next = read();
    if (next.some((e) => e.id === entry.id)) return;
    next.push({
      id: entry.id,
      title: entry.title,
      provider: entry.provider || entry.institution,
      country: entry.country,
      city: entry.city,
      fees_for_filter: entry.fees_for_filter,
      provenance: entry.provenance || (entry.isProvisional ? entry.provenance : "curated"),
      url: entry.url,
      addedAt: new Date().toISOString(),
    });
    write(next);
    window.dispatchEvent(new Event(SYNTHETIC));
  }, []);

  const remove = useCallback((id) => {
    const next = read().filter((e) => e.id !== id);
    write(next);
    window.dispatchEvent(new Event(SYNTHETIC));
  }, []);

  const has = useCallback((id) => items.some((e) => e.id === id), [items]);

  const toggle = useCallback(
    (entry) => {
      if (has(entry.id)) remove(entry.id);
      else add(entry);
    },
    [add, has, remove],
  );

  const clear = useCallback(() => {
    write([]);
    window.dispatchEvent(new Event(SYNTHETIC));
  }, []);

  return { items, add, remove, has, toggle, clear, count: items.length };
}
