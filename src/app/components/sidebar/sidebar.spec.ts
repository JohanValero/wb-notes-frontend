import { describe, it, expect, beforeEach } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { provideRouter } from '@angular/router'
import { SidebarComponent } from './sidebar'

describe('SidebarComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [provideRouter([])],
    }).compileComponents()
  })

  it('creates the component', () => {
    const fixture = TestBed.createComponent(SidebarComponent)
    expect(fixture.componentInstance).toBeTruthy()
  })
})
