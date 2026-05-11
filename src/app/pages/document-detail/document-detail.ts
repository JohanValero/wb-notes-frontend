import { Component, signal, OnInit } from '@angular/core'
import { ActivatedRoute, RouterLink } from '@angular/router'
import { DocumentService } from '../../services/document.service'
import { FragmentService, SyncItem } from '../../services/fragment.service'
import { Document } from '../../models/document.model'
import { Fragment } from '../../models/fragment.model'
import { TiptapEditorComponent } from '../../components/tiptap-editor/tiptap-editor'

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
      this.editorHtml.set(sorted.map((f) => f.content ?? '').join(''))
      this.loading.set(false)
    })
  }

  private parseBlocks(html: string): string[] {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    return Array.from(doc.body.children)
      .filter((el) => el.textContent?.trim())
      .map((el) => el.outerHTML)
  }

  private buildSyncItems(blocks: string[], frags: Fragment[]): SyncItem[] {
    // Align by index: block[i] maps to fragment[i] when possible.
    // Extra blocks are inserts, extra fragments are deletes (handled by backend).
    return blocks.map((content, i) =>
      i < frags.length
        ? { content, content_hash: frags[i].content_hash, position: frags[i].position }
        : { content },
    )
  }

  saveDocument() {
    const html = this.editorHtml() || '<p></p>'
    const blocks = this.parseBlocks(html)
    const items = this.buildSyncItems(blocks, this.fragments())
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
