import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ChatService } from './chat.service'

describe('ChatService', () => {
  let service: ChatService

  beforeEach(() => {
    service = new ChatService()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('streams reasoning, content and done events', async () => {
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"type":"reasoning","content":"thinking"}\n'))
        controller.enqueue(encoder.encode('data: {"type":"content","content":"Hello world"}\n'))
        controller.enqueue(encoder.encode('data: {"type":"done","content":""}\n'))
        controller.close()
      },
    })
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(stream))

    const events: any[] = []
    for await (const event of service.streamChat('doc-1', 'hi')) {
      events.push(event)
    }

    expect(events).toHaveLength(3)
    expect(events[0]).toEqual({ type: 'reasoning', content: 'thinking' })
    expect(events[1]).toEqual({ type: 'content', content: 'Hello world' })
    expect(events[2]).toEqual({ type: 'done', content: '' })
  })

  it('sends correct request body and headers', async () => {
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"type":"done","content":""}\n'))
        controller.close()
      },
    })
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(stream))

    for await (const _ of service.streamChat('doc-1', 'my prompt')) {
      // consume
    }

    expect(fetchSpy).toHaveBeenCalledWith('/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document_uuid: 'doc-1', prompt: 'my prompt' }),
    })
  })

  it('yields error event on HTTP error with JSON detail', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ detail: 'Not found' }), {
        status: 404,
        statusText: 'Not Found',
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    const events: any[] = []
    for await (const event of service.streamChat('doc-1', 'hi')) {
      events.push(event)
    }

    expect(events).toHaveLength(1)
    expect(events[0].type).toBe('error')
    expect(events[0].content).toContain('404')
    expect(events[0].content).toContain('Not found')
  })

  it('yields error event on HTTP error with array detail', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ detail: [{ msg: 'Field required', loc: ['body', 'prompt'] }] }), {
        status: 422,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    const events: any[] = []
    for await (const event of service.streamChat('doc-1', '')) {
      events.push(event)
    }

    expect(events).toHaveLength(1)
    expect(events[0].type).toBe('error')
    expect(events[0].content).toContain('422')
    expect(events[0].content).toContain('Field required')
    expect(events[0].content).toContain('body.prompt')
  })

  it('yields error event when no response body', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null))

    const events: any[] = []
    for await (const event of service.streamChat('doc-1', 'hi')) {
      events.push(event)
    }

    expect(events).toHaveLength(1)
    expect(events[0].type).toBe('error')
    expect(events[0].content).toBe('No se pudo leer la respuesta')
  })

  it('throws on network error', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network Failure'))

    await expect(async () => {
      for await (const _ of service.streamChat('doc-1', 'hi')) {
        // not reached
      }
    }).rejects.toThrow('Network Failure')
  })

  it('skips lines that are not SSE data events', async () => {
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('event: ping\n'))
        controller.enqueue(encoder.encode('data: {"type":"content","content":"valid"}\n'))
        controller.enqueue(encoder.encode(':comment\n'))
        controller.enqueue(encoder.encode('data: {"type":"done","content":""}\n'))
        controller.close()
      },
    })
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(stream))

    const events: any[] = []
    for await (const event of service.streamChat('doc-1', 'hi')) {
      events.push(event)
    }

    expect(events).toHaveLength(2)
    expect(events[0]).toEqual({ type: 'content', content: 'valid' })
    expect(events[1]).toEqual({ type: 'done', content: '' })
  })

  it('skips malformed JSON data events', async () => {
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('data: not-json\n'))
        controller.enqueue(encoder.encode('data: {"type":"content","content":"ok"}\n'))
        controller.enqueue(encoder.encode('data: {"type":"done","content":""}\n'))
        controller.close()
      },
    })
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(stream))

    const events: any[] = []
    for await (const event of service.streamChat('doc-1', 'hi')) {
      events.push(event)
    }

    expect(events).toHaveLength(2)
    expect(events[0]).toEqual({ type: 'content', content: 'ok' })
  })

  it('releases reader lock in finally block', async () => {
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"type":"done","content":""}\n'))
        controller.close()
      },
    })
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(stream))

    for await (const _ of service.streamChat('doc-1', 'hi')) {
      // consume
    }

    const reader = (await (await fetch('/')).body?.getReader())!
    await expect(reader.closed).resolves.toBeUndefined()
  })
})
