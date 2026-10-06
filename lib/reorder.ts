/**
 * Mueve un elemento una posición arriba o abajo. Devuelve el nuevo orden,
 * o null si no se puede mover (no existe o ya está en el extremo).
 */
export function moveInOrder(ids: string[], id: string, direction: "subir" | "bajar"): string[] | null {
  const from = ids.indexOf(id);
  if (from === -1) return null;
  const to = direction === "subir" ? from - 1 : from + 1;
  if (to < 0 || to >= ids.length) return null;
  const next = [...ids];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

/** Cambios de sort_order necesarios para que el orden quede 0, 1, 2… (solo los que cambian). */
export function sortOrderChanges(
  current: { id: string; sort_order: number }[],
  nextIds: string[],
): { id: string; sort_order: number }[] {
  const now = new Map(current.map((p) => [p.id, p.sort_order]));
  return nextIds.flatMap((id, i) => (now.get(id) === i ? [] : [{ id, sort_order: i }]));
}
