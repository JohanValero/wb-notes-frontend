import { Component, ElementRef, ViewChild, Input, Output, EventEmitter, AfterViewInit, OnDestroy } from '@angular/core'
import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'

@Component({
  selector: 'app-tiptap-editor',
  templateUrl: './tiptap-editor.html',
  styleUrl: './tiptap-editor.scss',
})
export class TiptapEditorComponent implements AfterViewInit, OnDestroy {
  @ViewChild('editorEl') editorEl!: ElementRef
  @Input() content = ''
  @Input() placeholder = 'Escribe aquí...'
  @Output() contentChange = new EventEmitter<string>()

  editor!: Editor

  ngAfterViewInit() {
    this.editor = new Editor({
      element: this.editorEl.nativeElement,
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3] },
        }),
        Placeholder.configure({ placeholder: this.placeholder }),
      ],
      content: this.content,
      onUpdate: ({ editor }) => {
        this.contentChange.emit(editor.getHTML())
      },
    })
  }

  getHTML(): string {
    return this.editor?.getHTML() ?? ''
  }

  isActive(name: string, attrs?: Record<string, unknown>): boolean {
    return this.editor?.isActive(name, attrs) ?? false
  }

  exec(fn: (chain: ReturnType<Editor['chain']>) => ReturnType<Editor['chain']>) {
    fn(this.editor.chain().focus()).run()
  }

  ngOnDestroy() {
    this.editor?.destroy()
  }
}
