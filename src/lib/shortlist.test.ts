import { describe, expect, it } from 'vitest'
import {
  SHORTLIST_LIMIT,
  addToShortlist,
  loadShortlist,
  removeFromShortlist,
  resolveShortlist,
  saveShortlist,
  shareUrl,
  toggleShortlist,
} from './shortlist'
import { universe } from './galaxy'

describe('shortlist', () => {
  it('adds ids once and ignores repeats', () => {
    expect(addToShortlist([], 'A')).toEqual(['A'])
    expect(addToShortlist(['A'], 'A')).toEqual(['A'])
    expect(addToShortlist(['A'], 'B')).toEqual(['A', 'B'])
  })

  it('does not mutate the input array', () => {
    const list = ['A']
    addToShortlist(list, 'B')
    expect(list).toEqual(['A'])
  })

  it('caps the list at the documented limit', () => {
    let list: string[] = []
    for (let i = 0; i < SHORTLIST_LIMIT + 5; i++) list = addToShortlist(list, `id-${i}`)
    expect(list.length).toBe(SHORTLIST_LIMIT)
    expect(list[list.length - 1]).toBe(`id-${SHORTLIST_LIMIT - 1}`)
  })

  it('removes and toggles', () => {
    expect(removeFromShortlist(['A', 'B'], 'A')).toEqual(['B'])
    expect(toggleShortlist(['A'], 'A')).toEqual([])
    expect(toggleShortlist([], 'A')).toEqual(['A'])
  })

  it('resolves ids, dropping ones that no longer exist', () => {
    const all = universe()
    const resolved = resolveShortlist([all[0].id, 'MCX-999999', all[1].id], (id) => all.find((m) => m.id === id) ?? null)
    expect(resolved.map((m) => m.id)).toEqual([all[0].id, all[1].id])
  })

  it('round-trips through storage and tolerates corruption', () => {
    const store = new Map<string, string>()
    const fake = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    }
    saveShortlist(['A', 'B'], fake)
    expect(loadShortlist(fake)).toEqual(['A', 'B'])

    store.set('molcosmos.shortlist.v1', '{not json')
    expect(loadShortlist(fake)).toEqual([])
    store.set('molcosmos.shortlist.v1', '{"a":1}')
    expect(loadShortlist(fake)).toEqual([])
  })

  it('returns an empty list when storage is unavailable', () => {
    expect(loadShortlist({ getItem: () => { throw new Error('denied') } })).toEqual([])
  })

  it('builds a clean share url', () => {
    expect(shareUrl('MCX-000123', 'https://example.com/molcosmos/')).toBe(
      'https://example.com/molcosmos/?star=MCX-000123',
    )
    expect(shareUrl('MCX-000123', 'https://example.com/x/?a=1#h')).toBe(
      'https://example.com/x/?star=MCX-000123',
    )
  })
})
