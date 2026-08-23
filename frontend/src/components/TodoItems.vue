<template>
  <section class="todo-page">
    <header class="page-header">
      <div class="heading">
        <span class="accent" aria-hidden="true"></span>
        <div><h1>待办事项</h1><p>多层任务与目标上下文</p></div>
      </div>
      <div class="summary-actions">
        <el-tag effect="light">待完成 {{ statusCount.active }}</el-tag>
        <el-tag type="success" effect="light">已完成 {{ statusCount.completed }}</el-tag>
        <el-button type="primary" :icon="Plus" :disabled="invalidGoalFilter" @click="openCreate(null)">新增任务</el-button>
      </div>
    </header>

    <div v-if="selectedGoalId && !selectedGoal" class="invalid-filter">
      <span>筛选目标不存在或已删除。</span>
      <el-button link type="primary" data-testid="recover-invalid-goal" @click="clearGoalFilter">查看全部任务</el-button>
    </div>

    <div class="filters">
      <el-input v-model="searchText" aria-label="搜索任务" :prefix-icon="Search" clearable placeholder="搜索任务、描述或目标…" />
      <el-select aria-label="目标筛选" :model-value="selectedGoalId || ''" filterable class="goal-filter" @change="setGoalFilter">
        <el-option label="全部目标与未归属任务" value="" />
        <el-option v-for="goal in goalStore.goals" :key="goal.id" :label="goalPathText(goal.id)" :value="String(goal.id)" />
      </el-select>
      <el-switch v-model="includeDescendants" aria-label="包含后代目标" :disabled="!selectedGoal" active-text="包含后代目标" />
      <el-select v-model="filterStatus" aria-label="任务状态" class="short-filter">
        <el-option label="全部状态" value="all" /><el-option label="未完成" value="active" /><el-option label="已完成" value="completed" />
      </el-select>
      <el-select v-model="priorityFilter" aria-label="优先级筛选" class="short-filter">
        <el-option label="全部优先级" value="all" /><el-option label="高优先级" value="高" /><el-option label="中优先级" value="中" /><el-option label="低优先级" value="低" />
      </el-select>
      <el-select v-model="dateFilter" aria-label="截止日期筛选" class="short-filter">
        <el-option label="全部日期" value="all" /><el-option label="今日到期" value="today" /><el-option label="已逾期" value="overdue" /><el-option label="未设置日期" value="unset" />
      </el-select>
    </div>

    <div class="table-scroll">
      <TaskTreeTable
        :tasks="displayTasks"
        :all-tasks="scopedTasks"
        :goal-paths="goalPaths"
        @toggle="toggleTask"
        @edit="openEdit"
        @create-child="openCreate"
        @move="moveTask"
        @start="startPomodoro"
        @delete="removeTask"
        @navigate-goal="navigateGoal"
      />
    </div>

    <footer class="quick-create">
      <div v-if="selectedGoal" class="context-note">目标：{{ goalPathText(selectedGoal.id) }} · 新任务将直属该目标</div>
      <div v-else class="context-note">可创建未归属根任务；子任务自动继承所属目标</div>
      <form @submit.prevent="quickCreate">
        <el-input v-model="quickTitle" aria-label="新任务标题" placeholder="添加新任务…" clearable />
        <el-select v-model="quickPriority" aria-label="新任务优先级"><el-option label="高" value="高" /><el-option label="中" value="中" /><el-option label="低" value="低" /></el-select>
        <el-date-picker v-model="quickDeadline" aria-label="新任务截止日期" type="date" value-format="YYYY-MM-DD" placeholder="截止日期" />
        <el-button type="primary" native-type="submit" :icon="Plus" :disabled="invalidGoalFilter" data-testid="quick-add-task">添加</el-button>
      </form>
    </footer>

    <TaskEditorDialog
      v-model="editorOpen"
      :goals="goalStore.goals"
      :tasks="taskStore.tasks"
      :task="editingTask"
      :context="editorContext"
      @save="saveTask"
    />
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import TaskTreeTable from '@/components/tasks/TaskTreeTable.vue'
import TaskEditorDialog from '@/components/tasks/TaskEditorDialog.vue'
import { useGoalStore } from '@/stores/goals'
import { useTaskStore } from '@/stores/tasks'
import { getAncestorIds } from '@/domain/hierarchy'
import { deleteTask } from '@/services/workspaceCommands'

