# Goal and Task Hierarchy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将现有扁平目标和待办升级为可迁移、可汇总、可双向导航的多层目标树与任务树，并用目标工作台和任务树表替换当前割裂界面。

**Architecture:** 目标、任务保持两个领域模型，以 `parentGoalId`、`parentTaskId` 构建单父级树，以 `goalId` 连接两棵树。纯函数负责层级校验和进度计算，Pinia Store 负责命令与查询，版本化 repository 统一读写 localStorage；页面不直接访问存储。

**Tech Stack:** Vue 3、Pinia 2、Vue Router 4、Element Plus、Ant Design Vue、Vitest、Vue Test Utils、Playwright、localStorage

**Spec:** `docs/superpowers/specs/2026-08-23-goal-task-hierarchy-design.md`

## Global Constraints

- 开发分支：`feature/goal-task-hierarchy`。
- 提交格式：`type(scope): 中文说明`。
- 目标树、任务树均为单父级，最大20层，禁止循环引用。
- 目标任务必须有 `goalId`；普通任务允许 `goalId=null`。
- 子任务必须与父任务拥有相同 `goalId`。
- `progress`、`status` 是派生字段，不持久化。
- 父级只汇总直属节点，避免后代重复计数。
- 首期只使用 localStorage，不引入后端、权限、多父级或共享任务。
- 每项先写失败测试，再写最小实现，再跑回归。

---

## File Map

**Create**

- `frontend/src/domain/hierarchy.js`：建树、遍历、移动校验。
- `frontend/src/domain/progress.js`：进度、状态派生。
- `frontend/src/repositories/workspaceRepository.js`：V2持久化、迁移、备份、诊断。
- `frontend/src/stores/goals.js`：唯一目标 Store。
- `frontend/src/services/workspaceCommands.js`：跨目标/任务命令。
- `frontend/src/components/goals/{GoalTree,GoalWorkspace,GoalTaskTree,GoalEditorDialog}.vue`。
- `frontend/src/components/tasks/{TaskTreeTable,GoalBreadcrumb,TaskEditorDialog}.vue`。
- `frontend/tests/{unit,components,e2e}/...`：领域、Store、组件和闭环测试。

**Modify**

- `frontend/package.json`、`frontend/package-lock.json`。
- `frontend/src/stores/tasks.js`。
- `frontend/src/views/{GoalManagement,TodoList,Dashboard}.vue`。
- `frontend/src/components/TodoItems.vue`。
- `frontend/src/router/index.js`、`frontend/src/store/modules/ai.js`。

**Retire after migration**

- `frontend/src/views/GoalManager.vue`。
- `frontend/src/components/goals/{GoalList,GoalCreator,GoalDetail}.vue`。
- `frontend/src/store/modules/tasks.js`。

---

### Task 1: Establish the Test Harness

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/package-lock.json`
- Create: `frontend/vitest.config.js`
- Create: `frontend/tests/setup.js`
- Test: `frontend/tests/unit/smoke.spec.js`

**Interfaces:**
- Consumes: Vue 3 application and `@` source alias.
- Produces: `npm run test:run`, `npm run test:watch`; isolated jsdom storage.

- [ ] **Step 1: Install dependencies and scripts**

Run: `cd frontend && npm install --save-dev vitest@^3.2.4 @vitejs/plugin-vue@^5.2.4 @vue/test-utils@^2.4.6 jsdom@^26.1.0`.

Add scripts:

```json
"test:run": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 2: Configure Vitest**

Create `frontend/vitest.config.js`:

```js
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: { environment: 'jsdom', setupFiles: ['./tests/setup.js'], clearMocks: true }
})
```

Create `frontend/tests/setup.js`:

```js
import { beforeEach } from 'vitest'
beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})
```

- [ ] **Step 3: Write and run smoke test**

```js
import { expect, it } from 'vitest'
it('provides browser storage', () => {
  localStorage.setItem('probe', 'ok')
  expect(localStorage.getItem('probe')).toBe('ok')
})
```

Run: `cd frontend && npm run test:run -- tests/unit/smoke.spec.js`.

Expected: `1 passed`.

- [ ] **Step 4: Verify and commit**

Run: `cd frontend && npm run test:run && npm run lint && git diff --check`.

Commit:

```bash
git add frontend/package.json frontend/package-lock.json frontend/vitest.config.js frontend/tests
git commit -m "test(goals): 建立层级管理测试环境"
```

---

### Task 2: Implement the Shared Hierarchy Engine

**Files:**
- Create: `frontend/src/domain/hierarchy.js`
- Test: `frontend/tests/unit/domain/hierarchy.spec.js`

**Interfaces:**
- Consumes: records with `id` and configurable parent field.
- Produces: `buildTree`, `getAncestorIds`, `getDescendantIds`, `getDepth`, `validateMove`.

- [ ] **Step 1: Write failing tests**

```js
import { expect, it } from 'vitest'
import { buildTree, getAncestorIds, getDescendantIds, getDepth, validateMove } from '@/domain/hierarchy'

const goals = [
  { id: 'g1', parentGoalId: null },
  { id: 'g2', parentGoalId: 'g1' },
  { id: 'g3', parentGoalId: 'g2' }
]

it('builds and traverses a tree', () => {
  expect(buildTree(goals, 'parentGoalId')[0].children[0].children[0].id).toBe('g3')
  expect(getAncestorIds(goals, 'g3', 'parentGoalId')).toEqual(['g1', 'g2'])
  expect(getDescendantIds(goals, 'g1', 'parentGoalId')).toEqual(['g2', 'g3'])
  expect(getDepth(goals, 'g3', 'parentGoalId')).toBe(3)
})

it('rejects a cycle', () => {
  expect(validateMove({ items: goals, id: 'g1', newParentId: 'g3', parentKey: 'parentGoalId', maxDepth: 20 })).toEqual({ ok: false, reason: '不能移动到自身后代节点' })
})
```

- [ ] **Step 2: Verify red**

Run: `cd frontend && npm run test:run -- tests/unit/domain/hierarchy.spec.js`.

Expected: FAIL because the module is missing.

- [ ] **Step 3: Implement minimal hierarchy functions**

