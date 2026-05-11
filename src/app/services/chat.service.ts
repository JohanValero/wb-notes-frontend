import { Injectable } from '@angular/core'

export interface ChatStreamEvent {
  type: 'reasoning' | 'content' | 'done' | 'error'
  content: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  reasoning: string
  isError?: boolean
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  async *streamChat(
    documentUuid: string,
    prompt: string,
  ): AsyncGenerator<ChatStreamEvent> {
    const res = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document_uuid: documentUuid, prompt }),
    })

    if (!res.ok) {
      let detail = `Error HTTP ${res.status}`
      try {
        const errBody = await res.json()
        if (errBody.detail) {
          const msgs = Array.isArray(errBody.detail)
            ? errBody.detail.map((d: { msg: string; loc?: string[] }) => `${d.msg}${d.loc ? ` (${d.loc.join('.')})` : ''}`).join('; ')
            : String(errBody.detail)
          detail += `: ${msgs}`
        }
      } catch {
        detail += `: ${res.statusText}`
      }
      yield { type: 'error', content: detail }
      return
    }

    const reader = res.body?.getReader()
    if (!reader) {
      yield { type: 'error', content: 'No se pudo leer la respuesta' }
      return
    }

    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data: ')) continue
          const raw = trimmed.slice(6)
          try {
            const event: ChatStreamEvent = JSON.parse(raw)
            yield event
          } catch {
            continue
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }
}
