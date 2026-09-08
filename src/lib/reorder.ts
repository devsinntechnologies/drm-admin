export function applySubsetOrder(
  currentIds: string[],
  orderedIds: string[],
): string[] {
  const existing = new Set(currentIds);
  const wanted: string[] = [];
  const seen = new Set<string>();

  for (const id of orderedIds) {
    if (!existing.has(id) || seen.has(id)) continue;
    seen.add(id);
    wanted.push(id);
  }

  if (!wanted.length) return currentIds;

  const wantedSet = new Set(wanted);
  const queue = [...wanted];
  return currentIds.map((id) => (wantedSet.has(id) ? queue.shift()! : id));
}

export function moveItem<T extends { id: string }>(
  items: T[],
  fromId: string,
  toId: string,
): T[] {
  if (fromId === toId) return items;
  const next = [...items];
  const from = next.findIndex((item) => item.id === fromId);
  const to = next.findIndex((item) => item.id === toId);
  if (from < 0 || to < 0) return items;
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