```js
export const MAX_HIERARCHY_DEPTH = 20

export function buildTree(items, parentKey) {
  const nodes = new Map(items.map(item => [String(item.id), { ...item, children: [] }]))
  const roots = []
  for (const item of items) {
    const node = nodes.get(String(item.id))
    const parent = item[parentKey] == null ? null : nodes.get(String(item[parentKey]))
    if (parent) parent.children.push(node)
    else roots.push(node)
  }
  return roots
}

export function getAncestorIds(items, id, parentKey) {
  const byId = new Map(items.map(item => [String(item.id), item]))
  const result = []
  const seen = new Set([String(id)])
  let node = byId.get(String(id))
  while (node?.[parentKey] != null) {
    const parentId = String(node[parentKey])
    if (seen.has(parentId)) throw new Error('检测到循环层级')
    seen.add(parentId)
    result.unshift(parentId)
    node = byId.get(parentId)
    if (!node) break
  }
  return result
}
```

Append to `hierarchy.js`:

```js
export function getDescendantIds(items, id, parentKey) {
  const children = new Map()
  for (const item of items) {
    const key = item[parentKey] == null ? null : String(item[parentKey])
    children.set(key, [...(children.get(key) || []), String(item.id)])
  }
  const result = []
  const queue = [...(children.get(String(id)) || [])]
  const seen = new Set([String(id)])
  while (queue.length) {
    const childId = queue.shift()
    if (seen.has(childId)) throw new Error('检测到循环层级')
    seen.add(childId)
    result.push(childId)
    queue.push(...(children.get(childId) || []))
  }
  return result
}

export function getDepth(items, id, parentKey) {
  return getAncestorIds(items, id, parentKey).length + 1
}

export function validateMove({ items, id, newParentId, parentKey, maxDepth = 20 }) {
  if (newParentId == null) return { ok: true }
  if (String(id) === String(newParentId)) return { ok: false, reason: '节点不能成为自己的父级' }
  if (getDescendantIds(items, id, parentKey).includes(String(newParentId))) {
    return { ok: false, reason: '不能移动到自身后代节点' }
  }
  const oldDepth = getDepth(items, id, parentKey)
  const subtreeDepth = 1 + Math.max(0, ...getDescendantIds(items, id, parentKey)
    .map(childId => getDepth(items, childId, parentKey) - oldDepth))
  const nextDepth = getDepth(items, newParentId, parentKey) + subtreeDepth
  return nextDepth <= maxDepth ? { ok: true } : { ok: false, reason: `层级不能超过${maxDepth}层` }
}
```

- [ ] **Step 4: Add boundary tests, verify and commit**

Append exact cases:

```js
it('recovers an orphan as a root', () => {
  expect(buildTree([{ id: 'orphan', parentGoalId: 'missing' }], 'parentGoalId')[0].id).toBe('orphan')
})

it('rejects self-parent and depth overflow', () => {
  expect(validateMove({ items: goals, id: 'g1', newParentId: 'g1', parentKey: 'parentGoalId' }).ok).toBe(false)
  const chain = Array.from({ length: 20 }, (_, i) => ({ id: `n${i}`, parentGoalId: i ? `n${i - 1}` : null }))
  const leaf = { id: 'leaf', parentGoalId: 'root' }
  expect(validateMove({ items: [...chain, { id: 'root', parentGoalId: null }, leaf], id: 'root', newParentId: 'n19', parentKey: 'parentGoalId' }).ok).toBe(false)
})
```

Run: `cd frontend && npm run test:run -- tests/unit/domain/hierarchy.spec.js`.

Commit:

```bash
git add frontend/src/domain/hierarchy.js frontend/tests/unit/domain/hierarchy.spec.js
git commit -m "feat(goals): 增加通用层级规则"
```

---

### Task 3: Implement Derived Progress and Status

**Files:**
- Create: `frontend/src/domain/progress.js`
- Test: `frontend/tests/unit/domain/progress.spec.js`

**Interfaces:**
- Consumes: Goal/Task arrays and explicit `now`.
- Produces: `deriveTaskView`, `deriveGoalView`, `deriveStatus`.

- [ ] **Step 1: Write failing tests**

```js
import { expect, it } from 'vitest'
import { deriveGoalView, deriveStatus, deriveTaskView } from '@/domain/progress'

const now = new Date('2026-08-23T12:00:00Z').getTime()

it('weights direct task children', () => {
  const tasks = [
    { id: 'p', parentTaskId: null, completed: false, weight: 1 },
    { id: 'a', parentTaskId: 'p', completed: true, weight: 3 },
    { id: 'b', parentTaskId: 'p', completed: false, weight: 1 },
    { id: 'b1', parentTaskId: 'b', completed: true, weight: 1 }
  ]
  expect(deriveTaskView('p', tasks, now).progress).toBe(100)
})

it('combines direct child goals and root tasks', () => {
  const goals = [
    { id: 'g1', parentGoalId: null, manualProgress: 10, weight: 1 },
    { id: 'g2', parentGoalId: 'g1', manualProgress: 100, weight: 1 }
  ]
  const tasks = [{ id: 't1', goalId: 'g1', parentTaskId: null, completed: false, weight: 1 }]
  expect(deriveGoalView('g1', goals, tasks, now).progress).toBe(50)
  expect(deriveStatus(100, '2026-08-01', now)).toBe('completed')
})
```

- [ ] **Step 2: Verify red**

Run: `cd frontend && npm run test:run -- tests/unit/domain/progress.spec.js`.

Expected: FAIL because the module is missing.

- [ ] **Step 3: Implement direct-child aggregation**

```js
function weightedAverage(entries) {
  if (!entries.length) return null
  const total = entries.reduce((sum, item) => sum + Math.max(0, Number(item.weight) || 0), 0)
  if (total === 0) return 0
  return Math.round(entries.reduce((sum, item) => sum + item.progress * Math.max(0, Number(item.weight) || 0), 0) / total)
}

export function deriveStatus(progress, deadline, now = Date.now()) {
  if (progress === 100) return 'completed'
  if (deadline && new Date(deadline).getTime() < now) return 'overdue'
  return progress > 0 ? 'in_progress' : 'not_started'
}
```

