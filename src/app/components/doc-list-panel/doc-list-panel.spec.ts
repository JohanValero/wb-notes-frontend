import { describe, it, expect, vi } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { provideRouter } from '@angular/router'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { of } from 'rxjs'
import { DocListPanelComponent } from './doc-list-panel'
import { DocumentService } from '../../services/document.service'
import { Document, DocType } from '../../models/document.model'

describe('DocListPanelComponent', () => {
  let mockDocumentService: {
    list: ReturnType<typeof vi.fn>
    listTypes: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
  }

  const mockDocs: Document[] = [
    { uuid: 'd1', workspace_uuid: 'ws-1', title: 'Doc 1', doc_type: 'NOVEL', doc_status: 'DRAFT', source: 'manual', is_dirty: false, metadata: null, created_t: '', updated_t: '' },
    { uuid: 'd2', workspace_uuid: 'ws-1', title: 'Doc 2', doc_type: 'CHARACTER', doc_status: 'ACTIVE', source: 'manual', is_dirty: false, metadata: null, created_t: '', updated_t: '' },
  ]

  const mockTypes: DocType[] = [
    { tag: 'NOVEL', label: 'Novela', description: null, is_primary: true },
    { tag: 'CHARACTER', label: 'Personaje', description: null, is_primary: false },
  ]

  function createComponent() {
    mockDocumentService = { list: vi.fn(), listTypes: vi.fn(), create: vi.fn() }
    TestBed.configureTestingModule({
      imports: [DocListPanelComponent],
      providers: [
        { provide: DocumentService, useValue: mockDocumentService },
        provideRouter([]),
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    return TestBed.createComponent(DocListPanelComponent)
  }

  it('loads document types and documents on init', () => {
    const fixture = createComponent()
    mockDocumentService.listTypes.mockReturnValue(of(mockTypes))
    mockDocumentService.list.mockReturnValue(of(mockDocs))
    fixture.componentRef.setInput('workspaceUuid', 'ws-1')
    fixture.detectChanges()
    const comp = fixture.componentInstance
    expect(comp.docTypes()).toEqual(mockTypes)
    expect(comp.allDocuments()).toEqual(mockDocs)
    expect(comp.documents()).toEqual(mockDocs)
    expect(comp.loading()).toBe(false)
  })

  it('reloads documents when workspaceUuid changes', () => {
    const fixture = createComponent()
    mockDocumentService.listTypes.mockReturnValue(of(mockTypes))
    mockDocumentService.list.mockReturnValue(of(mockDocs))
    fixture.componentRef.setInput('workspaceUuid', 'ws-1')
    fixture.detectChanges()
    expect(mockDocumentService.list).toHaveBeenCalledTimes(1)

    fixture.componentRef.setInput('workspaceUuid', 'ws-2')
    fixture.detectChanges()
    expect(mockDocumentService.list).toHaveBeenCalledTimes(2)
    expect(mockDocumentService.list).toHaveBeenCalledWith('ws-2')
  })

  it('filters documents by type', () => {
    const fixture = createComponent()
    mockDocumentService.listTypes.mockReturnValue(of(mockTypes))
    mockDocumentService.list.mockReturnValue(of(mockDocs))
    fixture.componentRef.setInput('workspaceUuid', 'ws-1')
    fixture.detectChanges()
    const comp = fixture.componentInstance

    comp.setFilter('NOVEL')
    expect(comp.activeFilter()).toBe('NOVEL')
    expect(comp.documents()).toHaveLength(1)
    expect(comp.documents()[0].doc_type).toBe('NOVEL')

    comp.setFilter(null)
    expect(comp.activeFilter()).toBeNull()
    expect(comp.documents()).toHaveLength(2)
  })

  it('creates a document and emits selectDoc', () => {
    const newDoc: Document = { uuid: 'new-doc', workspace_uuid: 'ws-1', title: 'New', doc_type: 'NOVEL', doc_status: 'DRAFT', source: 'manual', is_dirty: false, metadata: null, created_t: '', updated_t: '' }
    const fixture = createComponent()
    mockDocumentService.listTypes.mockReturnValue(of(mockTypes))
    mockDocumentService.list.mockReturnValue(of(mockDocs))
    mockDocumentService.create.mockReturnValue(of(newDoc))
    fixture.componentRef.setInput('workspaceUuid', 'ws-1')
    fixture.detectChanges()
    const comp = fixture.componentInstance

    comp.startCreate()
    expect(comp.showCreate()).toBe(true)

    comp.formDocType = 'NOVEL'
    comp.formTitle = 'New'
    comp.createDoc()

    expect(mockDocumentService.create).toHaveBeenCalledWith('ws-1', { doc_type: 'NOVEL', title: 'New' })
    expect(comp.showCreate()).toBe(false)
  })

  it('startCreate resets form fields', () => {
    const fixture = createComponent()
    mockDocumentService.listTypes.mockReturnValue(of(mockTypes))
    mockDocumentService.list.mockReturnValue(of(mockDocs))
    fixture.componentRef.setInput('workspaceUuid', 'ws-1')
    fixture.detectChanges()
    const comp = fixture.componentInstance

    comp.formDocType = 'NOVEL'
    comp.formTitle = 'Title'
    comp.startCreate()

    expect(comp.formDocType).toBe('')
    expect(comp.formTitle).toBe('')
    expect(comp.showCreate()).toBe(true)
  })

  it('cancelCreate hides form', () => {
    const fixture = createComponent()
    mockDocumentService.listTypes.mockReturnValue(of(mockTypes))
    mockDocumentService.list.mockReturnValue(of(mockDocs))
    fixture.componentRef.setInput('workspaceUuid', 'ws-1')
    fixture.detectChanges()
    const comp = fixture.componentInstance
    comp.showCreate.set(true)

    comp.cancelCreate()
    expect(comp.showCreate()).toBe(false)
  })

  it('does not create if formDocType is empty', () => {
    const fixture = createComponent()
    mockDocumentService.listTypes.mockReturnValue(of(mockTypes))
    mockDocumentService.list.mockReturnValue(of(mockDocs))
    fixture.componentRef.setInput('workspaceUuid', 'ws-1')
    fixture.detectChanges()
    const comp = fixture.componentInstance

    comp.formDocType = ''
    comp.createDoc()

    expect(mockDocumentService.create).not.toHaveBeenCalled()
  })
})
