<template>
  <div class="task-table" role="table" aria-label="任务列表">
    <div class="task-header" role="row">
      <span></span><span>任务</span><span>所属目标</span><span>优先级</span><span>截止日期</span><span>操作</span>
    </div>
    <div v-if="roots.length" class="task-body">
      <TaskRows
        v-for="task in roots"
        :key="task.id"
        :task="task"
        :depth="0"
        :expanded="expanded"
        :goal-paths="goalPaths"
        :delete-prompt-id="deletePromptId"
        @expand="toggleExpanded"
        @toggle="id => $emit('toggle', id)"
        @edit="id => $emit('edit', id)"
        @create-child="id => $emit('create-child', id)"
        @move="id => $emit('move', id)"
        @start="id => $emit('start', id)"
        @request-delete="deletePromptId = $event"
        @delete="emitDelete"
        @navigate-goal="id => $emit('navigate-goal', id)"
      />
    </div>
    <div v-else class="empty-state">没有符合条件的任务</div>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import GoalBreadcrumb from './GoalBreadcrumb.vue'

const TaskRows = defineComponent({
  name: 'TaskRows',
  components: { GoalBreadcrumb },
  props: {
    task: { type: Object, required: true },
    depth: { type: Number, default: 0 },
    expanded: { type: Object, required: true },
    goalPaths: { type: Object, required: true },
    deletePromptId: { type: String, default: null }
  },
  emits: ['expand', 'toggle', 'edit', 'create-child', 'move', 'start', 'request-delete', 'delete', 'navigate-goal'],
  computed: {
    children() { return this.task.children || [] },
    isExpanded() { return this.expanded.has(String(this.task.id)) },
    path() { return this.task.goalId == null ? [] : (this.goalPaths[String(this.task.goalId)] || []) },
    title() { return this.task.title || this.task.text || '未命名任务' },
    deadline() { return this.task.deadline ?? this.task.dueDate ?? null }
  },
  template: `
    <div>
      <div class="task-row" role="row" :data-testid="'task-row-' + task.id">
        <button v-if="children.length" type="button" class="icon-button expand-button" :aria-label="(isExpanded ? '收起' : '展开') + title" :data-testid="'expand-task-' + task.id" @click="$emit('expand', String(task.id))">{{ isExpanded ? '⌄' : '›' }}</button>
        <span v-else class="row-spacer"></span>
        <div class="task-title-cell" :style="{ paddingLeft: depth * 18 + 'px' }">
          <input type="checkbox" :checked="task.completed" :disabled="children.length > 0" :aria-label="'完成' + title" @change="$emit('toggle', String(task.id))" />
          <div class="task-title-copy"><span :class="{ completed: task.completed }">{{ title }}</span><small v-if="children.length">{{ children.length }} 个子任务</small></div>
        </div>
        <GoalBreadcrumb :path="path" :data-testid="'goal-path-' + task.id" @navigate="$emit('navigate-goal', $event)" />
        <span class="priority" :class="'priority-' + (task.priority || '中')">{{ task.priority || '中' }}</span>
        <span class="deadline">{{ task.completed ? '已完成' : (deadline || '未设置') }}</span>
        <div class="row-actions">
          <button type="button" class="icon-button" :aria-label="'开始专注' + title" @click="$emit('start', String(task.id))">◷</button>
          <button type="button" class="icon-button" :data-testid="'add-child-task-' + task.id" :aria-label="'为' + title + '新增子任务'" @click="$emit('create-child', String(task.id))">＋</button>
          <button type="button" class="icon-button" :aria-label="'编辑' + title" @click="$emit('edit', String(task.id))">✎</button>
          <button type="button" class="icon-button" :aria-label="'移动' + title" @click="$emit('move', String(task.id))">↗</button>
          <button type="button" class="icon-button danger" :data-testid="'delete-task-' + task.id" :aria-label="'删除' + title" @click="$emit('request-delete', String(task.id))">×</button>
        </div>
      </div>
      <div v-if="deletePromptId === String(task.id)" class="delete-prompt" :data-testid="'delete-mode-' + task.id">
        <span>{{ children.length ? '该任务包含子任务，请选择处理方式' : '确认删除该任务？' }}</span>
        <button v-if="children.length" type="button" :data-testid="'promote-task-' + task.id" @click="$emit('delete', String(task.id), 'promote')">提升子任务并删除</button>
        <button type="button" :data-testid="'cascade-task-' + task.id" @click="$emit('delete', String(task.id), 'cascade')">{{ children.length ? '级联删除' : '确认删除' }}</button>
      </div>
      <TaskRows v-if="isExpanded" v-for="child in children" :key="child.id" :task="child" :depth="depth + 1" :expanded="expanded" :goal-paths="goalPaths" :delete-prompt-id="deletePromptId" @expand="$emit('expand', $event)" @toggle="$emit('toggle', $event)" @edit="$emit('edit', $event)" @create-child="$emit('create-child', $event)" @move="$emit('move', $event)" @start="$emit('start', $event)" @request-delete="$emit('request-delete', $event)" @delete="(...args) => $emit('delete', ...args)" @navigate-goal="$emit('navigate-goal', $event)" />
    </div>`
})

