import { describe, it, expect, afterEach } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { FragmentService, SyncItem, SyncResult } from './fragment.service'
import { Fragment } from '../models/fragment.model'

const mockFragment: Fragment = {
  uuid: 'f1',
  document_uuid: 'doc-1',
  workspace_uuid: 'ws-1',
  content: '<p>Hello</p>',
  content_hash: 'abc123',
  position: 0,
  is_dirty: false,
  created_t: '2024-01-01T00:00:00Z',
  updated_t: '2024-01-01T00:00:00Z',
}

describe('FragmentService', () => {
  let service: FragmentService
  let httpMock: HttpTestingController

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), FragmentService],
    })
    service = TestBed.inject(FragmentService)
    httpMock = TestBed.inject(HttpTestingController)
  })

  afterEach(() => {
    httpMock.verify()
  })

  it('lists fragments by document uuid', () => {
    service.list('doc-1').subscribe((frags) => expect(frags).toEqual([mockFragment]))
    const req = httpMock.expectOne('/api/fragments?document_uuid=doc-1')
    expect(req.request.method).toBe('GET')
    req.flush([mockFragment])
  })

  it('gets a fragment by uuid', () => {
    service.get('f1').subscribe((f) => expect(f).toEqual(mockFragment))
    const req = httpMock.expectOne('/api/fragments/f1')
    expect(req.request.method).toBe('GET')
    req.flush(mockFragment)
  })

  it('creates a fragment', () => {
    service.create('doc-1', { content: '<p>New</p>', position: 1 }).subscribe((f) => expect(f).toEqual(mockFragment))
    const req = httpMock.expectOne('/api/fragments?document_uuid=doc-1')
    expect(req.request.method).toBe('POST')
    expect(req.request.body).toEqual({ content: '<p>New</p>', position: 1 })
    req.flush(mockFragment)
  })

  it('updates a fragment', () => {
    service.update('f1', { content: '<p>Updated</p>' }).subscribe((f) => expect(f).toEqual(mockFragment))
    const req = httpMock.expectOne('/api/fragments/f1')
    expect(req.request.method).toBe('PUT')
    expect(req.request.body).toEqual({ content: '<p>Updated</p>' })
    req.flush(mockFragment)
  })

  it('deletes a fragment', () => {
    service.delete('f1').subscribe()
    const req = httpMock.expectOne('/api/fragments/f1')
    expect(req.request.method).toBe('DELETE')
    req.flush(null)
  })

  it('syncs fragments', () => {
    const items: SyncItem[] = [{ uuid: 'f1', content: '<p>Hello</p>' }]
    const result: SyncResult = { updated: ['f1'], created: [], deleted: [] }
    service.sync('doc-1', items).subscribe((r) => expect(r).toEqual(result))
    const req = httpMock.expectOne('/api/fragments/sync/doc-1')
    expect(req.request.method).toBe('PUT')
    expect(req.request.body).toEqual(items)
    req.flush(result)
  })
})
