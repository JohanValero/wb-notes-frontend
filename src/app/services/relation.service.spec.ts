import { describe, it, expect, afterEach } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { RelationService } from './relation.service'
import { Relation, RelationType } from '../models/relation.model'

const mockRelation: Relation = {
  uuid: 'r1',
  source_uuid: 'doc-a',
  target_uuid: 'doc-b',
  relation_type: 'REFERENCES',
  confidence: 0.9,
  metadata: null,
  created_t: '2024-01-01T00:00:00Z',
}

describe('RelationService', () => {
  let service: RelationService
  let httpMock: HttpTestingController

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), RelationService],
    })
    service = TestBed.inject(RelationService)
    httpMock = TestBed.inject(HttpTestingController)
  })

  afterEach(() => {
    httpMock.verify()
  })

  it('lists relation types', () => {
    const types: RelationType[] = [{ tag: 'REFERENCES', label: 'Referencia', description: null, implies_dependency: false }]
    service.listTypes().subscribe((result) => expect(result).toEqual(types))
    const req = httpMock.expectOne('/api/relations/types')
    expect(req.request.method).toBe('GET')
    req.flush(types)
  })

  it('lists relations', () => {
    service.list().subscribe((list) => expect(list).toEqual([mockRelation]))
    const req = httpMock.expectOne('/api/relations')
    expect(req.request.method).toBe('GET')
    req.flush([mockRelation])
  })

  it('lists relations with filters', () => {
    service.list('doc-a', undefined, 'REFERENCES').subscribe()
    const req = httpMock.expectOne('/api/relations?source_uuid=doc-a&relation_type=REFERENCES')
    expect(req.request.method).toBe('GET')
    req.flush([])
  })

  it('gets a relation by uuid', () => {
    service.get('r1').subscribe((r) => expect(r).toEqual(mockRelation))
    const req = httpMock.expectOne('/api/relations/r1')
    expect(req.request.method).toBe('GET')
    req.flush(mockRelation)
  })

  it('creates a relation', () => {
    service.create({ source_uuid: 'a', target_uuid: 'b', relation_type: 'REFERENCES', confidence: 0.8 }).subscribe((r) => expect(r).toEqual(mockRelation))
    const req = httpMock.expectOne('/api/relations')
    expect(req.request.method).toBe('POST')
    expect(req.request.body).toEqual({ source_uuid: 'a', target_uuid: 'b', relation_type: 'REFERENCES', confidence: 0.8 })
    req.flush(mockRelation)
  })

  it('updates a relation', () => {
    service.update('r1', { confidence: 0.5 }).subscribe((r) => expect(r).toEqual(mockRelation))
    const req = httpMock.expectOne('/api/relations/r1')
    expect(req.request.method).toBe('PUT')
    expect(req.request.body).toEqual({ confidence: 0.5 })
    req.flush(mockRelation)
  })

  it('deletes a relation', () => {
    service.delete('r1').subscribe()
    const req = httpMock.expectOne('/api/relations/r1')
    expect(req.request.method).toBe('DELETE')
    req.flush(null)
  })
})
