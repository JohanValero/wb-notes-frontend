import { Component, signal, OnInit } from '@angular/core'
import { ActivatedRoute, RouterLink } from '@angular/router'
import { DocumentService } from '../../services/document.service'
import { FragmentService, SyncItem } from '../../services/fragment.service'
import { Document } from '../../models/document.model'
import { Fragment } from '../../models/fragment.model'
import { TiptapEditorComponent } from '../../components/tiptap-editor/tiptap-editor'

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

  // Deduplicate UUIDs: when a uuid appears more than once (from Tiptap split),
  // find the block whose content matches the original fragment content and
  // assign the uuid to that one; strip uuid from all others.
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

  // Fallback: blocks that lost their uuid (e.g., after H2 conversion in Tiptap)
  // recover it from the fragment at the same index, if available.
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
  imports: [RouterLink, TiptapEditorComponent],
  templateUrl: './document-detail.html',
  styleUrl: './document-detail.scss',
})
export class DocumentDetailComponent implements OnInit {
  document = signal<Document | null>(null)
  fragments = signal<Fragment[]>([])
  editorHtml = signal('')
  loading = signal(true)
  saving = signal(false)
  saved = signal(false)

  constructor(
    private route: ActivatedRoute,
    private documentService: DocumentService,
    private fragmentService: FragmentService,
  ) {}

  ngOnInit() {
    const uuid = this.route.snapshot.paramMap.get('id')!
    this.documentService.get(uuid).subscribe((doc) => this.document.set(doc))
    this.loadFragments(uuid)
  }

  private loadFragments(docUuid?: string) {
    const uuid = docUuid ?? this.route.snapshot.paramMap.get('id')!
    this.fragmentService.list(uuid).subscribe((frags) => {
      const sorted = frags.sort((a, b) => a.position - b.position)
      this.fragments.set(sorted)
      this.editorHtml.set(
        sorted.map((f) => injectUuid(f.content ?? '', f.uuid)).join(''),
      )
      this.loading.set(false)
    })
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