Append:

```js
export function deriveTaskView(taskId, tasks, now = Date.now(), stack = new Set()) {
  const id = String(taskId)
  if (stack.has(id)) throw new Error('检测到循环任务层级')
  const task = tasks.find(item => String(item.id) === id)
  if (!task) throw new Error('任务不存在')
  const next = new Set(stack).add(id)
  const children = tasks.filter(item => item.parentTaskId != null && String(item.parentTaskId) === id)
  const progress = children.length
    ? weightedAverage(children.map(child => ({ ...deriveTaskView(child.id, tasks, now, next), weight: child.weight })))
    : (task.completed ? 100 : 0)
  return { progress, completed: progress === 100, status: deriveStatus(progress, task.deadline, now) }
}

export function deriveGoalView(goalId, goals, tasks, now = Date.now(), stack = new Set()) {
  const id = String(goalId)
  if (stack.has(id)) throw new Error('检测到循环目标层级')
  const goal = goals.find(item => String(item.id) === id)
  if (!goal) throw new Error('目标不存在')
  const next = new Set(stack).add(id)
  const childGoals = goals.filter(item => item.parentGoalId != null && String(item.parentGoalId) === id)
  const rootTasks = tasks.filter(item => String(item.goalId) === id && item.parentTaskId == null)
  const entries = [
    ...childGoals.map(child => ({ ...deriveGoalView(child.id, goals, tasks, now, next), weight: child.weight })),
    ...rootTasks.map(task => ({ ...deriveTaskView(task.id, tasks, now), weight: task.weight }))
  ]
  const manual = Math.max(0, Math.min(100, Number(goal.manualProgress) || 0))
  const progress = weightedAverage(entries) ?? manual
  return { progress, status: deriveStatus(progress, goal.deadline, now) }
}
```

- [ ] **Step 4: Add boundaries, verify and commit**

Append:

```js
it('handles boundaries and cycles', () => {
  expect(deriveGoalView('leaf', [{ id: 'leaf', manualProgress: 33 }], [], now).progress).toBe(33)
  expect(deriveTaskView('p', [
    { id: 'p', completed: false },
    { id: 'c', parentTaskId: 'p', completed: true, weight: 0 }
  ], now).progress).toBe(0)
  expect(() => deriveTaskView('missing', [], now)).toThrow('任务不存在')
  expect(() => deriveTaskView('x', [
    { id: 'x', parentTaskId: 'y' },
    { id: 'y', parentTaskId: 'x' }
  ], now)).toThrow('检测到循环任务层级')
})
```

Run: `cd frontend && npm run test:run -- tests/unit/domain/progress.spec.js`.

Commit:

```bash
git add frontend/src/domain/progress.js frontend/tests/unit/domain/progress.spec.js
git commit -m "feat(goals): 实现层级进度汇总"
```

---

### Task 4: Add Versioned Storage and Migration

**Files:**
- Create: `frontend/src/repositories/workspaceRepository.js`
- Test: `frontend/tests/unit/repositories/workspaceRepository.spec.js`

**Interfaces:**
- Consumes: Storage object and legacy `goals`/`todos`.
- Produces: `loadWorkspace`, `saveWorkspace`, `patchWorkspace`, `migrateLegacyWorkspace`; `WORKSPACE_KEY`, `BACKUP_KEY`, `DIAGNOSTICS_KEY`.

- [ ] **Step 1: Write failing migration tests**

```js
import { DIAGNOSTICS_KEY, migrateLegacyWorkspace } from '@/repositories/workspaceRepository'

localStorage.setItem('goals', JSON.stringify([{ id: 1, title: '目标', progress: 40 }]))
localStorage.setItem('todos', JSON.stringify([
  { id: 2, text: '有效任务', goalId: 1 },
  { id: 3, text: '孤儿任务', goalId: 404 }
]))
const data = migrateLegacyWorkspace(localStorage, '2026-08-23T12:00:00.000Z')
expect(data.version).toBe(2)
expect(data.goals[0]).toMatchObject({ id: '1', parentGoalId: null, manualProgress: 40 })
expect(data.tasks.map(task => task.goalId)).toEqual(['1', null])
expect(JSON.parse(localStorage.getItem(DIAGNOSTICS_KEY)).orphanTaskIds).toEqual(['3'])
```

Assert backup contains the untouched legacy arrays.

- [ ] **Step 2: Verify red**

Run: `cd frontend && npm run test:run -- tests/unit/repositories/workspaceRepository.spec.js`.

Expected: FAIL because repository is missing.

- [ ] **Step 3: Implement normalization and safe write**

```js
export const WORKSPACE_KEY = 'efficient-office.workspace.v2'
export const BACKUP_KEY = 'efficient-office.workspace.v1.backup'
export const DIAGNOSTICS_KEY = 'efficient-office.workspace.v2.diagnostics'

const normalizeGoal = (goal, now) => ({
  id: String(goal.id),
  parentGoalId: goal.parentGoalId == null ? null : String(goal.parentGoalId),
  title: String(goal.title || '').trim(),
  description: String(goal.description || ''),
  manualProgress: Math.max(0, Math.min(100, Number(goal.manualProgress ?? goal.progress) || 0)),
  weight: Math.max(0, Number(goal.weight) || 1),
  startDate: goal.startDate || null,
  deadline: goal.deadline || null,
  createdAt: goal.createdAt || now,
  updatedAt: goal.updatedAt || now
})
```

Add task normalization and repository operations:

