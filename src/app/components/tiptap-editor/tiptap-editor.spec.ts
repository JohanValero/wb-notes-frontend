import { describe, it, expect } from 'vitest'
import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'

function createEditor(content: string): Editor {
  return new Editor({
    element: document.createElement('div'),
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Placeholder.configure({ placeholder: 'Escribe aquí...' }),
    ],
    content,
  })
}

describe('TiptapEditorComponent — HTML normalization', () => {
  it('strips trailing whitespace from paragraph content', () => {
    const ed = createEditor('<p>Hola   </p>')
    const html = ed.getHTML()
    expect(html).toBe('<p>Hola</p>')
    ed.destroy()
  })

  it('strips leading whitespace from paragraph content', () => {
    const ed = createEditor('<p>   Hola</p>')
    const html = ed.getHTML()
    expect(html).toBe('<p>Hola</p>')
    ed.destroy()
  })

  it('normalizes multiple spaces inside content', () => {
    const ed = createEditor('<p>Hola   mundo</p>')
    const html = ed.getHTML()
    expect(html).toBe('<p>Hola mundo</p>')
    ed.destroy()
  })

  it('strips trailing newlines from the document', () => {
    const ed = createEditor('<p>A</p>\n<p>B</p>\n')
    const html = ed.getHTML()
    expect(html).toBe('<p>A</p><p>B</p>')
    ed.destroy()
  })

  it('produces consistent output for same content across multiple renders', () => {
    const content = '<p>¡Hola mundo! Esto es una prueba.</p>'
    const ed1 = createEditor(content)
    const html1 = ed1.getHTML()
    ed1.destroy()

    const ed2 = createEditor(html1)
    const html2 = ed2.getHTML()
    ed2.destroy()

    const ed3 = createEditor(content)
    const html3 = ed3.getHTML()
    ed3.destroy()

    expect(html1).toBe(html2)
    expect(html1).toBe(html3)
  })

  it('handles rich HTML content consistently', () => {
    const ed = createEditor('<h1>Title</h1><p>Body with <strong>bold</strong> and <em>italic</em></p><ul><li><p>Item</p></li></ul>')
    const html = ed.getHTML()
    expect(html).toContain('<h1>Title</h1>')
    expect(html).toContain('<strong>bold</strong>')
    expect(html).toContain('<em>italic</em>')
    ed.destroy()
  })

  it('produces identical HTML given the same input', () => {
    const ed1 = createEditor('<p>Test</p>')
    const h1 = ed1.getHTML()
    ed1.destroy()

    const ed2 = createEditor('<p>Test</p>')
    const h2 = ed2.getHTML()
    ed2.destroy()

    expect(h1).toBe(h2)
  })
})