export default { components: { TaskRows } }
</script>

<script setup>
import { computed, reactive, ref } from 'vue'
import { buildTree } from '@/domain/hierarchy'

const props = defineProps({
  tasks: { type: Array, default: () => [] },
  goalPaths: { type: Object, default: () => ({}) }
})
const emit = defineEmits(['toggle', 'edit', 'create-child', 'move', 'start', 'delete', 'navigate-goal'])
const expanded = reactive(new Set())
const deletePromptId = ref(null)
const roots = computed(() => buildTree(props.tasks, 'parentTaskId'))

function toggleExpanded(id) {
  expanded.has(id) ? expanded.delete(id) : expanded.add(id)
}

function emitDelete(id, mode) {
  deletePromptId.value = null
  emit('delete', id, mode)
}
</script>

<style scoped>
.task-table { min-width: 900px; color: #1f2937; }
.task-header, :deep(.task-row) { display: grid; grid-template-columns: 44px minmax(260px, 1fr) 300px 90px 130px 142px; align-items: center; }
.task-header { border-bottom: 1px solid #e5e7eb; padding: 9px 12px; background: #f8fafc; color: #475569; font-size: 12px; font-weight: 600; }
:deep(.task-row) { min-height: 48px; border-bottom: 1px solid #eef2f7; padding: 5px 12px; font-size: 13px; }
:deep(.task-row:hover) { background: #f8fafc; }
:deep(.row-spacer) { width: 32px; }
:deep(.icon-button) { display: grid; width: 30px; height: 30px; place-items: center; border: 0; border-radius: 7px; background: transparent; color: #64748b; cursor: pointer; }
:deep(.icon-button:hover) { background: #eff6fc; color: #2564cf; }
:deep(.icon-button.danger:hover) { background: #fef2f2; color: #dc2626; }
:deep(.task-title-cell) { display: flex; min-width: 0; align-items: center; gap: 9px; }
:deep(.task-title-copy) { display: grid; min-width: 0; }
:deep(.task-title-copy span) { overflow: hidden; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
:deep(.task-title-copy small) { color: #94a3b8; }
:deep(.completed) { color: #94a3b8; text-decoration: line-through; }
:deep(.priority) { width: fit-content; border-radius: 5px; padding: 3px 8px; font-size: 12px; }
:deep(.priority-高) { background: #fef2f2; color: #b91c1c; }
:deep(.priority-中) { background: #fffbeb; color: #b45309; }
:deep(.priority-低) { background: #eff6ff; color: #1d4ed8; }
:deep(.deadline) { color: #64748b; font-size: 12px; }
:deep(.row-actions) { display: flex; gap: 1px; }
:deep(.delete-prompt) { display: flex; align-items: center; justify-content: flex-end; gap: 8px; border-bottom: 1px solid #fee2e2; padding: 8px 16px; background: #fff7f7; color: #991b1b; font-size: 12px; }
:deep(.delete-prompt button) { border: 1px solid #fecaca; border-radius: 6px; padding: 5px 9px; background: white; color: #991b1b; cursor: pointer; }
.empty-state { padding: 64px 20px; text-align: center; color: #94a3b8; }
</style>