```js
const normalizeTask = (task, validGoalIds, now) => ({
  id: String(task.id),
  goalId: task.goalId != null && validGoalIds.has(String(task.goalId)) ? String(task.goalId) : null,
  parentTaskId: task.parentTaskId == null ? null : String(task.parentTaskId),
  title: String(task.title || task.text || '').trim(),
  description: String(task.description || ''),
  completed: Boolean(task.completed),
  weight: Math.max(0, Number(task.weight) || 1),
  priority: ['高', '中', '低'].includes(task.priority) ? task.priority : '中',
  deadline: task.deadline || task.dueDate || null,
  createdAt: task.createdAt || now,
  updatedAt: task.updatedAt || now
})

export function saveWorkspace(storage, workspace) {
  try {
    const json = JSON.stringify({ ...workspace, version: 2 })
    JSON.parse(json)
    storage.setItem(WORKSPACE_KEY, json)
  } catch (error) {
    throw new Error('工作区保存失败', { cause: error })
  }
}

export function loadWorkspace(storage) {
  const raw = storage.getItem(WORKSPACE_KEY)
  if (!raw) return migrateLegacyWorkspace(storage, new Date().toISOString())
  const data = JSON.parse(raw)
  if (data.version !== 2) throw new Error('工作区数据版本不受支持')
  return data
}

export function patchWorkspace(storage, patch) {
  const next = { ...loadWorkspace(storage), ...patch, version: 2 }
  saveWorkspace(storage, next)
  return next
}
```

`migrateLegacyWorkspace` must parse both legacy keys before writing, reject duplicate IDs, write untouched arrays to `BACKUP_KEY`, normalize records, write `{ orphanTaskIds }` to diagnostics, then call `saveWorkspace`. Never remove legacy keys during rollout.

- [ ] **Step 4: Add recovery tests, verify and commit**

Append exact assertions for malformed JSON, duplicate ID, wrong version and storage failure:

```js
expect(() => migrateLegacyWorkspace(storageWithMalformedJson, now)).toThrow('旧数据无法解析')
expect(() => migrateLegacyWorkspace(storageWithDuplicateIds, now)).toThrow('检测到重复ID')
expect(() => loadWorkspace(storageWithVersion3)).toThrow('工作区数据版本不受支持')
expect(() => saveWorkspace(failingStorage, { goals: [], tasks: [] })).toThrow('工作区保存失败')
expect(failingStorage.getItem(WORKSPACE_KEY)).toBe(null)
```

Run: `cd frontend && npm run test:run -- tests/unit/repositories/workspaceRepository.spec.js`.

Commit:

```bash
git add frontend/src/repositories/workspaceRepository.js frontend/tests/unit/repositories/workspaceRepository.spec.js
git commit -m "feat(storage): 增加工作区数据迁移"
```

---

### Task 5: Replace Duplicate State with Goal and Task Stores

**Files:**
- Create: `frontend/src/stores/goals.js`
- Replace: `frontend/src/stores/tasks.js`
- Create: `frontend/src/services/workspaceCommands.js`
- Test: `frontend/tests/unit/stores/workspaceStores.spec.js`

**Interfaces:**
- Consumes: Tasks2–4 functions.
- Produces goal actions `initialize/createGoal/updateGoal/moveGoal`; goal getter `viewFor(id,tasks,now)`; task actions `initialize/createTask/createBatchTasks/updateTask/toggleTask/moveTask`; commands `deleteGoal/deleteTask`.

- [ ] **Step 1: Write failing Store tests**

```js
import { createPinia, setActivePinia } from 'pinia'
import { useGoalStore } from '@/stores/goals'
import { useTaskStore } from '@/stores/tasks'

setActivePinia(createPinia())
const goals = useGoalStore()
const tasks = useTaskStore()
const parent = goals.createGoal({ title: '年度目标' })
const child = goals.createGoal({ title: '发布2.0', parentGoalId: parent.id })
const task = tasks.createTask({ title: '发布', goalId: child.id })
const subtask = tasks.createTask({ title: '验收', parentTaskId: task.id })
expect(goals.pathFor(child.id).map(item => item.title)).toEqual(['年度目标', '发布2.0'])
expect(subtask.goalId).toBe(child.id)
expect(() => tasks.createTask({ title: '非法', parentTaskId: task.id, goalId: parent.id })).toThrow('子任务必须与父任务属于同一目标')
```

Also assert goal-cycle rejection and descendant migration when moving a parent task to another goal.

- [ ] **Step 2: Verify red**

Run: `cd frontend && npm run test:run -- tests/unit/stores/workspaceStores.spec.js`.

Expected: FAIL because goal Store and commands are missing.

- [ ] **Step 3: Implement persisted records and derived getters**

```js
export const useGoalStore = defineStore('goals-v2', {
  state: () => ({ goals: [], initialized: false, lastError: null }),
  getters: {
    tree: state => buildTree(state.goals, 'parentGoalId'),
    byId: state => id => state.goals.find(goal => goal.id === String(id)) || null,
    pathFor: state => id => [...getAncestorIds(state.goals, id, 'parentGoalId'), String(id)]
      .map(goalId => state.goals.find(goal => goal.id === goalId)).filter(Boolean),
    viewFor: state => (id, tasks, now = Date.now()) => deriveGoalView(id, state.goals, tasks, now)
  }
})
```

`useTaskStore` exposes these exact getters and actions:

```js
tasksForGoal(goalId, includeDescendants, goals)
treeForGoal(goalId)
viewFor(id, now = Date.now())
createTask(input)
createBatchTasks(inputs)
updateTask(id, patch)
toggleTask(id, completed)
moveTask(id, { parentTaskId, goalId })
```

`createTask` generates a string ID and timestamps; when `parentTaskId` exists it loads the parent, forces the parent's `goalId`, and rejects a conflicting supplied goal. `moveTask` runs hierarchy validation and changes every descendant `goalId` with the parent. Every mutation snapshots arrays, calls `patchWorkspace`, and restores the snapshot with `lastError='工作区保存失败'` if persistence throws.

- [ ] **Step 4: Implement deletion policies**

```js
export function deleteGoal({ goalId, mode, goalStore, taskStore }) {}
export function deleteTask({ taskId, mode, taskStore }) {}
```

`mode` is `cascade` or `promote`. Promote-goal moves child goals to deleted parent and changes every task whose `goalId` equals the deleted goal to that parent goal or `null`, preserving each task tree. Cascade-goal removes all descendant goals and their task trees. Promote-task moves direct children to deleted parent; cascade-task removes descendants.

- [ ] **Step 5: Verify and commit**

Run: `cd frontend && npm run test:run -- tests/unit/stores/workspaceStores.spec.js`.

Commit:

