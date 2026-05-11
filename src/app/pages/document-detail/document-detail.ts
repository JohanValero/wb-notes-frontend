import { Component, signal, ViewChild, HostListener, OnInit, OnDestroy } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { Subscription } from 'rxjs'
import { DocumentService } from '../../services/document.service'
import { FragmentService, SyncItem } from '../../services/fragment.service'
import { Document } from '../../models/document.model'
import { Fragment } from '../../models/fragment.model'
import { TiptapEditorComponent } from '../../components/tiptap-editor/tiptap-editor'
import { DocListPanelComponent } from '../../components/doc-list-panel/doc-list-panel'

const PANEL_WIDTH_KEY = 'doc-panel-width'
const PANEL_COLLAPSED_KEY = 'doc-panel-collapsed'
const MIN_PANEL_WIDTH = 220
const MAX_PANEL_WIDTH = 500
const DEFAULT_PANEL_WIDTH = 300

export function injectUuid(content: string, uuid: string): string {
  if (!content) return ''
  return content.replace(/^<(\w+)/, `<$1 id="${uuid}"`)
}

export function extractBlocks(html: string, fragments?: Fragment[]): SyncItem[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const items: { content: string; uuid?: string }[] = []

  for (const el of doc.body.children) {
    const content = el.outerHTML
    const uuid = el.getAttribute('id') || undefined
    const cleaned = uuid ? content.replace(/\sid="[^"]*"/, '') : content
    items.push({ content: cleaned, uuid })
  }

  const uuidGroups = new Map<string, number[]>()
  for (let i = 0; i < items.length; i++) {
    const uid = items[i].uuid
    if (uid) {
      const group = uuidGroups.get(uid) || []
      group.push(i)
      uuidGroups.set(uid, group)
    }
  }

  for (const [uid, indices] of uuidGroups) {
    if (indices.length <= 1) continue
    const frag = fragments?.find((f) => f.uuid === uid)
    if (frag) {
      const matchIdx = indices.find((i) => items[i].content === frag.content)
      if (matchIdx !== undefined) {
        for (const idx of indices) {
          if (idx !== matchIdx) items[idx].uuid = undefined
        }
        continue
      }
    }
    for (let idx = 1; idx < indices.length; idx++) {
      items[indices[idx]].uuid = undefined
    }
  }

  const used = new Set<string>()
  for (const item of items) {
    if (item.uuid) used.add(item.uuid)
  }
  for (let i = 0; i < items.length; i++) {
    if (!items[i].uuid && fragments && i < fragments.length) {
      const candidate = fragments[i].uuid
      if (!used.has(candidate)) {
        items[i].uuid = candidate
        used.add(candidate)
      }
    }
  }

  return items as SyncItem[]
}

@Component({
  selector: 'app-document-detail',
  imports: [TiptapEditorComponent, DocListPanelComponent],
  templateUrl: './document-detail.html',
  styleUrl: './document-detail.scss',
})
export class DocumentDetailComponent implements OnInit, OnDestroy {
  @ViewChild(TiptapEditorComponent) editorRef?: TiptapEditorComponent

  private paramSub?: Subscription

  document = signal<Document | null>(null)
  fragments = signal<Fragment[]>([])
  editorHtml = signal('')
  loading = signal(true)
  saving = signal(false)
  saved = signal(false)

  workspaceUuid = signal('')
  docUuid = signal('')
  panelCollapsed = signal(localStorage.getItem(PANEL_COLLAPSED_KEY) === 'true')
  panelWidth = signal(Number(localStorage.getItem(PANEL_WIDTH_KEY)) || DEFAULT_PANEL_WIDTH)
  isResizing = false
  showFormatBar = signal(false)

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private documentService: DocumentService,
    private fragmentService: FragmentService,
  ) {}

  ngOnInit() {
    this.paramSub = this.route.paramMap.subscribe((params) => {
      const uuid = params.get('id')!
      this.docUuid.set(uuid)
      this.loadDocument(uuid)
    })
  }

  ngOnDestroy() {
    this.paramSub?.unsubscribe()
  }

  private loadDocument(uuid: string) {
    this.loading.set(true)

    this.documentService.get(uuid).subscribe({
      next: (doc) => {
        this.document.set(doc)
        if (doc.workspace_uuid !== this.workspaceUuid()) {
          this.workspaceUuid.set(doc.workspace_uuid)
        }
      },
    })

    this.loadFragments(uuid)
  }

  private loadFragments(docUuid: string) {
    this.fragmentService.list(docUuid).subscribe((frags) => {
      const sorted = frags.sort((a, b) => a.position - b.position)
      this.fragments.set(sorted)
      this.editorHtml.set(
        sorted.map((f) => injectUuid(f.content ?? '', f.uuid)).join(''),
      )
      this.loading.set(false)
    })
  }

  onSelectDoc(uuid: string) {
    if (uuid === this.docUuid()) return
    this.router.navigate(['/documents', uuid])
  }

  saveDocument() {
    const html = this.editorHtml() || '<p></p>'
    const items = extractBlocks(html, this.fragments())
    const docUuid = this.document()?.uuid!

    this.saving.set(true)
    this.saved.set(false)
    this.fragmentService.sync(docUuid, items).subscribe({
      next: (result) => {
        this.saved.set(true)
        this.loadFragments(docUuid)
      },
      complete: () => this.saving.set(false),
    })
  }

  onContentChange(html: string) {
    this.editorHtml.set(html)
    this.saved.set(false)
  }

  toggleFormatBar() {
    this.showFormatBar.update((v) => !v)
  }

  execFmt(fn: (chain: ReturnType<TiptapEditorComponent['editor']['chain']>) => unknown) {
    this.editorRef?.exec(fn as any)
  }

  isFmtActive(name: string, attrs?: Record<string, unknown>): boolean {
    return this.editorRef?.isActive(name, attrs) ?? false
  }

  togglePanel() {
    const next = !this.panelCollapsed()
    this.panelCollapsed.set(next)
    localStorage.setItem(PANEL_COLLAPSED_KEY, String(next))
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(e: MouseEvent) {
    if (!this.isResizing) return
    let w = e.clientX
    w = Math.max(MIN_PANEL_WIDTH, Math.min(MAX_PANEL_WIDTH, w))
    this.panelWidth.set(w)
  }

  @HostListener('document:mouseup')
  onMouseUp() {
    if (this.isResizing) {
      this.isResizing = false
      localStorage.setItem(PANEL_WIDTH_KEY, String(this.panelWidth()))
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }

  onResizeStart(e: MouseEvent) {
    e.preventDefault()
    this.isResizing = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  docStatusLabel(s: string): string {
    const labels: Record<string, string> = {
      DRAFT: 'Borrador',
      ACTIVE: 'Activo',
      ABANDONED: 'Abandonado',
      ARCHIVED: 'Archivado',
    }
    return labels[s] ?? s
  }

  changeStatus(status: string) {
    const doc = this.document()
    if (!doc) return
    this.documentService.update(doc.uuid, { doc_status: status }).subscribe((d) => this.document.set(d))
  }
}
