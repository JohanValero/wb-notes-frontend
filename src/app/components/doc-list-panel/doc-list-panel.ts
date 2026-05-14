import { Component, Input, Output, EventEmitter, signal, OnInit, OnChanges, SimpleChanges } from '@angular/core'
import { RouterLink } from '@angular/router'
import { FormsModule } from '@angular/forms'
import { DocumentService } from '../../services/document.service'
import { Document, DocType } from '../../models/document.model'

@Component({
  selector: 'app-doc-list-panel',
  imports: [RouterLink, FormsModule],
  templateUrl: './doc-list-panel.html',
  styleUrl: './doc-list-panel.scss',
})
export class DocListPanelComponent implements OnInit, OnChanges {
  @Input() workspaceUuid: string = ''
  @Input() selectedDocUuid: string | null = null
  @Output() selectDoc = new EventEmitter<string>()
  @Output() close = new EventEmitter<void>()

  documents = signal<Document[]>([])
  docTypes = signal<DocType[]>([])
  allDocuments = signal<Document[]>([])
  activeFilter = signal<string | null>(null)
  loading = signal(false)

  showCreate = signal(false)
  formDocType = ''
  formTitle = ''

  constructor(private documentService: DocumentService) {}

  ngOnInit() {
    this.documentService.listTypes().subscribe((types) => this.docTypes.set(types))
    this.loadDocs()
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['workspaceUuid'] && !changes['workspaceUuid'].firstChange) {
      this.loadDocs()
    }
  }

  private loadDocs() {
    if (!this.workspaceUuid) return
    this.loading.set(true)
    this.documentService.list(this.workspaceUuid).subscribe({
      next: (docs) => {
        this.allDocuments.set(docs)
        this.applyFilter()
      },
      complete: () => this.loading.set(false),
    })
  }

  setFilter(tag: string | null) {
    this.activeFilter.set(tag)
    this.applyFilter()
  }

  private applyFilter() {
    const tag = this.activeFilter()
    if (tag) {
      this.documents.set(this.allDocuments().filter((d) => d.doc_type === tag))
    } else {
      this.documents.set(this.allDocuments())
    }
  }

  onSelect(uuid: string) {
    this.selectDoc.emit(uuid)
  }

  startCreate() {
    this.formDocType = ''
    this.formTitle = ''
    this.showCreate.set(true)
  }

  cancelCreate() {
    this.showCreate.set(false)
  }

  createDoc() {
    if (!this.formDocType || !this.workspaceUuid) return
    this.documentService.create(this.workspaceUuid, {
      doc_type: this.formDocType,
      title: this.formTitle || 'Sin título',
    }).subscribe({
      next: (doc) => {
        this.cancelCreate()
        this.loadDocs()
        this.selectDoc.emit(doc.uuid)
      },
    })
  }
}
