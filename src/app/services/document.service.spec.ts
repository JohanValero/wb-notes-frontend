import { describe, it, expect, afterEach } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { DocumentService } from './document.service'
import { Document, DocType } from '../models/document.model'

const mockDoc: Document = {
  uuid: 'doc-1',
  workspace_uuid: 'ws-1',
  doc_type: 'NOVEL',
  title: 'Test',
  doc_status: 'DRAFT',
  source: 'manual',
  is_dirty: false,
  metadata: null,
  created_t: '2024-01-01T00:00:00Z',
  updated_t: '2024-01-01T00:00:00Z',
}

describe('DocumentService', () => {
  let service: DocumentService
  let httpMock: HttpTestingController

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), DocumentService],
    })
    service = TestBed.inject(DocumentService)
    httpMock = TestBed.inject(HttpTestingController)
  })

  afterEach(() => {
    httpMock.verify()
  })

  it('lists document types', () => {
    const types: DocType[] = [{ tag: 'NOVEL', label: 'Novela', description: null, is_primary: true }]
    service.listTypes().subscribe((result) => expect(result).toEqual(types))
    const req = httpMock.expectOne('/api/documents/types')
    expect(req.request.method).toBe('GET')
    req.flush(types)
  })

  it('lists documents', () => {
    service.list('ws-1').subscribe((docs) => expect(docs).toEqual([mockDoc]))
    const req = httpMock.expectOne('/api/documents?workspace_uuid=ws-1')
    expect(req.request.method).toBe('GET')
    req.flush([mockDoc])
  })

  it('lists documents with doc_type filter', () => {
    service.list('ws-1', 'NOVEL').subscribe()
    const req = httpMock.expectOne('/api/documents?workspace_uuid=ws-1&doc_type=NOVEL')
    expect(req.request.method).toBe('GET')
    req.flush([])
  })

  it('gets a document by uuid', () => {
    service.get('doc-1').subscribe((doc) => expect(doc).toEqual(mockDoc))
    const req = httpMock.expectOne('/api/documents/doc-1')
    expect(req.request.method).toBe('GET')
    req.flush(mockDoc)
  })

  it('creates a document', () => {
    service.create('ws-1', { doc_type: 'NOVEL', title: 'New' }).subscribe((doc) => expect(doc).toEqual(mockDoc))
    const req = httpMock.expectOne('/api/documents?workspace_uuid=ws-1')
    expect(req.request.method).toBe('POST')
    expect(req.request.body).toEqual({ doc_type: 'NOVEL', title: 'New' })
    req.flush(mockDoc)
  })

  it('updates a document', () => {
    service.update('doc-1', { title: 'Updated' }).subscribe((doc) => expect(doc).toEqual(mockDoc))
    const req = httpMock.expectOne('/api/documents/doc-1')
    expect(req.request.method).toBe('PUT')
    expect(req.request.body).toEqual({ title: 'Updated' })
    req.flush(mockDoc)
  })

  it('deletes a document', () => {
    service.delete('doc-1').subscribe()
    const req = httpMock.expectOne('/api/documents/doc-1')
    expect(req.request.method).toBe('DELETE')
    req.flush(null)
  })
})
