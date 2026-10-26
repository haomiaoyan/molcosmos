/**
 * The visitor's shortlist: molecules they starred while exploring.
 *
 * Stored as ids only, so the list survives a reload while the molecules
 * themselves keep coming from the deterministic universe (and the session
 * registry for generated samples). Pure functions + one storage adapter,
 * so the behaviour is testable without a DOM.
 */

import type { Molecule } from './molecule'

export const SHORTLIST_KEY = 'molcosmos.shortlist.v1'
export const SHORTLIST_LIMIT = 24

/** Adds an id unless present or the list is full. Returns a new array. */
export function addToShortlist(list: readonly string[], id: string): string[] {
  if (list.includes(id) || list.length >= SHORTLIST_LIMIT) return list.slice()
  return [...list, id]
}

export function removeFromShortlist(list: readonly string[], id: string): string[] {
  return list.filter((entry) => entry !== id)
}

export function toggleShortlist(list: readonly string[], id: string): string[] {
  return list.includes(id) ? removeFromShortlist(list, id) : addToShortlist(list, id)
}

/** Drops ids that no longer resolve, preserving order. */
export function resolveShortlist(list: readonly string[], lookup: (id: string) => Molecule | null): Molecule[] {
  const out: Molecule[] = []
  for (const id of list) {
    const molecule = lookup(id)
    if (molecule) out.push(molecule)
  }
  return out
}

/** Reads the stored list, tolerating missing or corrupt storage. */
export function loadShortlist(storage?: Pick<Storage, 'getItem'>): string[] {
  const store = storage ?? (typeof localStorage === 'undefined' ? undefined : localStorage)
  if (!store) return []
  try {
    const raw = store.getItem(SHORTLIST_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((entry): entry is string => typeof entry === 'string').slice(0, SHORTLIST_LIMIT)
  } catch {
    return []
  }
}

export function saveShortlist(list: readonly string[], storage?: Pick<Storage, 'setItem'>): void {
  const store = storage ?? (typeof localStorage === 'undefined' ? undefined : localStorage)
  if (!store) return
  try {
    store.setItem(SHORTLIST_KEY, JSON.stringify(list))
  } catch {
    // Private mode or a full quota: the shortlist simply does not persist.
  }
}

/** Shareable deep link for one molecule. */
export function shareUrl(id: string, origin: string): string {
  const base = origin.split('?')[0].split('#')[0]
  return `${base}?star=${encodeURIComponent(id)}`
}