const route = useRoute()
const router = useRouter()
const goalStore = useGoalStore()
const taskStore = useTaskStore()

const searchText = ref('')
const filterStatus = ref('all')
const priorityFilter = ref('all')
const dateFilter = ref('all')
const editorOpen = ref(false)
const editingTask = ref(null)
const editorContext = ref({ goalId: null, parentTaskId: null })
const quickTitle = ref('')
const quickPriority = ref('中')
const quickDeadline = ref(null)

const selectedGoalId = computed(() => {
  const value = route.query.goalId
  if (value == null || value === '') return null
  return String(Array.isArray(value) ? value[0] : value)
})
const selectedGoal = computed(() => selectedGoalId.value ? goalStore.byId(selectedGoalId.value) : null)
const invalidGoalFilter = computed(() => Boolean(selectedGoalId.value && !selectedGoal.value))
const includeDescendants = computed({
  get: () => route.query.includeDescendants === '1',
  set: value => updateQuery({ includeDescendants: value ? '1' : '0' })
})
const goalPaths = computed(() => Object.fromEntries(goalStore.goals.map(goal => [String(goal.id), goalStore.pathFor(goal.id)])))
const scopedTasks = computed(() => {
  if (!selectedGoalId.value) return taskStore.tasks
  if (!selectedGoal.value) return []
  return taskStore.tasksForGoal(selectedGoalId.value, includeDescendants.value, goalStore.goals)
})
const filteredTasks = computed(() => {
  const matching = new Set(scopedTasks.value.filter(matchesFilters).map(task => String(task.id)))
  if (!matching.size) return []
  for (const id of [...matching]) {
    getAncestorIds(scopedTasks.value, id, 'parentTaskId').forEach(parentId => matching.add(parentId))
  }
  return scopedTasks.value.filter(task => matching.has(String(task.id)))
})
const displayTasks = computed(() => filteredTasks.value.map(task => ({
  ...task,
  completed: taskStore.viewFor(task.id).completed
})))
const statusCount = computed(() => ({
  active: scopedTasks.value.filter(task => !taskStore.viewFor(task.id).completed).length,
  completed: scopedTasks.value.filter(task => taskStore.viewFor(task.id).completed).length
}))

onMounted(() => {
  goalStore.initialize()
  taskStore.initialize()
})

function titleOf(task) { return String(task.title || task.text || '') }
function deadlineOf(task) { return task.deadline ?? task.dueDate ?? null }
function matchesFilters(task) {
  const derivedCompleted = taskStore.viewFor(task.id).completed
  if (filterStatus.value === 'active' && derivedCompleted) return false
  if (filterStatus.value === 'completed' && !derivedCompleted) return false
  if (priorityFilter.value !== 'all' && task.priority !== priorityFilter.value) return false
  const deadline = deadlineOf(task)
  if (dateFilter.value === 'unset' && deadline != null) return false
  if (dateFilter.value === 'today' && !isToday(deadline)) return false
  if (dateFilter.value === 'overdue' && (!deadline || derivedCompleted || new Date(deadline) >= new Date())) return false
  const query = searchText.value.trim().toLocaleLowerCase()
  if (!query) return true
  if (query.startsWith('!')) return String(task.priority || '').toLocaleLowerCase().includes(query.slice(1))
  const goalText = task.goalId == null ? '未归属目标' : goalPathText(task.goalId)
  return [titleOf(task), task.description, goalText].some(value => String(value || '').toLocaleLowerCase().includes(query))
}
function isToday(value) {
  if (!value) return false
  const date = new Date(value)
  const today = new Date()
  return !Number.isNaN(date.getTime()) && date.toDateString() === today.toDateString()
}
function goalPathText(id) { return (goalPaths.value[String(id)] || []).map(goal => goal.title).join(' / ') }
function updateQuery(patch) {
  const query = { ...route.query, ...patch }
  Object.keys(query).forEach(key => { if (query[key] == null || query[key] === '') delete query[key] })
  router.replace({ name: 'TodoList', query })
}
function setGoalFilter(goalId) {
  updateQuery({ goalId: goalId || undefined, includeDescendants: goalId ? '0' : undefined })
}
function clearGoalFilter() { setGoalFilter('') }
function navigateGoal(goalId) { router.push({ name: 'GoalDetail', params: { goalId: String(goalId) } }) }

