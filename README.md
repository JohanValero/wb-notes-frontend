# WbNotesFrontend

Frontend Angular para **GraphRAG Novelas API** — editor de novelas con grafo documental y chat con IA.

## Stack

- **Angular 21** standalone components (`bootstrapApplication`, sin NgModules)
- **SCSS** — estilos
- **Vitest** — tests unitarios (via `@angular/build:unit-test`)
- **Prettier** — printWidth 100, singleQuote, parser `angular` para HTML
- **TypeScript** strict, `module: "preserve"`, target ES2022

## Requisitos

El backend debe estar corriendo en `http://localhost:8000`. El proxy (`proxy.conf.json`) redirige `/api` → `http://localhost:8000` durante desarrollo.

## Comandos

```bash
npm start        # ng serve --host 0.0.0.0 (puerto 4200)
ng serve         # sin --host (solo localhost)
ng test          # tests Vitest
ng build         # build producción → dist/
```

## Rutas

| Path | Componente |
|------|-----------|
| `/` | Redirige a `/workspaces` |
| `/workspaces` | `WorkspaceListComponent` |
| `/workspaces/:id` | `WorkspaceDetailComponent` |
| `/documents/:id` | `DocumentDetailComponent` |
| `/relations` | `RelationViewComponent` |

## Estructura

```
src/
├── app/
│   ├── components/       # Sidebar, chat-panel, tiptap-editor, doc-list-panel
│   ├── pages/            # 4 páginas (workspace-list, workspace-detail, document-detail, relation-view)
│   ├── services/          # HTTP services (workspace, document, fragment, relation, chat)
│   ├── models/           # Interfaces TypeScript
│   ├── pipes/            # Pipes Angular
│   ├── app.ts            # Componente raíz
│   ├── app.config.ts     # ApplicationConfig providers
│   └── app.routes.ts     # Definición de rutas
├── index.html
├── main.ts               # bootstrapApplication
└── styles.scss
```
