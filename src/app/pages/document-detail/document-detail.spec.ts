import { describe, it, expect, vi } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { provideRouter, ActivatedRoute, Router } from '@angular/router'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { of, Subject } from 'rxjs'
import { extractBlocks, injectUuid, DocumentDetailComponent } from './document-detail'
import { DocumentService } from '../../services/document.service'
import { FragmentService } from '../../services/fragment.service'
import { Document } from '../../models/document.model'

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

describe('DocumentDetailComponent', () => {
  let mockDocumentService: { get: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn>; list: ReturnType<typeof vi.fn>; listTypes: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> }
  let mockFragmentService: { list: ReturnType<typeof vi.fn>; sync: ReturnType<typeof vi.fn> }

  const mockDoc: Document = {
    uuid: 'doc-1',
    workspace_uuid: 'ws-1',
    doc_type: 'NOVEL',
    title: 'Test Doc',
    doc_status: 'DRAFT',
    source: 'manual',
    is_dirty: false,
    metadata: null,
    created_t: '2024-01-01',
    updated_t: '2024-01-01',
  }

  function createComponent(routeId = 'doc-1') {
    mockDocumentService = { get: vi.fn(), update: vi.fn(), list: vi.fn(), listTypes: vi.fn(), create: vi.fn(), delete: vi.fn() }
    mockFragmentService = { list: vi.fn(), sync: vi.fn() }

    TestBed.configureTestingModule({
      imports: [DocumentDetailComponent],
      providers: [
        { provide: DocumentService, useValue: mockDocumentService },
        { provide: FragmentService, useValue: mockFragmentService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: () => routeId } },
            paramMap: of({ get: () => routeId }),
          },
        },
        provideRouter([]),
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    return TestBed.createComponent(DocumentDetailComponent)
  }

  it('loads document and fragments on init', () => {
    const fixture = createComponent()
    mockDocumentService.get.mockReturnValue(of(mockDoc))
    mockDocumentService.listTypes.mockReturnValue(of([]))
    mockDocumentService.list.mockReturnValue(of([]))
    mockFragmentService.list.mockReturnValue(of([
      { uuid: 'f1', content: '<p>Hello</p>', position: 0, document_uuid: 'doc-1', workspace_uuid: 'ws-1', content_hash: '', is_dirty: false, created_t: '', updated_t: '' },
    ]))
    fixture.detectChanges()
    const comp = fixture.componentInstance
    expect(comp.document()).toEqual(mockDoc)
    expect(comp.fragments()).toHaveLength(1)
    expect(comp.loading()).toBe(false)
  })

  it('calls fragmentService.sync on saveDocument', () => {
    const syncSubject = new Subject()
    const fixture = createComponent()
    const comp = fixture.componentInstance
    mockFragmentService.list.mockReturnValue(of([]))
    mockFragmentService.sync.mockReturnValue(syncSubject)
    comp.editorHtml.set('<p>Hello</p>')
    comp.document.set(mockDoc)

    comp.saveDocument()

    expect(comp.saving()).toBe(true)
    expect(mockFragmentService.sync).toHaveBeenCalled()

    syncSubject.next({ updated: [], created: [], deleted: [] })
    syncSubject.complete()
  })

  it('calls documentService.update on changeStatus', () => {
    const fixture = createComponent()
    const comp = fixture.componentInstance
    mockDocumentService.update.mockReturnValue(of(mockDoc))
    comp.document.set(mockDoc)

    comp.changeStatus('ACTIVE')

    expect(mockDocumentService.update).toHaveBeenCalledWith('doc-1', { doc_status: 'ACTIVE' })
  })

  it('updates editorHtml and saved flag onContentChange', () => {
    const fixture = createComponent()
    const comp = fixture.componentInstance
    comp.saved.set(true)

    comp.onContentChange('<p>Updated</p>')

    expect(comp.editorHtml()).toBe('<p>Updated</p>')
    expect(comp.saved()).toBe(false)
  })

  it('toggles panel collapsed', () => {
    const fixture = createComponent()
    const comp = fixture.componentInstance
    comp.panelCollapsed.set(false)

    comp.togglePanel()
    expect(comp.panelCollapsed()).toBe(true)

    comp.togglePanel()
    expect(comp.panelCollapsed()).toBe(false)
  })

  it('toggles format bar', () => {
    const fixture = createComponent()
    const comp = fixture.componentInstance
    comp.toggleFormatBar()
    expect(comp.showFormatBar()).toBe(true)

    comp.toggleFormatBar()
    expect(comp.showFormatBar()).toBe(false)
  })

  it('toggles chat', () => {
    const fixture = createComponent()
    const comp = fixture.componentInstance
    comp.toggleChat()
    expect(comp.chatOpen()).toBe(true)

    comp.toggleChat()
    expect(comp.chatOpen()).toBe(false)
  })

  it('navigates on onSelectDoc to different doc', () => {
    const fixture = createComponent()
    const comp = fixture.componentInstance
    const router = TestBed.inject(Router)
    vi.spyOn(router, 'navigate')

    comp.docUuid.set('current')
    comp.onSelectDoc('new-doc')

    expect(router.navigate).toHaveBeenCalledWith(['/documents', 'new-doc'])
  })

  it('ignores onSelectDoc when same doc', () => {
    const fixture = createComponent()
    const comp = fixture.componentInstance
    const router = TestBed.inject(Router)
    vi.spyOn(router, 'navigate')

    const uuid = 'same-doc'
    comp.docUuid.set(uuid)
    comp.onSelectDoc(uuid)

    expect(router.navigate).not.toHaveBeenCalled()
  })

  it('handles panel resize', () => {
    const fixture = createComponent()
    const comp = fixture.componentInstance

    comp.onResizeStart(new MouseEvent('mousedown', { clientX: 400 }))
    expect(comp.isResizing).toBe(true)

    comp.onMouseMove(new MouseEvent('mousemove', { clientX: 350 }))
    expect(comp.panelWidth()).toBe(350)

    comp.onMouseMove(new MouseEvent('mousemove', { clientX: 100 }))
    expect(comp.panelWidth()).toBe(220)

    comp.onMouseMove(new MouseEvent('mousemove', { clientX: 600 }))
    expect(comp.panelWidth()).toBe(500)

    comp.onMouseUp()
    expect(comp.isResizing).toBe(false)
  })

  it('maps doc status labels', () => {
    const fixture = createComponent()
    const comp = fixture.componentInstance
    expect(comp.docStatusLabel('DRAFT')).toBe('Borrador')
    expect(comp.docStatusLabel('ACTIVE')).toBe('Activo')
    expect(comp.docStatusLabel('ABANDONED')).toBe('Abandonado')
    expect(comp.docStatusLabel('ARCHIVED')).toBe('Archivado')
    expect(comp.docStatusLabel('UNKNOWN')).toBe('UNKNOWN')
  })
})