function openCreate(parentTaskId) {
  const parent = parentTaskId == null ? null : taskStore.byId(parentTaskId)
  editingTask.value = null
  editorContext.value = {
    goalId: parent ? parent.goalId : selectedGoalId.value,
    parentTaskId: parent ? String(parent.id) : null
  }
  editorOpen.value = true
}
function openEdit(id) {
  editingTask.value = taskStore.byId(id)
  if (!editingTask.value) return
  editorContext.value = { goalId: editingTask.value.goalId, parentTaskId: editingTask.value.parentTaskId }
  editorOpen.value = true
}
function saveTask(input) {
  try {
    input.id ? taskStore.updateTask(input.id, input) : taskStore.createTask(input)
    editorOpen.value = false
    ElMessage.success(input.id ? '任务已更新' : '任务已创建')
  } catch (error) { ElMessage.error(error.message || '任务保存失败') }
}
function quickCreate() {
  if (invalidGoalFilter.value) return ElMessage.warning('请先清除失效的目标筛选')
  if (!quickTitle.value.trim()) return ElMessage.warning('请输入任务标题')
  try {
    taskStore.createTask({ title: quickTitle.value, goalId: selectedGoalId.value, parentTaskId: null, priority: quickPriority.value, deadline: quickDeadline.value })
    quickTitle.value = ''
    quickDeadline.value = null
    ElMessage.success('任务已创建')
  } catch (error) { ElMessage.error(error.message || '任务创建失败') }
}
function toggleTask(id) {
  try { taskStore.toggleTask(id) } catch (error) { ElMessage.error(error.message || '任务更新失败') }
}
async function moveTask(id) {
  const task = taskStore.byId(id)
  if (!task) return
  try {
    const { value } = await ElMessageBox.prompt('输入新父任务ID；留空移动到根级', '移动任务', { inputValue: task.parentTaskId || '' })
    const parentTaskId = String(value || '').trim() || null
    const options = parentTaskId ? { parentTaskId } : { parentTaskId: null, goalId: task.goalId }
    taskStore.moveTask(id, options)
    ElMessage.success('任务已移动')
  } catch (action) {
    if (action !== 'cancel' && action !== 'close') ElMessage.error(action?.message || '任务移动失败')
  }
}
function removeTask(id, mode) {
  try {
    deleteTask({ taskId: id, mode, taskStore })
    ElMessage.success('任务已删除')
  } catch (error) { ElMessage.error(error.message || '任务删除失败') }
}
function startPomodoro(id) {
  router.push({ path: '/pomodoro-timer', query: { taskId: String(id) } })
}

defineExpose({ startPomodoro })
</script>

<style scoped>
.todo-page { display: flex; height: 100%; min-height: 620px; flex-direction: column; overflow: hidden; border: 1px solid #e5e7eb; border-radius: 12px; background: white; color: #1f2937; box-shadow: 0 1px 3px rgba(15,23,42,.06); }
.page-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; border-bottom: 1px solid #e5e7eb; padding: 14px 20px; }
.heading, .summary-actions { display: flex; align-items: center; gap: 9px; }
.accent { width: 4px; height: 26px; border-radius: 99px; background: #2564cf; }
h1 { margin: 0; font-size: 21px; } .heading p { margin: 2px 0 0; color: #64748b; font-size: 12px; }
.filters { display: grid; grid-template-columns: minmax(220px, 1fr) minmax(220px, 300px) auto 128px 128px 128px; align-items: center; gap: 9px; border-bottom: 1px solid #e5e7eb; padding: 12px 20px; }
.invalid-filter { display: flex; align-items: center; justify-content: center; gap: 6px; background: #fffbeb; padding: 8px; color: #92400e; font-size: 13px; }
.table-scroll { min-height: 0; flex: 1; overflow: auto; }
.quick-create { border-top: 1px solid #e5e7eb; padding: 10px 20px 14px; }
.context-note { margin-bottom: 8px; color: #64748b; font-size: 12px; }
.quick-create form { display: grid; grid-template-columns: minmax(220px, 1fr) 90px 150px auto; gap: 8px; }
@media (max-width: 1180px) { .filters { grid-template-columns: 1fr 1fr 150px; } }
@media (max-width: 720px) { .page-header { align-items: flex-start; } .heading p, .summary-actions .el-tag { display: none; } .filters, .quick-create form { grid-template-columns: 1fr; } }
</style>