```bash
git add frontend/src/stores/goals.js frontend/src/stores/tasks.js frontend/src/services/workspaceCommands.js frontend/tests/unit/stores/workspaceStores.spec.js
git commit -m "feat(store): 统一目标与任务状态"
```

---

### Task 6: Build the Goal Tree and Workspace

**Files:**
- Create: `frontend/src/components/goals/GoalTree.vue`
- Create: `frontend/src/components/goals/GoalWorkspace.vue`
- Create: `frontend/src/components/goals/GoalTaskTree.vue`
- Create: `frontend/src/components/goals/GoalEditorDialog.vue`
- Replace: `frontend/src/views/GoalManagement.vue`
- Modify: `frontend/src/router/index.js`
- Test: `frontend/tests/components/GoalTree.spec.js`
- Test: `frontend/tests/components/GoalWorkspace.spec.js`

**Interfaces:**
- Consumes: goal/tree/path/view and task/tree getters.
- Produces: route `/goals/:goalId?`; ID-only UI events.

- [ ] **Step 1: Write failing component tests**

```js
import { mount } from '@vue/test-utils'
import GoalTree from '@/components/goals/GoalTree.vue'

const goals = [
  { id: 'g1', parentGoalId: null, title: '年度目标' },
  { id: 'g2', parentGoalId: 'g1', title: '产品目标' }
]
const wrapper = mount(GoalTree, { props: { goals, selectedId: 'g1', search: '' } })
expect(wrapper.text()).toContain('年度目标')
await wrapper.get('[data-testid="goal-node-g2"]').trigger('click')
expect(wrapper.emitted('select')).toEqual([['g2']])
await wrapper.get('[data-testid="add-child-g2"]').trigger('click')
expect(wrapper.emitted('create-child')).toEqual([['g2']])
```

Search must retain ancestors of matches; missing-parent nodes appear under“待修复”。Workspace test asserts full breadcrumb, progress composition, child goals and “新增子目标/新增任务” events.

- [ ] **Step 2: Verify red**

Run: `cd frontend && npm run test:run -- tests/components/GoalTree.spec.js tests/components/GoalWorkspace.spec.js`.

Expected: FAIL because components are missing.

- [ ] **Step 3: Implement components**

`GoalTree` uses `el-tree`, `node-key="id"`, collapsed-by-default and accessible action buttons. Contract:

```js
defineProps({ goals: Array, selectedId: String, search: String })
defineEmits(['select', 'create-child', 'create-task', 'move', 'delete'])
```

`GoalWorkspace` renders breadcrumb, derived status/progress, description, deadline, child goals, progress composition and primary actions. `GoalTaskTree` defaults to current goal only; `includeDescendants` is explicit. `GoalEditorDialog` receives `parentGoalId` and validates title/deadline.

- [ ] **Step 4: Replace page and route**

```js
const selectedGoalId = computed(() => route.params.goalId || goalStore.tree[0]?.id || null)
const selectGoal = id => router.push({ name: 'GoalDetail', params: { goalId: id } })
```

Route:

```js
{ path: 'goals/:goalId?', name: 'GoalDetail', component: () => import('@/views/GoalManagement.vue') }
```

Desktop columns: 280px/flexible/360px. Below1024px use tree drawer plus detail/task tabs. Invalid ID renders“目标不存在或已删除”and a `/goals` recovery button.

Persist UI state outside domain records:

```js
const GOAL_UI_KEY = 'efficient-office.goal-ui.v1'
const saveGoalUi = ({ expandedIds, selectedId }) => localStorage.setItem(GOAL_UI_KEY, JSON.stringify({ expandedIds, selectedId }))
```

On load, discard IDs no longer present. URL `goalId` has priority over stored `selectedId`.

- [ ] **Step 5: Verify and commit**

Run: `cd frontend && npm run test:run -- tests/components/GoalTree.spec.js tests/components/GoalWorkspace.spec.js && npm run build`.

Commit:

```bash
git add frontend/src/components/goals frontend/src/views/GoalManagement.vue frontend/src/router/index.js frontend/tests/components
git commit -m "feat(goals): 重构目标层级工作台"
```

---

### Task 7: Add Task Hierarchy and Bidirectional Navigation

**Files:**
- Create: `frontend/src/components/tasks/TaskTreeTable.vue`
- Create: `frontend/src/components/tasks/GoalBreadcrumb.vue`
- Create: `frontend/src/components/tasks/TaskEditorDialog.vue`
- Modify: `frontend/src/components/TodoItems.vue`
- Modify: `frontend/src/views/TodoList.vue`
- Test: `frontend/tests/components/TaskTreeTable.spec.js`

**Interfaces:**
- Consumes: task tree/filter and goal path getters.
- Produces: `/todos?goalId=:goalId&includeDescendants=0|1`; task row events.

- [ ] **Step 1: Write failing task-tree tests**

```js
import { mount } from '@vue/test-utils'
import TaskTreeTable from '@/components/tasks/TaskTreeTable.vue'

const tasks = [
  { id: 't1', goalId: 'g3', parentTaskId: null, title: '发布', completed: false },
  { id: 't2', goalId: 'g3', parentTaskId: 't1', title: '验收', completed: false }
]
const goalPaths = { g3: [{ id: 'g1', title: '年度目标' }, { id: 'g2', title: '产品目标' }, { id: 'g3', title: '发布2.0' }] }
const wrapper = mount(TaskTreeTable, { props: { tasks, goalPaths } })
expect(wrapper.get('[data-testid="task-row-t1"]').text()).toContain('发布')
await wrapper.get('[data-testid="expand-task-t1"]').trigger('click')
expect(wrapper.get('[data-testid="task-row-t2"]').exists()).toBe(true)
expect(wrapper.get('[data-testid="goal-path-t2"]').text()).toBe('年度目标 / 产品目标 / 发布2.0')
await wrapper.get('[data-testid="add-child-task-t2"]').trigger('click')
expect(wrapper.emitted('create-child')).toEqual([['t2']])
```

An unassigned task must show“未归属目标”。

- [ ] **Step 2: Verify red**

Run: `cd frontend && npm run test:run -- tests/components/TaskTreeTable.spec.js`.

