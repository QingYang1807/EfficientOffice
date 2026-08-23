# Key Page Dependency Trees

Each tree recursively traces all local static imports, re-exports, dynamic imports, and CommonJS requires. External packages from `node_modules` are intentionally omitted. Shared application layout dependencies are documented in `layouts.md`; each tree below starts at its page entry.

## /dashboard (Dashboard)

Entry: `frontend/src/views/Dashboard.vue`

Dependencies:
- frontend/src/stores/knowledgeBase.js
- frontend/src/stores/review.js

## /todos (Task Management)

Entry: `frontend/src/views/TodoList.vue`

Dependencies:
- frontend/src/components/TodoItems.vue
  - frontend/src/components/FancyInput.vue

## /goals (Goal Management)

Entry: `frontend/src/views/GoalManagement.vue`

Dependencies:
- frontend/src/stores/ai.js
- frontend/src/stores/tasks.js
  - frontend/src/domain/hierarchy.js
  - frontend/src/domain/progress.js
  - frontend/src/repositories/workspaceRepository.js

## /settings (Settings)

Entry: `frontend/src/views/SettingsView.vue`

Dependencies:
- frontend/src/components/MenuManager.vue

## /notes (Notes)

Entry: `frontend/src/views/NotesView.vue`

Dependencies:
- frontend/src/components/NoteList.vue
- frontend/src/stores/noteStore.js

## /knowledge (Knowledge Base)

Entry: `frontend/src/views/KnowledgeBaseView.vue`

Dependencies:
- None (the page has no local imports).

## /mindmap (Mind Map)

Entry: `frontend/src/views/MindMapView.vue`

Dependencies:
- None (the page has no local imports).

## /calendar (Calendar)

Entry: `frontend/src/views/CalendarView.vue`

Dependencies:
- frontend/src/stores/todo.js

## /ai-chat (AI Chat)

Entry: `frontend/src/views/AIChatView.vue`

Dependencies:
- None (the page has no local imports).

## /login (Login)

Entry: `frontend/src/views/LoginView.vue`

Dependencies:
- None (the page has no local imports).
