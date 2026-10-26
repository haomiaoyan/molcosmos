import { describe, expect, it } from 'vitest'
import { formulaOf, searchMolecules, stepUniverse } from './search'
import { spawnExplorationBatch, universe } from './galaxy'

describe('searchMolecules', () => {
  it('returns nothing for an empty or blank query', () => {
    expect(searchMolecules('')).toEqual([])
    expect(searchMolecules('   ')).toEqual([])
  })

  it('finds a molecule by full id and by bare digits', () => {
    const target = universe()[123]
    expect(searchMolecules(target.id)[0].molecule.id).toBe(target.id)
    expect(searchMolecules('123')[0].molecule.id).toBe(target.id)
    expect(searchMolecules(target.id).length).toBeGreaterThan(0)
    expect(searchMolecules(target.id)[0].reason).toBe('id')
  })

  it('is case-insensitive and ignores surrounding whitespace', () => {
    const target = universe()[7]
    const upper = searchMolecules(`  ${target.id.toUpperCase()}  `)
    expect(upper[0].molecule.id).toBe(target.id)
  })

  it('finds molecules by molecular formula', () => {
    const target = universe()[10]
    const formula = formulaOf(target)
    const hits = searchMolecules(formula, [], 20)
    expect(hits.some((h) => h.molecule.id === target.id)).toBe(true)
    expect(hits.find((h) => h.molecule.id === target.id)?.reason).toBe('formula')
  })

  it('matches a class label and says so', () => {
    const hits = searchMolecules('宜居带分子', [], 5)
    expect(hits.length).toBeGreaterThan(0)
    for (const hit of hits) {
      expect(hit.reason).toBe('class')
      expect(hit.molecule.drugClass).toBe('goldilocks')
    }
  })

  it('respects the limit and never returns duplicates', () => {
    const hits = searchMolecules('MCX', [], 5)
    expect(hits.length).toBeLessThanOrEqual(5)
    const ids = hits.map((h) => h.molecule.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('searches generated samples too', () => {
    const [generated] = spawnExplorationBatch(9)
    const hits = searchMolecules(generated.id, [generated])
    expect(hits[0].molecule.id).toBe(generated.id)
  })

  it('returns no hits for nonsense', () => {
    expect(searchMolecules('zzzz-not-a-molecule')).toEqual([])
  })
})

describe('stepUniverse', () => {
  it('walks forward and backward through catalogue order', () => {
    const all = universe()
    expect(stepUniverse(all, all[0], 1).id).toBe(all[1].id)
    expect(stepUniverse(all, all[1], -1).id).toBe(all[0].id)
  })

  it('wraps around at both ends', () => {
    const all = universe()
    expect(stepUniverse(all, all[all.length - 1], 1).id).toBe(all[0].id)
    expect(stepUniverse(all, all[0], -1).id).toBe(all[all.length - 1].id)
  })

  it('starts from an end when nothing is selected', () => {
    const all = universe()
    expect(stepUniverse(all, null, 1).id).toBe(all[0].id)
    expect(stepUniverse(all, null, -1).id).toBe(all[all.length - 1].id)
  })

  it('starts from the beginning for a molecule outside the catalogue', () => {
    const all = universe()
    const [generated] = spawnExplorationBatch(1)
    expect(stepUniverse(all, generated, 1).id).toBe(all[0].id)
  })
})
