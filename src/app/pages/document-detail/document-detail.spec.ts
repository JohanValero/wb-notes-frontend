import { describe, it, expect } from 'vitest'
import { extractBlocks, injectUuid } from './document-detail'

describe('injectUuid', () => {
  it('injects id into simple <p> tag', () => {
    expect(injectUuid('<p>Hello</p>', 'abc')).toBe('<p id="abc">Hello</p>')
  })

  it('injects id into <p> with attributes', () => {
    expect(injectUuid('<p class="x">Hello</p>', 'abc')).toBe(
      '<p id="abc" class="x">Hello</p>',
    )
  })

  it('injects id into non-p tags', () => {
    expect(injectUuid('<h1>Title</h1>', 'xyz')).toBe('<h1 id="xyz">Title</h1>')
  })

  it('returns empty string for empty content', () => {
    expect(injectUuid('', 'abc')).toBe('')
  })

  it('injects id into self-closing-looking tag', () => {
    expect(injectUuid('<br/>', 'br')).toBe('<br id="br"/>')
  })
})

describe('extractBlocks', () => {
  it('extracts uuid and content from single paragraph', () => {
    const items = extractBlocks('<p id="abc-123">Hello</p>')
    expect(items).toEqual([{ uuid: 'abc-123', content: '<p>Hello</p>' }])
  })

  it('extracts multiple paragraphs', () => {
    const items = extractBlocks('<p id="a">One</p><p id="b">Two</p><p id="c">Three</p>')
    expect(items).toEqual([
      { uuid: 'a', content: '<p>One</p>' },
      { uuid: 'b', content: '<p>Two</p>' },
      { uuid: 'c', content: '<p>Three</p>' },
    ])
  })

  it('handles paragraphs without id (new paragraphs)', () => {
    const items = extractBlocks('<p id="a">Existing</p><p>New paragraph</p>')
    expect(items).toEqual([
      { uuid: 'a', content: '<p>Existing</p>' },
      { content: '<p>New paragraph</p>' },
    ])
  })

  it('handles empty paragraphs', () => {
    const items = extractBlocks('<p id="a"></p>')
    expect(items).toEqual([{ uuid: 'a', content: '<p></p>' }])
  })

  it('strips id but preserves other attributes', () => {
    const items = extractBlocks('<p id="x" class="my-class" style="color:red">Text</p>')
    expect(items).toEqual([
      { uuid: 'x', content: '<p class="my-class" style="color:red">Text</p>' },
    ])
  })

  it('handles rich HTML inside paragraphs', () => {
    const items = extractBlocks('<p id="x">Hello <strong>world</strong></p>')
    expect(items).toEqual([
      { uuid: 'x', content: '<p>Hello <strong>world</strong></p>' },
    ])
  })

  it('returns empty array for empty string', () => {
    expect(extractBlocks('')).toEqual([])
  })

  it('handles document wrapper', () => {
    const items = extractBlocks('<html><body><p id="a">First</p><p id="b">Second</p></body></html>')
    expect(items).toEqual([
      { uuid: 'a', content: '<p>First</p>' },
      { uuid: 'b', content: '<p>Second</p>' },
    ])
  })

  it('first occurrence keeps uuid when no fragments provided', () => {
    const items = extractBlocks('<p id="x">A</p><p id="x">B</p><p id="x">C</p>')
    expect(items).toEqual([
      { uuid: 'x', content: '<p>A</p>' },
      { content: '<p>B</p>' },
      { content: '<p>C</p>' },
    ])
  })

  it('keeps uuid on block matching original fragment content after split', () => {
    const fragments = [
      { uuid: 'x', content: '<p>Hello</p>' },
    ] as any
    // User typed "1 " at start of "<p id='x'>Hello</p>" then Enter
    const html = '<p id="x">1 </p><p id="x">Hello</p>'
    const items = extractBlocks(html, fragments)
    expect(items).toEqual([
      { content: '<p>1 </p>' },
      { uuid: 'x', content: '<p>Hello</p>' },
    ])
  })

  it('keeps uuid on first block when neither matches original after split', () => {
    const fragments = [
      { uuid: 'x', content: '<p>Hello</p>' },
    ] as any
    // Split in middle — neither block fully matches original
    const html = '<p id="x">Hel</p><p id="x">lo</p>'
    const items = extractBlocks(html, fragments)
    expect(items).toEqual([
      { uuid: 'x', content: '<p>Hel</p>' },
      { content: '<p>lo</p>' },
    ])
  })

  it('recovers uuid via index fallback when block lost its id (H2 conversion)', () => {
    const fragments = [
      { uuid: 'x', content: '<p>Hello</p>' },
    ] as any
    const html = '<h2>Hello</h2>'
    const items = extractBlocks(html, fragments)
    expect(items).toEqual([
      { uuid: 'x', content: '<h2>Hello</h2>' },
    ])
  })
})
