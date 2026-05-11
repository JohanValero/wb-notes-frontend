import { describe, it, expect, vi } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { of } from 'rxjs'
import { RelationViewComponent } from './relation-view'
import { RelationService } from '../../services/relation.service'
import { Relation, RelationType } from '../../models/relation.model'

describe('RelationViewComponent', () => {
  let mockService: {
    list: ReturnType<typeof vi.fn>
    listTypes: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
    delete: ReturnType<typeof vi.fn>
  }

  const mockRelations: Relation[] = [
    { uuid: 'r1', source_uuid: 'doc-a', target_uuid: 'doc-b', relation_type: 'REFERENCES', confidence: 0.9, metadata: null, created_t: '' },
  ]
  const mockTypes: RelationType[] = [{ tag: 'REFERENCES', label: 'Referencia', description: null, implies_dependency: false }]

  function createComponent() {
    mockService = { list: vi.fn(), listTypes: vi.fn(), create: vi.fn(), delete: vi.fn() }
    TestBed.configureTestingModule({
      imports: [RelationViewComponent],
      providers: [{ provide: RelationService, useValue: mockService }],
      schemas: [NO_ERRORS_SCHEMA],
    })
    return TestBed.createComponent(RelationViewComponent)
  }

  it('loads relation types and relations on init', () => {
    const fixture = createComponent()
    mockService.listTypes.mockReturnValue(of(mockTypes))
    mockService.list.mockReturnValue(of(mockRelations))
    fixture.detectChanges()
    const comp = fixture.componentInstance
    expect(comp.relationTypes()).toEqual(mockTypes)
    expect(comp.relations()).toEqual(mockRelations)
    expect(comp.loading()).toBe(false)
  })

  it('filters relations by type', () => {
    const fixture = createComponent()
    mockService.listTypes.mockReturnValue(of(mockTypes))
    mockService.list.mockReturnValue(of(mockRelations))
    fixture.detectChanges()
    const comp = fixture.componentInstance

    mockService.list.mockReturnValue(of([]))
    comp.filterByType('REFERENCES')
    expect(comp.selectedType()).toBe('REFERENCES')
    expect(mockService.list).toHaveBeenCalledWith(undefined, undefined, 'REFERENCES')

    comp.filterByType(null)
    expect(comp.selectedType()).toBeNull()
    expect(mockService.list).toHaveBeenCalledWith()
  })

  it('creates a relation', () => {
    const fixture = createComponent()
    mockService.listTypes.mockReturnValue(of(mockTypes))
    mockService.list.mockReturnValue(of(mockRelations))
    mockService.create.mockReturnValue(of(mockRelations[0]))
    fixture.detectChanges()
    const comp = fixture.componentInstance

    comp.startCreate()
    expect(comp.showForm()).toBe(true)
    expect(comp.formSource).toBe('')
    expect(comp.formTarget).toBe('')
    expect(comp.formType).toBe('')

    comp.formSource = 'a'
    comp.formTarget = 'b'
    comp.formType = 'REFERENCES'
    comp.create()

    expect(mockService.create).toHaveBeenCalledWith({
      source_uuid: 'a',
      target_uuid: 'b',
      relation_type: 'REFERENCES',
      confidence: 1.0,
    })
    expect(comp.showForm()).toBe(false)
  })

  it('does not create if required fields are empty', () => {
    const fixture = createComponent()
    mockService.listTypes.mockReturnValue(of(mockTypes))
    mockService.list.mockReturnValue(of(mockRelations))
    fixture.detectChanges()
    const comp = fixture.componentInstance

    comp.create()
    expect(mockService.create).not.toHaveBeenCalled()

    comp.formSource = 'a'
    comp.create()
    expect(mockService.create).not.toHaveBeenCalled()

    comp.formTarget = 'b'
    comp.create()
    expect(mockService.create).not.toHaveBeenCalled()
  })

  it('deletes a relation after confirm', () => {
    const fixture = createComponent()
    mockService.listTypes.mockReturnValue(of(mockTypes))
    mockService.list.mockReturnValue(of(mockRelations))
    mockService.delete.mockReturnValue(of(undefined))
    fixture.detectChanges()
    const comp = fixture.componentInstance

    vi.spyOn(window, 'confirm').mockReturnValue(true)
    comp.delete('r1')

    expect(mockService.delete).toHaveBeenCalledWith('r1')
  })

  it('does not delete if confirm is cancelled', () => {
    const fixture = createComponent()
    mockService.listTypes.mockReturnValue(of(mockTypes))
    mockService.list.mockReturnValue(of(mockRelations))
    fixture.detectChanges()
    const comp = fixture.componentInstance

    vi.spyOn(window, 'confirm').mockReturnValue(false)
    comp.delete('r1')

    expect(mockService.delete).not.toHaveBeenCalled()
  })

  it('maps relation type labels', () => {
    const fixture = createComponent()
    mockService.listTypes.mockReturnValue(of(mockTypes))
    mockService.list.mockReturnValue(of(mockRelations))
    fixture.detectChanges()
    const comp = fixture.componentInstance

    expect(comp.typeLabel('REFERENCES')).toBe('Referencia')
    expect(comp.typeLabel('UNKNOWN')).toBe('UNKNOWN')
  })

  it('cancels form', () => {
    const fixture = createComponent()
    mockService.listTypes.mockReturnValue(of(mockTypes))
    mockService.list.mockReturnValue(of(mockRelations))
    fixture.detectChanges()
    const comp = fixture.componentInstance
    comp.showForm.set(true)

    comp.cancelForm()
    expect(comp.showForm()).toBe(false)
  })
})
