import { describe, it, expect, vi } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { provideRouter, ActivatedRoute } from '@angular/router'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { of } from 'rxjs'
import { WorkspaceDetailComponent } from './workspace-detail'
import { WorkspaceService } from '../../services/workspace.service'
import { DocumentService } from '../../services/document.service'
import { Workspace } from '../../models/workspace.model'
import { Document, DocType } from '../../models/document.model'

describe('WorkspaceDetailComponent', () => {
  let mockDocumentService: { list: ReturnType<typeof vi.fn>; listTypes: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> }
  let mockWorkspaceService: { get: ReturnType<typeof vi.fn> }

  const mockWs: Workspace = { uuid: 'ws-1', name: 'Test WS', description: 'Desc', created_t: '', updated_t: '' }
  const mockDocs: Document[] = [
    { uuid: 'd1', workspace_uuid: 'ws-1', title: 'Doc 1', doc_type: 'NOVEL', doc_status: 'DRAFT', source: 'manual', is_dirty: false, metadata: null, created_t: '', updated_t: '' },
  ]
  const mockTypes: DocType[] = [{ tag: 'NOVEL', label: 'Novela', description: null, is_primary: true }]

  function createComponent() {
    mockDocumentService = { list: vi.fn(), listTypes: vi.fn(), create: vi.fn(), delete: vi.fn() }
    mockWorkspaceService = { get: vi.fn() }
    TestBed.configureTestingModule({
      imports: [WorkspaceDetailComponent],
      providers: [
        { provide: DocumentService, useValue: mockDocumentService },
        { provide: WorkspaceService, useValue: mockWorkspaceService },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'ws-1' } } } },
        provideRouter([]),
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    return TestBed.createComponent(WorkspaceDetailComponent)
  }

  it('loads workspace, types and documents on init', () => {
    const fixture = createComponent()
    mockDocumentService.listTypes.mockReturnValue(of(mockTypes))
    mockDocumentService.list.mockReturnValue(of(mockDocs))
    mockWorkspaceService.get.mockReturnValue(of(mockWs))
    fixture.detectChanges()
    const comp = fixture.componentInstance
    expect(comp.workspace()).toEqual(mockWs)
    expect(comp.docTypes()).toEqual(mockTypes)
    expect(comp.documents()).toEqual(mockDocs)
    expect(comp.loading()).toBe(false)
  })

  it('filters documents by type via server', () => {
    const fixture = createComponent()
    mockDocumentService.listTypes.mockReturnValue(of(mockTypes))
    mockDocumentService.list.mockReturnValue(of(mockDocs))
    mockWorkspaceService.get.mockReturnValue(of(mockWs))
    fixture.detectChanges()
    const comp = fixture.componentInstance

    mockDocumentService.list.mockReturnValue(of([]))
    comp.filterByType('NOVEL')
    expect(comp.selectedType()).toBe('NOVEL')
    expect(mockDocumentService.list).toHaveBeenCalledWith('ws-1', 'NOVEL')

    comp.filterByType(null)
    expect(comp.selectedType()).toBeNull()
    expect(mockDocumentService.list).toHaveBeenCalledWith('ws-1')
  })

  it('creates a document', () => {
    const fixture = createComponent()
    mockDocumentService.listTypes.mockReturnValue(of(mockTypes))
    mockDocumentService.list.mockReturnValue(of(mockDocs))
    mockDocumentService.create.mockReturnValue(of(mockDocs[0]))
    mockWorkspaceService.get.mockReturnValue(of(mockWs))
    fixture.detectChanges()
    const comp = fixture.componentInstance

    comp.startCreate()
    expect(comp.showForm()).toBe(true)

    comp.formDocType = 'NOVEL'
    comp.formTitle = 'New Doc'
    comp.createDoc()

    expect(mockDocumentService.create).toHaveBeenCalledWith('ws-1', { doc_type: 'NOVEL', title: 'New Doc' })
    expect(comp.showForm()).toBe(false)
  })

  it('does not create if formDocType is empty', () => {
    const fixture = createComponent()
    mockDocumentService.listTypes.mockReturnValue(of(mockTypes))
    mockDocumentService.list.mockReturnValue(of(mockDocs))
    mockWorkspaceService.get.mockReturnValue(of(mockWs))
    fixture.detectChanges()
    const comp = fixture.componentInstance

    comp.formDocType = ''
    comp.createDoc()

    expect(mockDocumentService.create).not.toHaveBeenCalled()
  })

  it('deletes a document after confirm', () => {
    const fixture = createComponent()
    mockDocumentService.listTypes.mockReturnValue(of(mockTypes))
    mockDocumentService.list.mockReturnValue(of(mockDocs))
    mockDocumentService.delete.mockReturnValue(of(undefined))
    mockWorkspaceService.get.mockReturnValue(of(mockWs))
    fixture.detectChanges()
    const comp = fixture.componentInstance

    vi.spyOn(window, 'confirm').mockReturnValue(true)
    comp.deleteDoc('d1')

    expect(mockDocumentService.delete).toHaveBeenCalledWith('d1')
  })

  it('does not delete if confirm is cancelled', () => {
    const fixture = createComponent()
    mockDocumentService.listTypes.mockReturnValue(of(mockTypes))
    mockDocumentService.list.mockReturnValue(of(mockDocs))
    mockWorkspaceService.get.mockReturnValue(of(mockWs))
    fixture.detectChanges()
    const comp = fixture.componentInstance

    vi.spyOn(window, 'confirm').mockReturnValue(false)
    comp.deleteDoc('d1')

    expect(mockDocumentService.delete).not.toHaveBeenCalled()
  })

  it('maps doc type labels', () => {
    const fixture = createComponent()
    mockDocumentService.listTypes.mockReturnValue(of(mockTypes))
    mockDocumentService.list.mockReturnValue(of(mockDocs))
    mockWorkspaceService.get.mockReturnValue(of(mockWs))
    fixture.detectChanges()
    const comp = fixture.componentInstance

    expect(comp.docTypeLabel('NOVEL')).toBe('Novela')
    expect(comp.docTypeLabel('UNKNOWN')).toBe('UNKNOWN')
  })

  it('maps doc status labels', () => {
    const fixture = createComponent()
    mockDocumentService.listTypes.mockReturnValue(of(mockTypes))
    mockDocumentService.list.mockReturnValue(of(mockDocs))
    mockWorkspaceService.get.mockReturnValue(of(mockWs))
    fixture.detectChanges()
    const comp = fixture.componentInstance

    expect(comp.docStatusLabel('DRAFT')).toBe('Borrador')
    expect(comp.docStatusLabel('ACTIVE')).toBe('Activo')
    expect(comp.docStatusLabel('UNKNOWN')).toBe('UNKNOWN')
  })

  it('cancels form', () => {
    const fixture = createComponent()
    mockDocumentService.listTypes.mockReturnValue(of(mockTypes))
    mockDocumentService.list.mockReturnValue(of(mockDocs))
    mockWorkspaceService.get.mockReturnValue(of(mockWs))
    fixture.detectChanges()
    const comp = fixture.componentInstance
    comp.showForm.set(true)

    comp.cancelForm()
    expect(comp.showForm()).toBe(false)
  })
})
