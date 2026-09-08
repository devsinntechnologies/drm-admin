"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { moveItem } from "@/lib/reorder";

export function useHtml5Reorder<T extends { id: string }>(
  items: T[],
  onCommit: (ids: string[]) => Promise<void>,
  enabled = true,
) {
  const [ordered, setOrdered] = useState(items);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropId, setDropId] = useState<string | null>(null);
  const itemsRef = useRef(items);
  const orderedRef = useRef(ordered);
  const dragIdRef = useRef<string | null>(null);
  const committingRef = useRef(false);
  const onCommitRef = useRef(onCommit);

  itemsRef.current = items;
  orderedRef.current = ordered;
  onCommitRef.current = onCommit;

  useEffect(() => {
    setOrdered(items);
  }, [items]);

  const onDragStart = useCallback(
    (id: string, event: React.DragEvent) => {
      if (!enabled) return;
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", id);
      dragIdRef.current = id;
      setDragId(id);
    },
    [enabled],
  );

  const onDragOver = useCallback(
    (id: string, event: React.DragEvent) => {
      if (!enabled || !dragIdRef.current) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      setDropId((current) => (current === id ? current : id));
    },
    [enabled],
  );

  const onDrop = useCallback(
    async (targetId: string, event: React.DragEvent) => {
      event.preventDefault();
      const fromId = dragIdRef.current;
      dragIdRef.current = null;
      setDragId(null);
      setDropId(null);
      if (!enabled || !fromId || committingRef.current) return;

      const next = moveItem(orderedRef.current, fromId, targetId);
      setOrdered(next);
      const nextIds = next.map((item) => item.id);
      const prevIds = itemsRef.current.map((item) => item.id);
      if (nextIds.join(",") === prevIds.join(",")) return;

      committingRef.current = true;
      try {
        await onCommitRef.current(nextIds);
      } catch {
        setOrdered(itemsRef.current);
      } finally {
        committingRef.current = false;
      }
    },
    [enabled],
  );

  const onDragEnd = useCallback(() => {
    dragIdRef.current = null;
    setDragId(null);
    setDropId(null);
  }, []);

  return {
    items: ordered,
    dragId,
    dropId,
    enabled,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
  };
}
