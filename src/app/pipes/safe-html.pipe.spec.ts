import { describe, it, expect, beforeEach } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { SafeHtmlPipe } from './safe-html.pipe'
import { DomSanitizer } from '@angular/platform-browser'

describe('SafeHtmlPipe', () => {
  let pipe: SafeHtmlPipe
  let sanitizer: DomSanitizer

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SafeHtmlPipe],
    })
    pipe = TestBed.inject(SafeHtmlPipe)
    sanitizer = TestBed.inject(DomSanitizer)
  })

  it('transforms a string into SafeHtml via bypassSecurityTrustHtml', () => {
    const spy = vi.spyOn(sanitizer, 'bypassSecurityTrustHtml')
    const result = pipe.transform('<p>Hello</p>')
    expect(spy).toHaveBeenCalledWith('<p>Hello</p>')
    expect(result).toBeTruthy()
  })

  it('handles empty string', () => {
    const result = pipe.transform('')
    expect(result).toBeTruthy()
  })

  it('handles HTML with special characters', () => {
    const spy = vi.spyOn(sanitizer, 'bypassSecurityTrustHtml')
    pipe.transform('<script>alert("xss")</script>')
    expect(spy).toHaveBeenCalledWith('<script>alert("xss")</script>')
  })
})
