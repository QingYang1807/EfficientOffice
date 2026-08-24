<template>
  <section class="goal-task-tree" aria-label="目标任务">
    <div class="task-toolbar">
      <div>
        <h3>目标任务</h3>
        <p>{{ includeDescendants ? '包含后代目标' : '仅当前目标' }}</p>
      </div>
      <el-switch
        :model-value="includeDescendants"
        aria-label="包含后代目标任务"
        @update:model-value="$emit('update:includeDescendants', $event)"
      />
    </div>
    <div v-if="tree.length" class="task-list">
      <TaskBranch
        v-for="task in tree"
        :key="task.id"
        :task="task"
        :view-for="viewFor"
        @create-child="$emit('create-child', $event)"
        @toggle="$emit('toggle', $event)"
      />
    </div>
    <div v-else class="task-empty">
      <el-empty description="这个目标还没有任务" :image-size="72" />
      <el-button type="primary" @click="$emit('create-task', goalId)">创建第一个任务</el-button>
    </div>
  </section>
</template>

<script>
import { defineComponent } from 'vue'

const TaskBranch = defineComponent({
  name: 'TaskBranch',
  props: { task: Object, viewFor: Function },
  emits: ['create-child', 'toggle'],
  template: `
    <div class="task-branch">
      <div class="task-row" :data-testid="'goal-task-' + task.id">
        <el-checkbox
          :model-value="viewFor(task.id).completed"
          :disabled="Boolean(task.children && task.children.length)"
          :aria-label="'完成' + task.title"
          @change="$emit('toggle', task.id)"
        />
        <span class="task-title">{{ task.title }}</span>
        <span class="task-progress" :data-testid="'task-progress-' + task.title">{{ viewFor(task.id).progress }}%</span>
        <button type="button" class="task-add" :aria-label="'为' + task.title + '新增子任务'" @click="$emit('create-child', task.id)">+</button>
      </div>
      <div v-if="task.children && task.children.length" class="task-children">
        <TaskBranch
          v-for="child in task.children"
          :key="child.id"
          :task="child"
          :view-for="viewFor"
          @create-child="$emit('create-child', $event)"
          @toggle="$emit('toggle', $event)"
        />
      </div>
    </div>`
})

export default { components: { TaskBranch } }
</script>

<script setup>
import { computed } from 'vue'
import { buildTree } from '@/domain/hierarchy'
import { deriveWorkspaceViews } from '@/domain/progress'

const props = defineProps({
  tasks: { type: Array, default: () => [] },
  goalId: { type: String, default: null },
  descendantGoalIds: { type: Array, default: () => [] },
  includeDescendants: { type: Boolean, default: false }
})

defineEmits(['create-task', 'create-child', 'toggle', 'update:includeDescendants'])

const tree = computed(() => {
  const goalIds = new Set([String(props.goalId)])
  if (props.includeDescendants) props.descendantGoalIds.forEach(id => goalIds.add(String(id)))
  const selected = props.tasks.filter(task => task.goalId != null && goalIds.has(String(task.goalId)))
  return buildTree(selected, 'parentTaskId')
})

const taskViews = computed(() => deriveWorkspaceViews([], props.tasks).tasks)
const viewFor = id => taskViews.value.get(String(id))
</script>

<style scoped>
.goal-task-tree { padding: 20px; }
.task-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-bottom: 14px; border-bottom: 1px solid #e5e7eb; }
.task-toolbar h3 { margin: 0; font-size: 16px; }
.task-toolbar p { margin: 4px 0 0; color: #64748b; font-size: 12px; }
.task-list { display: grid; gap: 4px; margin-top: 14px; }
.task-row { display: flex; align-items: center; gap: 8px; min-height: 36px; padding: 4px 6px; border-radius: 7px; }
.task-row:hover { background: #f8fafc; }
.task-title { min-width: 0; flex: 1; overflow: hidden; text-overflow: ellipsis; font-size: 13px; }
.task-progress { color: #64748b; font-size: 12px; }
.task-add { border: 0; background: transparent; color: #2564cf; cursor: pointer; font-size: 18px; }
.task-children { margin-left: 20px; border-left: 1px solid #dbe4ef; padding-left: 6px; }
.task-empty { text-align: center; }
</style>
