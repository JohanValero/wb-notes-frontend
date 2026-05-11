import { describe, it, expect, afterEach } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { WorkspaceService } from './workspace.service'
import { Workspace } from '../models/workspace.model'

const mockWs: Workspace = {
  uuid: 'ws-1',
  name: 'Test Workspace',
  description: 'A test',
  created_t: '2024-01-01T00:00:00Z',
  updated_t: '2024-01-01T00:00:00Z',
}

describe('WorkspaceService', () => {
  let service: WorkspaceService
  let httpMock: HttpTestingController

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), WorkspaceService],
    })
    service = TestBed.inject(WorkspaceService)
    httpMock = TestBed.inject(HttpTestingController)
  })

  afterEach(() => {
    httpMock.verify()
  })

  it('lists workspaces', () => {
    service.list().subscribe((list) => expect(list).toEqual([mockWs]))
    const req = httpMock.expectOne('/api/workspaces')
    expect(req.request.method).toBe('GET')
    req.flush([mockWs])
  })

  it('gets a workspace by uuid', () => {
    service.get('ws-1').subscribe((ws) => expect(ws).toEqual(mockWs))
    const req = httpMock.expectOne('/api/workspaces/ws-1')
    expect(req.request.method).toBe('GET')
    req.flush(mockWs)
  })

  it('creates a workspace', () => {
    service.create({ name: 'New', description: 'Desc' }).subscribe((ws) => expect(ws).toEqual(mockWs))
    const req = httpMock.expectOne('/api/workspaces')
    expect(req.request.method).toBe('POST')
    expect(req.request.body).toEqual({ name: 'New', description: 'Desc' })
    req.flush(mockWs)
  })

  it('updates a workspace', () => {
    service.update('ws-1', { name: 'Updated' }).subscribe((ws) => expect(ws).toEqual(mockWs))
    const req = httpMock.expectOne('/api/workspaces/ws-1')
    expect(req.request.method).toBe('PUT')
    expect(req.request.body).toEqual({ name: 'Updated' })
    req.flush(mockWs)
  })

  it('deletes a workspace', () => {
    service.delete('ws-1').subscribe()
    const req = httpMock.expectOne('/api/workspaces/ws-1')
    expect(req.request.method).toBe('DELETE')
    req.flush(null)
  })
})