Expected: FAIL because task components are missing.

- [ ] **Step 3: Implement task components**

`GoalBreadcrumb` emits `navigate(goalId)` for every path segment. `TaskTreeTable` uses table tree data with completion/title/goal/priority/deadline/actions columns. `TaskEditorDialog` receives `{ goalId, parentTaskId }`; with parent task, goal is inherited and disabled. Unassigned root tasks remain valid.

Contract:

```js
defineProps({
  tasks: { type: Array, default: () => [] },
  goalPaths: { type: Object, default: () => ({}) }
})
defineEmits(['toggle', 'edit', 'create-child', 'move', 'delete', 'navigate-goal'])
```

- [ ] **Step 4: Convert TodoItems to Store orchestration**

Remove local `todos`, `loadTodosFromStorage`, `saveTodosToStorage`; replace all mutation sites with task Store actions while preserving search, priority, deadline and pomodoro features.

```js
const selectedGoalId = computed(() => route.query.goalId ? String(route.query.goalId) : null)
const includeDescendants = computed(() => route.query.includeDescendants === '1')
const visibleTasks = computed(() => taskStore.tasksForGoal(selectedGoalId.value, includeDescendants.value, goalStore.goals))
```

Goal breadcrumb navigates to `GoalDetail`; goal detail “查看任务管理” navigates to `TodoList` with `includeDescendants='0'`.

- [ ] **Step 5: Verify and commit**

Run: `cd frontend && npm run test:run -- tests/components/TaskTreeTable.spec.js && npm run build`.

Commit:

```bash
git add frontend/src/components/tasks frontend/src/components/TodoItems.vue frontend/src/views/TodoList.vue frontend/tests/components/TaskTreeTable.spec.js
git commit -m "feat(tasks): 增加多层任务与目标导航"
```

---

### Task 8: Integrate AI and Retire Duplicate Implementations

**Files:**
- Create: `frontend/src/services/aiTaskAdapter.js`
- Modify: `frontend/src/store/modules/ai.js`
- Modify: `frontend/src/views/Dashboard.vue`
- Delete: duplicate goal components/view and `frontend/src/store/modules/tasks.js`
- Test: `frontend/tests/unit/integrations/goalTaskIntegration.spec.js`

**Interfaces:**
- Consumes: `taskStore.createBatchTasks`, `goalStore.viewFor`.
- Produces: all AI-created tasks use new model; dashboard uses derived views.

- [ ] **Step 1: Write failing integration test**

```js
import { vi } from 'vitest'
import { createTasksFromAi } from '@/services/aiTaskAdapter'

const suggestions = [{ name: '发布检查', steps: ['构建', '验收'], priority: '高' }]
const taskStore = { createBatchTasks: vi.fn(inputs => inputs) }
const created = createTasksFromAi({ suggestions, goalId: 'g1', taskStore })
expect(created.every(task => task.goalId === 'g1')).toBe(true)
expect(created.every(task => task.parentTaskId === null)).toBe(true)
```

Explicit `parentTaskId` must create children inheriting the parent goal.

- [ ] **Step 2: Verify red and implement adapter**

Run: `cd frontend && npm run test:run -- tests/unit/integrations/goalTaskIntegration.spec.js`.

Expected: FAIL before adapter exists.

Replace direct `localStorage.setItem('todos',...)` with:

```js
export function createTasksFromAi({ suggestions, goalId, parentTaskId = null, taskStore }) {
  return taskStore.createBatchTasks(suggestions.map(item => ({
    title: item.name,
    description: item.steps.join('\n'),
    priority: item.priority,
    deadline: item.deadline || null,
    goalId,
    parentTaskId,
    weight: 1
  })))
}
```

- [ ] **Step 3: Switch dashboard and retire duplicates**

```js
const goalSummaries = computed(() => goalStore.goals.map(goal => ({
  ...goal,
  ...goalStore.viewFor(goal.id, taskStore.tasks)
})))
```

Run `cd frontend && rg "GoalManager|GoalList|GoalCreator|components/goals/GoalDetail|store/modules/tasks" src`; remove stale imports and the retired files. Rerun; expected output empty.

- [ ] **Step 4: Verify and commit**

Run: `cd frontend && npm run test:run && npm run lint && npm run build`.

Commit:

```bash
git add frontend/src frontend/tests/unit/integrations/goalTaskIntegration.spec.js
git commit -m "refactor(workspace): 收敛目标任务数据入口"
```

---

### Task 9: Adapt Auxiliary Views and Recovery UX

**Files:**
- Modify: `frontend/src/components/goals/GoalMindMap.vue`
- Modify: `frontend/src/components/goals/GoalKanban.vue`
- Modify: `frontend/src/views/GoalManagement.vue`
- Modify: `frontend/src/components/TodoItems.vue`
- Modify: `frontend/src/repositories/workspaceRepository.js`
- Modify: `frontend/src/main.js`
- Test: `frontend/tests/components/GoalAuxiliaryViews.spec.js`
- Test: `frontend/tests/unit/repositories/workspaceConflicts.spec.js`

**Interfaces:**
- Consumes: goal tree/view getters and repository `updatedAt`.
- Produces: hierarchical mind-map/kanban data, keyboard navigation, storage conflict event, recoverable save errors.

- [ ] **Step 1: Write failing auxiliary-view tests**

```js
import { mount } from '@vue/test-utils'
import GoalMindMap from '@/components/goals/GoalMindMap.vue'
import GoalKanban from '@/components/goals/GoalKanban.vue'

const goalTree = [{ id: 'g1', title: '年度目标', progress: 50, children: [{ id: 'g2', title: '产品目标', progress: 50, children: [{ id: 'g3', title: '发布2.0', progress: 50, children: [] }] }] }]
const goalSummaries = [{ id: 'g3', title: '发布2.0', status: 'in_progress', parentPath: '年度目标 / 产品目标' }]

it('renders nested goals without treating tasks as goals', () => {
  const wrapper = mount(GoalMindMap, { props: { goals: goalTree, goalTree } })
  expect(wrapper.vm.toMindMap(goalTree)[0].children[0].children[0].id).toBe('g3')
})

it('keeps hierarchy context on kanban cards', () => {
  const wrapper = mount(GoalKanban, { props: { goals: goalSummaries } })
  expect(wrapper.get('[data-testid="goal-card-g3"]').text()).toContain('年度目标 / 产品目标')
})
```

