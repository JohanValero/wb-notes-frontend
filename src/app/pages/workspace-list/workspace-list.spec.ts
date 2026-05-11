import { describe, it, expect, vi } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { provideRouter } from '@angular/router'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { of } from 'rxjs'
import { WorkspaceListComponent } from './workspace-list'
import { WorkspaceService } from '../../services/workspace.service'
import { Workspace } from '../../models/workspace.model'

describe('WorkspaceListComponent', () => {
  let mockWorkspaceService: {
    list: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    delete: ReturnType<typeof vi.fn>
  }

  const mockWorkspaces: Workspace[] = [
    { uuid: 'ws-1', name: 'WS 1', description: null, created_t: '', updated_t: '' },
    { uuid: 'ws-2', name: 'WS 2', description: 'Desc', created_t: '', updated_t: '' },
  ]

  function createComponent() {
    mockWorkspaceService = { list: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() }
    TestBed.configureTestingModule({
      imports: [WorkspaceListComponent],
      providers: [
        { provide: WorkspaceService, useValue: mockWorkspaceService },
        provideRouter([]),
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    return TestBed.createComponent(WorkspaceListComponent)
  }

  it('loads workspaces on init', () => {
    const fixture = createComponent()
    mockWorkspaceService.list.mockReturnValue(of(mockWorkspaces))
    fixture.detectChanges()
    const comp = fixture.componentInstance
    expect(comp.workspaces()).toEqual(mockWorkspaces)
    expect(comp.loading()).toBe(false)
  })

  it('shows loading state initially', () => {
    const fixture = createComponent()
    const comp = fixture.componentInstance
    expect(comp.loading()).toBe(true)
  })

  it('starts create flow', () => {
    const fixture = createComponent()
    mockWorkspaceService.list.mockReturnValue(of(mockWorkspaces))
    fixture.detectChanges()
    const comp = fixture.componentInstance

    comp.startCreate()
    expect(comp.showForm()).toBe(true)
    expect(comp.editingId()).toBeNull()
    expect(comp.formName).toBe('')
    expect(comp.formDescription).toBe('')
  })

  it('starts edit flow', () => {
    const fixture = createComponent()
    mockWorkspaceService.list.mockReturnValue(of(mockWorkspaces))
    fixture.detectChanges()
    const comp = fixture.componentInstance

    comp.startEdit(mockWorkspaces[1])
    expect(comp.showForm()).toBe(true)
    expect(comp.editingId()).toBe('ws-2')
    expect(comp.formName).toBe('WS 2')
    expect(comp.formDescription).toBe('Desc')
  })

  it('cancels form', () => {
    const fixture = createComponent()
    mockWorkspaceService.list.mockReturnValue(of(mockWorkspaces))
    fixture.detectChanges()
    const comp = fixture.componentInstance
    comp.showForm.set(true)
    comp.editingId.set('ws-1')

    comp.cancelForm()
    expect(comp.showForm()).toBe(false)
    expect(comp.editingId()).toBeNull()
  })

  it('creates a new workspace', () => {
    const fixture = createComponent()
    mockWorkspaceService.list.mockReturnValue(of(mockWorkspaces))
    mockWorkspaceService.create.mockReturnValue(of(mockWorkspaces[0]))
    fixture.detectChanges()
    const comp = fixture.componentInstance

    comp.formName = 'New WS'
    comp.formDescription = 'Desc'
    comp.save()

    expect(mockWorkspaceService.create).toHaveBeenCalledWith({ name: 'New WS', description: 'Desc' })
    expect(comp.showForm()).toBe(false)
    expect(comp.editingId()).toBeNull()
  })

  it('updates an existing workspace', () => {
    const fixture = createComponent()
    mockWorkspaceService.list.mockReturnValue(of(mockWorkspaces))
    mockWorkspaceService.update.mockReturnValue(of(mockWorkspaces[0]))
    fixture.detectChanges()
    const comp = fixture.componentInstance
    comp.editingId.set('ws-1')
    comp.formName = 'Updated'
    comp.formDescription = ''

    comp.save()

    expect(mockWorkspaceService.update).toHaveBeenCalledWith('ws-1', { name: 'Updated', description: null })
  })

  it('does not save if name is empty', () => {
    const fixture = createComponent()
    mockWorkspaceService.list.mockReturnValue(of(mockWorkspaces))
    fixture.detectChanges()
    const comp = fixture.componentInstance
    comp.formName = ''

    comp.save()

    expect(mockWorkspaceService.create).not.toHaveBeenCalled()
    expect(mockWorkspaceService.update).not.toHaveBeenCalled()
  })

  it('deletes a workspace after confirm', () => {
    const fixture = createComponent()
    mockWorkspaceService.list.mockReturnValue(of(mockWorkspaces))
    mockWorkspaceService.delete.mockReturnValue(of(undefined))
    fixture.detectChanges()
    const comp = fixture.componentInstance

    vi.spyOn(window, 'confirm').mockReturnValue(true)
    comp.delete('ws-1')

    expect(mockWorkspaceService.delete).toHaveBeenCalledWith('ws-1')
  })

  it('does not delete if confirm is cancelled', () => {
    const fixture = createComponent()
    mockWorkspaceService.list.mockReturnValue(of(mockWorkspaces))
    fixture.detectChanges()
    const comp = fixture.componentInstance

    vi.spyOn(window, 'confirm').mockReturnValue(false)
    comp.delete('ws-1')

    expect(mockWorkspaceService.delete).not.toHaveBeenCalled()
  })
})
