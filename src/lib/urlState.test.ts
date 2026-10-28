import { describe, expect, it } from 'vitest'
import { DEFAULT_LANG, DEFAULT_THEME, EMPTY_URL_STATE, readUrlState, writeUrlState } from './urlState'

describe('readUrlState', () => {
  it('reads all three keys', () => {
    expect(readUrlState('?star=MCX-000123&theme=nebula&lang=en')).toEqual({
      star: 'MCX-000123',
      theme: 'nebula',
      lang: 'en',
    })
  })

  it('accepts a search string with no leading question mark', () => {
    expect(readUrlState('star=MCX-000002').star).toBe('MCX-000002')
  })

  it('returns nulls for an empty query', () => {
    expect(readUrlState('')).toEqual(EMPTY_URL_STATE)
    expect(readUrlState('?')).toEqual(EMPTY_URL_STATE)
  })

  it('drops a theme id that does not exist', () => {
    expect(readUrlState('?theme=chartreuse').theme).toBeNull()
  })

  it('drops a language that is not zh or en', () => {
    expect(readUrlState('?lang=fr').lang).toBeNull()
  })

  it('treats a blank star as nothing to open', () => {
    expect(readUrlState('?star=').star).toBeNull()
    expect(readUrlState('?star=%20').star).toBeNull()
  })

  it('ignores unrelated parameters', () => {
    const state = readUrlState('?utm_source=poster&theme=ember')
    expect(state.theme).toBe('ember')
    expect(state.star).toBeNull()
  })

  it('does not throw on a malformed query', () => {
    expect(() => readUrlState('?%%%&theme=%%%')).not.toThrow()
  })
})

describe('writeUrlState', () => {
  it('omits the defaults so the plain view keeps a clean address', () => {
    expect(writeUrlState('', { star: null, theme: DEFAULT_THEME, lang: DEFAULT_LANG })).toBe('')
  })

  it('writes a star when a molecule is open', () => {
    expect(
      writeUrlState('', { star: 'MCX-000123', theme: DEFAULT_THEME, lang: DEFAULT_LANG }),
    ).toBe('?star=MCX-000123')
  })

  it('writes a non-default theme and language', () => {
    expect(writeUrlState('', { star: null, theme: 'abyss', lang: 'en' })).toBe('?theme=abyss&lang=en')
  })

  it('emits the known keys in a stable order', () => {
    expect(writeUrlState('', { star: 'MCX-000001', theme: 'ember', lang: 'en' })).toBe(
      '?star=MCX-000001&theme=ember&lang=en',
    )
  })

  it('replaces values that were already in the query', () => {
    expect(writeUrlState('?theme=nebula&lang=en', { star: null, theme: 'cosmos', lang: 'zh' })).toBe('')
  })

  it('carries unrelated parameters through', () => {
    expect(writeUrlState('?utm_source=poster&star=MCX-000009', { star: null, theme: DEFAULT_THEME, lang: DEFAULT_LANG })).toBe(
      '?utm_source=poster',
    )
  })

  it('round-trips through readUrlState', () => {
    const search = writeUrlState('?keep=1', { star: 'MCX-000180', theme: 'midnight', lang: 'en' })
    expect(readUrlState(search)).toEqual({ star: 'MCX-000180', theme: 'midnight', lang: 'en' })
  })

  it('returns an empty string rather than a bare question mark', () => {
    const search = writeUrlState('?star=MCX-000001', { star: null, theme: DEFAULT_THEME, lang: DEFAULT_LANG })
    expect(search).toBe('')
  })
})