Run: `cd frontend && npm run test:run -- tests/components/GoalAuxiliaryViews.spec.js`.

Expected: FAIL because auxiliary views still assume flat goals.

- [ ] **Step 2: Adapt mind-map and kanban**

Mind-map recursively maps goal children only:

```js
export const toMindMap = nodes => nodes.map(goal => ({
  id: goal.id,
  text: goal.title,
  progress: goal.progress,
  children: toMindMap(goal.children || [])
}))

defineExpose({ toMindMap })
```

Kanban keeps derived-status columns and displays `goalStore.pathFor(id).slice(0, -1)` as parent context. Cards are read-only navigation items because status is derived; disable drag-and-drop rather than persisting a false status override.

Expose “工作台 / 看板 / 思维导图” in `GoalManagement.vue`; default remains“工作台”。All three views receive the same Store-derived summaries and route selection events.

- [ ] **Step 3: Write conflict and capacity tests**

```js
it('rejects an older revision', () => {
  expect(() => saveWorkspace(storage, olderWorkspace, { expectedUpdatedAt: olderWorkspace.updatedAt }))
    .toThrow('数据已在其他页面更新，请刷新后重试')
})

it('maps quota failure to a recoverable message', () => {
  storage.setItem = () => { throw new DOMException('quota', 'QuotaExceededError') }
  expect(() => saveWorkspace(storage, workspace)).toThrow('本地存储空间不足，请先导出或清理数据')
})
```

- [ ] **Step 4: Implement revision and storage-event handling**

Persist root `updatedAt`; `saveWorkspace(storage,workspace,{expectedUpdatedAt})` compares the current revision before write. Add one `storage` listener during app initialization:

```js
window.addEventListener('storage', event => {
  if (event.key === WORKSPACE_KEY) window.dispatchEvent(new CustomEvent('workspace:stale'))
})
```

Goal/task pages show a non-dismissible stale-data banner with a “刷新数据” button. Quota errors keep the pre-command Store snapshot and offer “导出数据”。Implement export without mutating storage:

```js
export function exportWorkspace(workspace) {
  const blob = new Blob([JSON.stringify(workspace, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = Object.assign(document.createElement('a'), { href: url, download: 'efficient-office-workspace-v2.json' })
  link.click()
  URL.revokeObjectURL(url)
}
```

- [ ] **Step 5: Add keyboard and empty/error state coverage**

Append component assertions:

```js
await tree.trigger('keydown', { key: 'ArrowDown' })
expect(wrapper.emitted('select').at(-1)).toEqual(['g2'])
await tree.trigger('keydown', { key: 'ArrowRight' })
expect(wrapper.get('[data-testid="goal-node-g2"]').attributes('aria-expanded')).toBe('true')
await tree.trigger('keydown', { key: 'ArrowLeft' })
expect(wrapper.get('[data-testid="goal-node-g2"]').attributes('aria-expanded')).toBe('false')
await tree.trigger('keydown', { key: 'Enter' })
expect(wrapper.emitted('select').length).toBeGreaterThan(0)
expect(wrapper.findAll('button').every(button => button.text() || button.attributes('aria-label'))).toBe(true)
expect(emptyWorkspace.text()).toContain('创建第一个目标')
expect(emptyGoalTasks.text()).toContain('创建第一个任务')
expect(missingGoal.text()).toContain('目标不存在或已删除')
expect(orphanTask.text()).toContain('未归属目标')
```

Run: `cd frontend && npm run test:run -- tests/components/GoalAuxiliaryViews.spec.js tests/unit/repositories/workspaceConflicts.spec.js`.

- [ ] **Step 6: Verify and commit**

Run: `cd frontend && npm run test:run && npm run lint && npm run build`.

Commit:

```bash
git add frontend/src/components/goals frontend/src/views/GoalManagement.vue frontend/src/components/TodoItems.vue frontend/src/repositories/workspaceRepository.js frontend/src/main.js frontend/tests
git commit -m "feat(workspace): 完善层级视图与异常恢复"
```

---

### Task 10: Add End-to-End and Performance Acceptance

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/package-lock.json`
- Create: `frontend/playwright.config.js`
- Create: `frontend/tests/e2e/goal-task-hierarchy.spec.js`
- Modify: `README.md`

**Interfaces:**
- Consumes: Tasks1–9 completed UI.
- Produces: browser acceptance suite and recovery documentation.

- [ ] **Step 1: Install and configure Playwright**

Run: `cd frontend && npm install --save-dev @playwright/test@^1.54.1 && npx playwright install chromium`.

Add scripts `test:e2e` and `test:e2e:ui`. Create config:

```js
import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: './tests/e2e',
  use: { baseURL: 'http://127.0.0.1:8888', trace: 'retain-on-failure' },
  webServer: {
    command: 'npm run serve -- --host 127.0.0.1',
    url: 'http://127.0.0.1:8888',
    reuseExistingServer: !process.env.CI
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }]
})
```

- [ ] **Step 2: Write the failing core journey**

```js
import { expect, test } from '@playwright/test'

