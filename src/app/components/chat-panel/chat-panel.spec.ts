import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ChatPanelComponent } from './chat-panel'
import { ChatService } from '../../services/chat.service'

describe('ChatPanelComponent', () => {
  let mockChatService: { streamChat: ReturnType<typeof vi.fn> }

  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn() as any
  })

  function createComponent() {
    mockChatService = { streamChat: vi.fn() }

    TestBed.configureTestingModule({
      imports: [ChatPanelComponent],
      providers: [{ provide: ChatService, useValue: mockChatService }],
      schemas: [NO_ERRORS_SCHEMA],
    })
    const fixture = TestBed.createComponent(ChatPanelComponent)
    fixture.componentRef.setInput('documentUuid', 'doc-1')
    return fixture
  }

  it('creates the component', () => {
    const fixture = createComponent()
    expect(fixture.componentInstance).toBeTruthy()
  })

  it('send adds user message and starts streaming', () => {
    const fixture = createComponent()
    mockChatService.streamChat.mockImplementation(async function* () {})
    const comp = fixture.componentInstance
    comp.inputText.set('Hello')

    comp.send()

    expect(comp.messages()).toHaveLength(1)
    expect(comp.messages()[0].role).toBe('user')
    expect(comp.messages()[0].content).toBe('Hello')
    expect(comp.inputText()).toBe('')
    expect(comp.streaming()).toBe(true)
  })

  it('does not send if input is empty', () => {
    const fixture = createComponent()
    mockChatService.streamChat.mockImplementation(async function* () {})
    const comp = fixture.componentInstance
    comp.send()
    expect(comp.messages()).toHaveLength(0)
  })

  it('does not send if already streaming', () => {
    const fixture = createComponent()
    mockChatService.streamChat.mockImplementation(async function* () {})
    const comp = fixture.componentInstance
    comp.inputText.set('Hello')
    comp.streaming.set(true)

    comp.send()

    expect(comp.messages()).toHaveLength(0)
  })

  it('onInput sets inputText signal', () => {
    const fixture = createComponent()
    const comp = fixture.componentInstance
    const event = { target: { value: 'New message' } } as unknown as Event

    comp.onInput(event)

    expect(comp.inputText()).toBe('New message')
  })

  it('onKeydown sends on Enter without Shift', () => {
    const fixture = createComponent()
    mockChatService.streamChat.mockImplementation(async function* () {})
    const comp = fixture.componentInstance
    comp.inputText.set('Hello')

    comp.onKeydown(new KeyboardEvent('keydown', { key: 'Enter', shiftKey: false }))

    expect(comp.messages()).toHaveLength(1)
  })

  it('onKeydown does not send on Shift+Enter', () => {
    const fixture = createComponent()
    const comp = fixture.componentInstance
    comp.inputText.set('Hello')

    comp.onKeydown(new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true }))

    expect(comp.messages()).toHaveLength(0)
  })

  it('parseMarkdown converts markdown to HTML', () => {
    const fixture = createComponent()
    const comp = fixture.componentInstance

    const html = comp.parseMarkdown('**bold** *italic*')
    expect(html).toContain('<strong>bold</strong>')
    expect(html).toContain('<em>italic</em>')
  })

  it('toggleFullscreen toggles isFullscreen', () => {
    const fixture = createComponent()
    const comp = fixture.componentInstance

    comp.toggleFullscreen()
    expect(comp.isFullscreen()).toBe(true)

    comp.toggleFullscreen()
    expect(comp.isFullscreen()).toBe(false)
  })

  it('toggleReasoning toggles showReasoning', () => {
    const fixture = createComponent()
    const comp = fixture.componentInstance

    comp.toggleReasoning()
    expect(comp.showReasoning()).toBe(true)

    comp.toggleReasoning()
    expect(comp.showReasoning()).toBe(false)
  })

  it('completes streaming and adds assistant message via async generator', async () => {
    const fixture = createComponent()
    mockChatService.streamChat.mockImplementation(async function* () {
      yield { type: 'content', content: 'Hi there' }
      yield { type: 'done', content: '' }
    })
    const comp = fixture.componentInstance
    comp.inputText.set('Hello')

    comp.send()
    expect(comp.messages()).toHaveLength(1)
    expect(comp.streaming()).toBe(true)

    await new Promise((r) => setTimeout(r, 10))

    expect(comp.messages()).toHaveLength(2)
    expect(comp.messages()[1].role).toBe('assistant')
    expect(comp.messages()[1].content).toBe('Hi there')
    expect(comp.streaming()).toBe(false)
  })

  it('marks assistant message as error when response starts with error prefix', async () => {
    const fixture = createComponent()
    mockChatService.streamChat.mockImplementation(async function* () {
      yield { type: 'content', content: 'Error interno: algo falló' }
      yield { type: 'done', content: '' }
    })
    const comp = fixture.componentInstance
    comp.inputText.set('Hello')

    comp.send()
    await new Promise((r) => setTimeout(r, 10))

    expect(comp.messages()[1].isError).toBe(true)
  })
})
