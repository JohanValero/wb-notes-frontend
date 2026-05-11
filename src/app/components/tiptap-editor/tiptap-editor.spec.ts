import { describe, it, expect, vi } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { TiptapEditorComponent } from './tiptap-editor'

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

describe('TiptapEditorComponent (Angular wrapper)', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TiptapEditorComponent],
    }).compileComponents()
  })

  it('creates the editor on afterViewInit', () => {
    const fixture = TestBed.createComponent(TiptapEditorComponent)
    fixture.detectChanges()
    const comp = fixture.componentInstance
    expect(comp.editor).toBeTruthy()
    comp.ngOnDestroy()
  })

  it('emits contentChange when editor content updates', () => {
    const fixture = TestBed.createComponent(TiptapEditorComponent)
    fixture.detectChanges()
    const comp = fixture.componentInstance
    const spy = vi.fn()
    comp.contentChange.subscribe(spy)

    comp.editor.commands.setContent('<p>Updated</p>')

    expect(spy).toHaveBeenCalled()
    comp.ngOnDestroy()
  })

  it('updates editor content via ngOnChanges when content differs', () => {
    const fixture = TestBed.createComponent(TiptapEditorComponent)
    fixture.detectChanges()
    const comp = fixture.componentInstance

    comp.ngOnChanges({
      content: {
        currentValue: '<p>New Content</p>',
        previousValue: '',
        firstChange: false,
        isFirstChange: () => false,
      } as any,
    })

    expect(comp.editor.getHTML()).toContain('New Content')
    comp.ngOnDestroy()
  })

  it('returns HTML via getHTML', () => {
    const fixture = TestBed.createComponent(TiptapEditorComponent)
    fixture.detectChanges()
    const comp = fixture.componentInstance

    expect(comp.getHTML()).toBeTypeOf('string')
    comp.ngOnDestroy()
  })

  it('checks active state via isActive', () => {
    const fixture = TestBed.createComponent(TiptapEditorComponent)
    fixture.detectChanges()
    const comp = fixture.componentInstance

    expect(comp.isActive('paragraph')).toBeTypeOf('boolean')
    comp.ngOnDestroy()
  })

  it('executes editor commands via exec', () => {
    const fixture = TestBed.createComponent(TiptapEditorComponent)
    fixture.detectChanges()
    const comp = fixture.componentInstance

    const spy = vi.fn().mockReturnValue({ run: vi.fn() })
    comp.exec(spy)
    expect(spy).toHaveBeenCalled()
    comp.ngOnDestroy()
  })

  it('destroys editor on ngOnDestroy', () => {
    const fixture = TestBed.createComponent(TiptapEditorComponent)
    fixture.detectChanges()
    const comp = fixture.componentInstance
    const editor = comp.editor
    vi.spyOn(editor, 'destroy')

    comp.ngOnDestroy()

    expect(editor.destroy).toHaveBeenCalled()
  })
})
