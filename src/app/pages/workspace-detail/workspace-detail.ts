import { Component, signal, OnInit } from '@angular/core'
import { ActivatedRoute, RouterLink } from '@angular/router'
import { FormsModule } from '@angular/forms'
import { WorkspaceService } from '../../services/workspace.service'
import { DocumentService } from '../../services/document.service'
import { Workspace } from '../../models/workspace.model'
import { Document, DocType } from '../../models/document.model'

@Component({
  selector: 'app-workspace-detail',
  imports: [RouterLink, FormsModule],
  templateUrl: './workspace-detail.html',
  styleUrl: './workspace-detail.scss',
})
export class WorkspaceDetailComponent implements OnInit {
  workspace = signal<Workspace | null>(null)
  documents = signal<Document[]>([])
  docTypes = signal<DocType[]>([])
  loading = signal(true)
  selectedType = signal<string | null>(null)

  showForm = signal(false)
  formDocType = ''
  formTitle = ''

  constructor(
    private route: ActivatedRoute,
    private workspaceService: WorkspaceService,
    private documentService: DocumentService,
  ) {}

  ngOnInit() {
    const uuid = this.route.snapshot.paramMap.get('id')!
    this.workspaceService.get(uuid).subscribe((w) => this.workspace.set(w))
    this.documentService.listTypes().subscribe((types) => this.docTypes.set(types))
    this.loadDocs(uuid)
  }

  private loadDocs(uuid?: string) {
    const wsUuid = uuid ?? this.route.snapshot.paramMap.get('id')!
    this.documentService.list(wsUuid).subscribe((docs) => this.documents.set(docs))
    this.loading.set(false)
  }

  filterByType(tag: string | null) {
    this.selectedType.set(tag)
    const wsUuid = this.workspace()?.uuid!
    if (tag) {
      this.documentService.list(wsUuid, tag).subscribe((docs) => this.documents.set(docs))
    } else {
      this.documentService.list(wsUuid).subscribe((docs) => this.documents.set(docs))
    }
  }

  filteredDocs() {
    const tag = this.selectedType()
    if (!tag) return this.documents()
    return this.documents().filter((d) => d.doc_type === tag)
  }

  startCreate() {
    this.formDocType = ''
    this.formTitle = ''
    this.showForm.set(true)
  }

  cancelForm() { this.showForm.set(false) }

  createDoc() {
    if (!this.formDocType) return
    const wsUuid = this.workspace()?.uuid!
    this.documentService.create(wsUuid, {
      doc_type: this.formDocType,
      title: this.formTitle || 'Sin título',
    }).subscribe({
      next: () => { this.cancelForm(); this.loadDocs(); },
    })
  }

  deleteDoc(uuid: string) {
    if (!confirm('¿Eliminar este documento?')) return
    this.documentService.delete(uuid).subscribe(() => this.loadDocs())
  }

  docStatusLabel(s: string): string {
    const labels: Record<string, string> = { DRAFT: 'Borrador', ACTIVE: 'Activo', ABANDONED: 'Abandonado', ARCHIVED: 'Archivado' }
    return labels[s] ?? s
  }

  docTypeLabel(tag: string): string {
    return this.docTypes().find((t) => t.tag === tag)?.label ?? tag
  }
}
