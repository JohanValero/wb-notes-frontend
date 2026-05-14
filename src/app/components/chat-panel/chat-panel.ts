import { Component, input, output, signal, ElementRef, ViewChild, AfterViewChecked } from '@angular/core'
import { marked } from 'marked'
import { ChatService, ChatMessage } from '../../services/chat.service'
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe'

@Component({
  selector: 'app-chat-panel',
  imports: [SafeHtmlPipe],
  templateUrl: './chat-panel.html',
  styleUrl: './chat-panel.scss',
})
export class ChatPanelComponent implements AfterViewChecked {
  documentUuid = input.required<string>()
  close = output<void>()

  @ViewChild('messagesEnd') messagesEnd!: ElementRef
  @ViewChild('messagesContainer', { read: ElementRef }) messagesContainer!: ElementRef

  messages = signal<ChatMessage[]>([])
  inputText = signal('')
  streaming = signal(false)
  reasoning = signal('')
  response = signal('')
  isFullscreen = signal(false)
  showReasoning = signal(false)

  private userScrolledUp = false

  constructor(private chatService: ChatService) {}

  ngAfterViewChecked(): void {
    if (!this.userScrolledUp) {
      this.messagesEnd?.nativeElement.scrollIntoView({ behavior: 'smooth' })
    }
  }

  onScroll(): void {
    const el = this.messagesContainer?.nativeElement
    if (!el) return
    const threshold = 60
    this.userScrolledUp = el.scrollHeight - el.scrollTop - el.clientHeight > threshold
  }

  get renderer(): typeof marked {
    return marked
  }

  parseMarkdown(text: string): string {
    return marked.parse(text, { async: false }) as string
  }

  toggleFullscreen(): void {
    this.isFullscreen.update((v) => !v)
  }

  toggleReasoning(): void {
    this.showReasoning.update((v) => !v)
  }

  onInput(event: Event): void {
    this.inputText.set((event.target as HTMLTextAreaElement).value)
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      this.send()
    }
  }

  send(): void {
    const text = this.inputText().trim()
    if (!text || this.streaming()) return

    this.userScrolledUp = false

    this.messages.update((msgs) => [
      ...msgs,
      { role: 'user', content: text, reasoning: '' },
    ])
    this.inputText.set('')
    this.streaming.set(true)
    this.reasoning.set('')
    this.response.set('')
    this.showReasoning.set(false)

    const lastAssistantIdx = this.messages().length

    this.runStream(text, lastAssistantIdx)
  }

  private async runStream(prompt: string, msgIdx: number): Promise<void> {
    let reasoningText = ''
    let contentText = ''

    try {
      for await (const event of this.chatService.streamChat(
        this.documentUuid(),
        prompt,
      )) {
        switch (event.type) {
          case 'reasoning':
            reasoningText += event.content
            this.reasoning.set(reasoningText)
            break
          case 'content':
            contentText += event.content
            this.response.set(contentText)
            break
          case 'error':
            contentText += event.content
            this.response.set(contentText)
            break
          case 'done':
            break
        }
      }
    } catch (e: unknown) {
      contentText += `Error interno: ${e instanceof Error ? e.message : String(e)}`
      this.response.set(contentText)
    }

    const hasError = contentText.startsWith('Error') ||
      contentText.startsWith('El LLM') ||
      contentText.startsWith('Error de conexión') ||
      contentText.startsWith('Error interno')

    this.messages.update((msgs) => {
      const updated = [...msgs]
      updated[msgIdx] = {
        role: 'assistant',
        content: contentText,
        reasoning: reasoningText,
        isError: hasError,
      }
      return updated
    })
    this.streaming.set(false)
    this.reasoning.set('')
    this.response.set('')
    this.showReasoning.set(false)
  }
}