test('creates three goal and task levels with two-way navigation', async ({ page }) => {
  await page.goto('/goals')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await createGoal(page, '年度目标')
  await createChildGoal(page, '产品目标')
  await createChildGoal(page, '发布2.0')
  await expect(page.getByText('年度目标 / 产品目标 / 发布2.0')).toBeVisible()
  await createTask(page, '发布')
  await createChildTask(page, '发布', '验收')
  await createChildTask(page, '验收', '回归测试')
  await page.getByRole('link', { name: '查看任务管理' }).click()
  await expect(page.getByText('年度目标 / 产品目标 / 发布2.0')).toBeVisible()
  await page.getByText('年度目标 / 产品目标 / 发布2.0').click()
  await expect(page).toHaveURL(/\/goals\//)
})
```

Define the helpers in the same file:

```js
async function createGoal(page, title) {
  await page.getByRole('button', { name: '新建目标' }).click()
  await page.getByLabel('目标标题').fill(title)
  await page.getByRole('button', { name: '保存目标' }).click()
}

async function createChildGoal(page, title) {
  await page.getByRole('button', { name: '新增子目标' }).click()
  await page.getByLabel('目标标题').fill(title)
  await page.getByRole('button', { name: '保存目标' }).click()
}

async function createTask(page, title) {
  await page.getByRole('button', { name: '新增任务' }).click()
  await page.getByLabel('任务标题').fill(title)
  await page.getByRole('button', { name: '保存任务' }).click()
}

async function createChildTask(page, parentTitle, title) {
  await page.getByRole('button', { name: `为${parentTitle}新增子任务` }).click()
  await page.getByLabel('任务标题').fill(title)
  await page.getByRole('button', { name: '保存任务' }).click()
}
```

- [ ] **Step 3: Add required journeys**

Add separate tests with these assertions:

```js
test('rolls completion to every parent', async ({ page }) => {
  await seedThreeLevelWorkspace(page)
  await page.getByRole('checkbox', { name: '完成回归测试' }).check()
  await expect(page.getByTestId('task-progress-发布')).toHaveText('100%')
  await expect(page.getByTestId('goal-progress-发布2.0')).toHaveText('100%')
})

test('migrates valid and orphan legacy tasks', async ({ page }) => {
  await page.goto('/todos')
  await page.evaluate(() => {
    localStorage.setItem('goals', JSON.stringify([{ id: 'g1', title: '旧目标' }]))
    localStorage.setItem('todos', JSON.stringify([
      { id: 't1', text: '有效', goalId: 'g1' },
      { id: 't2', text: '孤儿', goalId: 'missing' }
    ]))
  })
  await page.reload()
  await expect(page.getByText('旧目标')).toBeVisible()
  await expect(page.getByText('未归属目标')).toBeVisible()
})

test('preserves hierarchy and selection after refresh', async ({ page }) => {
  await seedThreeLevelWorkspace(page)
  const before = page.url()
  await page.reload()
  await expect(page).toHaveURL(before)
  await expect(page.getByText('年度目标 / 产品目标 / 发布2.0')).toBeVisible()
})

test('supports promote and cascade deletion', async ({ page }) => {
  await seedThreeLevelWorkspace(page)
  await page.getByLabel('删除产品目标').click()
  await expect(page.getByText('将影响1个子目标和3个任务')).toBeVisible()
  await page.getByRole('button', { name: '提升子节点' }).click()
  await expect(page.getByText('年度目标 / 发布2.0')).toBeVisible()
  await page.getByLabel('删除发布2.0').click()
  await page.getByRole('button', { name: '级联删除' }).click()
  await expect(page.getByText('发布2.0')).toHaveCount(0)
})
```

Define the fixture helper:

```js
async function seedThreeLevelWorkspace(page) {
  await page.goto('/goals')
  await page.evaluate(() => {
    const now = new Date().toISOString()
    localStorage.setItem('efficient-office.workspace.v2', JSON.stringify({
      version: 2,
      updatedAt: now,
      goals: [
        { id: 'g1', parentGoalId: null, title: '年度目标', manualProgress: 0, weight: 1, deadline: null, createdAt: now, updatedAt: now },
        { id: 'g2', parentGoalId: 'g1', title: '产品目标', manualProgress: 0, weight: 1, deadline: null, createdAt: now, updatedAt: now },
        { id: 'g3', parentGoalId: 'g2', title: '发布2.0', manualProgress: 0, weight: 1, deadline: null, createdAt: now, updatedAt: now }
      ],
      tasks: [
        { id: 't1', goalId: 'g3', parentTaskId: null, title: '发布', completed: false, weight: 1, priority: '中', deadline: null, createdAt: now, updatedAt: now },
        { id: 't2', goalId: 'g3', parentTaskId: 't1', title: '验收', completed: false, weight: 1, priority: '中', deadline: null, createdAt: now, updatedAt: now },
        { id: 't3', goalId: 'g3', parentTaskId: 't2', title: '回归测试', completed: false, weight: 1, priority: '中', deadline: null, createdAt: now, updatedAt: now }
      ]
    }))
  })
  await page.goto('/goals/g3')
}
```

Run: `cd frontend && npm run test:e2e`.

- [ ] **Step 4: Add 100/1000 performance acceptance**

Seed100 goals and1000 tasks through `page.evaluate`. Measure search-expand-toggle over two animation frames:

```js
const elapsed = await page.evaluate(async () => {
  const started = performance.now()
  document.querySelector('[data-testid="goal-search"]').dispatchEvent(new Event('input'))
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  return performance.now() - started
})
expect(elapsed).toBeLessThan(200)
```

Threshold: 200ms on project CI Chromium; baseline changes require a recorded benchmark.

- [ ] **Step 5: Document recovery and run final verification**

README adds “目标任务V2数据恢复”：列出V2、备份、诊断键；说明失败时保留旧数据并从备份恢复，不要求手改JSON。

Run: `cd frontend && npm run test:run && npm run test:e2e && npm run lint && npm run build && git diff --check`.

Expected: all unit/component/E2E tests pass; lint/build/diff exit0.

- [ ] **Step 6: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/playwright.config.js frontend/tests/e2e README.md
git commit -m "test(workspace): 覆盖目标任务核心闭环"
```

---

## Final Review Gate

- [ ] Compare spec sections1–16 against Tasks2–10; every requirement must map to a task.
- [ ] Run `rg -n "localStorage\.(getItem|setItem).*('goals'|'todos')" frontend/src`; only repository migration code may match.
- [ ] Run `rg -n "GoalManager|GoalList|GoalCreator|store/modules/tasks" frontend/src`; expected output is empty.
- [ ] Run `git log --oneline main..HEAD`; every implementation commit matches `type(scope): description`.
- [ ] Run the complete Task10 verification command with fresh output.
- [ ] Verify valid, orphaned, duplicate and malformed migration fixtures.
- [ ] Confirm business-code changes are absent from the two planning commits.
