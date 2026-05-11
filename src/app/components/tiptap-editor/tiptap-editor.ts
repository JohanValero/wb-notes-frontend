import { Component, ElementRef, ViewChild, Input, Output, EventEmitter, AfterViewInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core'
import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Paragraph from '@tiptap/extension-paragraph'
import Heading from '@tiptap/extension-heading'
import Blockquote from '@tiptap/extension-blockquote'
import CodeBlock from '@tiptap/extension-code-block'
import BulletList from '@tiptap/extension-bullet-list'
import OrderedList from '@tiptap/extension-ordered-list'
import ListItem from '@tiptap/extension-list-item'

/** Wraps a node extension with `id` attribute support. */
function withId<T>(ext: T): T {
  return (ext as any).extend({
    addAttributes() {
      return {
        ...(this as any).parent?.(),
        id: {
          parseHTML: (element: Element) => element.getAttribute('id'),
          renderHTML: (attributes: Record<string, unknown>) => {
            if (!attributes['id']) return {}
            return { id: attributes['id'] }
          },
        },
      }
    },
  })
}

const CustomParagraph = withId(Paragraph)
const CustomHeading = withId(Heading)
const CustomBlockquote = withId(Blockquote)
const CustomCodeBlock = withId(CodeBlock)
const CustomBulletList = withId(BulletList)
const CustomOrderedList = withId(OrderedList)
const CustomListItem = withId(ListItem)

@Component({
  selector: 'app-tiptap-editor',
  templateUrl: './tiptap-editor.html',
  styleUrl: './tiptap-editor.scss',
})
export class TiptapEditorComponent implements AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('editorEl') editorEl!: ElementRef
  @Input() content = ''
  @Input() placeholder = 'Escribe aquí...'
  @Output() contentChange = new EventEmitter<string>()

  editor!: Editor

  ngOnChanges(changes: SimpleChanges) {
    if (changes['content'] && this.editor) {
      const newContent = changes['content'].currentValue
      if (newContent !== this.editor.getHTML()) {
        this.editor.commands.setContent(newContent)
      }
    }
  }

  ngAfterViewInit() {
    this.editor = new Editor({
      element: this.editorEl.nativeElement,
      extensions: [
        StarterKit.configure({
          heading: false,
          paragraph: false,
          blockquote: false,
          codeBlock: false,
          bulletList: false,
          orderedList: false,
          listItem: false,
        }),
        Placeholder.configure({ placeholder: this.placeholder }),
        CustomParagraph,
        CustomHeading.configure({ levels: [1, 2, 3] }),
        CustomBlockquote,
        CustomCodeBlock,
        CustomBulletList,
        CustomOrderedList,
        CustomListItem,
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
