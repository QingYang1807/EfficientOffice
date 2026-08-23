<template>
  <main class="goals-page">
    <header class="page-header">
      <div>
        <h1>目标工作台</h1>
        <p>把结果逐层拆解，并在同一处跟踪执行任务</p>
      </div>
      <div class="header-actions">
        <el-radio-group v-model="viewMode" aria-label="目标视图">
          <el-radio-button label="workspace" data-testid="view-workspace" @click="viewMode = 'workspace'">工作台</el-radio-button>
          <el-radio-button label="kanban" data-testid="view-kanban" @click="viewMode = 'kanban'">看板</el-radio-button>
          <el-radio-button label="mindmap" data-testid="view-mindmap" @click="viewMode = 'mindmap'">思维导图</el-radio-button>
        </el-radio-group>
        <el-button class="mobile-tree-button" :icon="Menu" @click="treeDrawerOpen = true">目标树</el-button>
        <el-button type="primary" :icon="Plus" @click="openCreateGoal(null)">新建目标</el-button>
      </div>
    </header>

    <div v-if="stale" class="recovery-banner" role="alert" data-testid="stale-workspace">
      <span>数据已在其他页面更新，请刷新后继续编辑。</span>
      <el-button type="primary" link @click="refreshWorkspace">刷新数据</el-button>
    </div>
    <div v-if="goalStore.lastError || taskStore.lastError" class="recovery-banner error-banner" role="alert">
      <span>{{ goalStore.lastError || taskStore.lastError }}</span>
      <el-button link type="primary" @click="exportData">导出数据</el-button>
    </div>

    <section v-if="!goalStore.goals.length" class="page-state">
      <el-empty description="还没有目标，从一个清晰的结果开始">
        <el-button type="primary" @click="openCreateGoal(null)">创建第一个目标</el-button>
      </el-empty>
    </section>

    <section v-else-if="routeGoalId && !selectedGoal" class="page-state invalid-goal">
      <el-result icon="warning" title="目标不存在或已删除" sub-title="链接中的目标已失效，你可以返回目标列表继续。">
        <template #extra>
          <el-button type="primary" @click="recoverFromInvalidGoal">返回目标列表</el-button>
        </template>
      </el-result>
    </section>

    <GoalKanban
      v-else-if="viewMode === 'kanban'"
      :goals="goalSummaries"
      @card-click="goal => selectGoal(goal.id)"
    />

    <GoalMindMap
      v-else-if="viewMode === 'mindmap'"
      :goals="goalTreeWithViews"
      @node-click="selectGoal"
    />

    <section v-else-if="selectedGoal" class="workspace-shell">
      <aside class="tree-panel panel-card">
        <div class="panel-heading">
          <strong>目标层级</strong>
          <span>{{ goalStore.goals.length }}</span>
        </div>
        <el-input v-model="search" :prefix-icon="Search" clearable placeholder="搜索目标" />
        <GoalTree
          :goals="goalsWithViews"
          :selected-id="selectedGoal.id"
          :search="search"
          :expanded-ids="expandedIds"
          @select="selectGoal"
          @create-child="openCreateGoal"
          @create-task="createTaskForGoal"
          @move="moveGoal"
          @delete="removeGoal"
          @update:expanded-ids="updateExpandedIds"
        />
      </aside>

      <section class="detail-panel panel-card">
        <GoalWorkspace
          :goal="selectedGoal"
          :path="selectedPath"
          :view="selectedView"
          :child-goals="directChildren"
          :contributions="contributions"
          @select="selectGoal"
          @create-child="openCreateGoal"
          @create-task="createTaskForGoal"
          @view-tasks="viewTasksForGoal"
          @edit="openEditGoal"
        />
      </section>

      <aside class="tasks-panel panel-card">
        <GoalTaskTree
          :tasks="taskStore.tasks"
          :goal-id="selectedGoal.id"
          :descendant-goal-ids="descendantGoalIds"
          :include-descendants="includeDescendants"
          @update:include-descendants="includeDescendants = $event"
          @create-task="createTaskForGoal"
          @create-child="createChildTask"
          @toggle="toggleTask"
        />
      </aside>

      <div class="mobile-detail panel-card">
        <el-tabs v-model="mobileTab" stretch>
          <el-tab-pane label="目标详情" name="detail">
            <GoalWorkspace
              :goal="selectedGoal"
              :path="selectedPath"
              :view="selectedView"
              :child-goals="directChildren"
              :contributions="contributions"
              @select="selectGoal"
              @create-child="openCreateGoal"
              @create-task="createTaskForGoal"
              @view-tasks="viewTasksForGoal"
              @edit="openEditGoal"
            />
          </el-tab-pane>
          <el-tab-pane label="关联任务" name="tasks">
            <GoalTaskTree
              :tasks="taskStore.tasks"
              :goal-id="selectedGoal.id"
              :descendant-goal-ids="descendantGoalIds"
              :include-descendants="includeDescendants"
              @update:include-descendants="includeDescendants = $event"
              @create-task="createTaskForGoal"
              @create-child="createChildTask"
              @toggle="toggleTask"
            />
          </el-tab-pane>
        </el-tabs>
      </div>
    </section>

    <el-drawer v-model="treeDrawerOpen" title="目标层级" size="min(88vw, 340px)" direction="ltr">
      <el-input v-model="search" :prefix-icon="Search" clearable placeholder="搜索目标" />
      <GoalTree
        :goals="goalsWithViews"
        :selected-id="selectedGoal?.id || null"
        :search="search"
        :expanded-ids="expandedIds"
        @select="selectGoalFromDrawer"
        @create-child="openCreateGoal"
        @create-task="createTaskForGoal"
        @move="moveGoal"
        @delete="removeGoal"
        @update:expanded-ids="updateExpandedIds"
      />
    </el-drawer>

    <GoalEditorDialog
      v-model="editorOpen"
      :parent-goal-id="editorParentGoalId"
      :goal="editingGoal"
      @save="saveGoal"
    />
  </main>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Menu, Plus, Search } from '@element-plus/icons-vue'
import GoalTree from '@/components/goals/GoalTree.vue'
import GoalWorkspace from '@/components/goals/GoalWorkspace.vue'
import GoalTaskTree from '@/components/goals/GoalTaskTree.vue'
import GoalEditorDialog from '@/components/goals/GoalEditorDialog.vue'
import GoalKanban from '@/components/goals/GoalKanban.vue'
import GoalMindMap from '@/components/goals/GoalMindMap.vue'
import { useGoalStore } from '@/stores/goals'
import { useTaskStore } from '@/stores/tasks'
import { buildTree, getDescendantIds } from '@/domain/hierarchy'
import { deleteGoal } from '@/services/workspaceCommands'

const GOAL_UI_KEY = 'efficient-office.goal-ui.v1'
const route = useRoute()
const router = useRouter()
const goalStore = useGoalStore()
const taskStore = useTaskStore()

const search = ref('')
const includeDescendants = ref(false)
const treeDrawerOpen = ref(false)
const mobileTab = ref('detail')
const editorOpen = ref(false)
const editorParentGoalId = ref(null)
const editingGoal = ref(null)
const storedSelectedId = ref(null)
const expandedIds = ref([])
const viewMode = ref('workspace')
const stale = ref(false)

const routeGoalId = computed(() => {
  const value = route.params.goalId
  return value == null || value === '' ? null : String(Array.isArray(value) ? value[0] : value)
})
const firstGoalId = computed(() => goalStore.tree[0]?.id || goalStore.goals[0]?.id || null)
const selectedGoalId = computed(() => routeGoalId.value || storedSelectedId.value || firstGoalId.value)
const selectedGoal = computed(() => selectedGoalId.value ? goalStore.byId(selectedGoalId.value) : null)
const selectedPath = computed(() => selectedGoal.value ? goalStore.pathFor(selectedGoal.value.id) : [])
const selectedView = computed(() => selectedGoal.value
  ? goalStore.viewFor(selectedGoal.value.id, taskStore.tasks)
  : { progress: 0, status: 'not_started' })
const descendantGoalIds = computed(() => selectedGoal.value
  ? getDescendantIds(goalStore.goals, selectedGoal.value.id, 'parentGoalId')
  : [])
const directChildren = computed(() => {
  if (!selectedGoal.value) return []
  return goalStore.goals
    .filter(goal => String(goal.parentGoalId) === String(selectedGoal.value.id))
    .map(goal => ({ ...goal, ...goalStore.viewFor(goal.id, taskStore.tasks) }))
})
const contributions = computed(() => {
  if (!selectedGoal.value) return []
  const goalItems = directChildren.value.map(goal => ({
    id: goal.id, type: 'goal', title: goal.title, progress: goal.progress, weight: goal.weight
  }))
  const taskItems = taskStore.tasks
    .filter(task => String(task.goalId) === String(selectedGoal.value.id) && task.parentTaskId == null)
    .map(task => ({
      id: task.id,
      type: 'task',
      title: task.title,
      progress: taskStore.viewFor(task.id).progress,
      weight: task.weight
    }))
  return [...goalItems, ...taskItems]
})
const goalsWithViews = computed(() => goalStore.goals.map(goal => ({
  ...goal,
  ...goalStore.viewFor(goal.id, taskStore.tasks)
})))
const goalTreeWithViews = computed(() => buildTree(goalsWithViews.value, 'parentGoalId'))
const goalSummaries = computed(() => goalsWithViews.value.map(goal => ({
  ...goal,
  parentPath: goalStore.pathFor(goal.id).slice(0, -1).map(item => item.title).join(' / ')
})))

function markStale() { stale.value = true }

onMounted(() => {
  goalStore.initialize()
  taskStore.initialize()
  restoreUiState()
  sanitizeAndSaveUiState()
  if (!routeGoalId.value && selectedGoalId.value) {
    router.replace({ name: 'GoalDetail', params: { goalId: selectedGoalId.value } })
  }
  window.addEventListener('workspace:stale', markStale)
})

onBeforeUnmount(() => window.removeEventListener('workspace:stale', markStale))

watch(routeGoalId, id => {
  sanitizeAndSaveUiState(id)
})

watch(() => goalStore.goals.map(goal => String(goal.id)), () => {
  sanitizeAndSaveUiState(routeGoalId.value)
})

function restoreUiState() {
  try {
    const state = JSON.parse(localStorage.getItem(GOAL_UI_KEY) || '{}')
    storedSelectedId.value = state.selectedId == null ? null : String(state.selectedId)
    expandedIds.value = Array.isArray(state.expandedIds) ? state.expandedIds.map(String) : []
  } catch {
    storedSelectedId.value = null
    expandedIds.value = []
  }
}

function saveUiState() {
  try {
    localStorage.setItem(GOAL_UI_KEY, JSON.stringify({
      expandedIds: expandedIds.value,
      selectedId: storedSelectedId.value
    }))
  } catch {
    // Domain writes remain authoritative when optional UI state cannot persist.
  }
}

function sanitizeAndSaveUiState(preferredId = routeGoalId.value) {
  const ids = new Set(goalStore.goals.map(goal => String(goal.id)))
  expandedIds.value = expandedIds.value.map(String).filter(id => ids.has(id))
  if (preferredId != null) {
    storedSelectedId.value = ids.has(String(preferredId)) ? String(preferredId) : null
  } else if (storedSelectedId.value != null && !ids.has(String(storedSelectedId.value))) {
    storedSelectedId.value = null
  }
  saveUiState()
}

function updateExpandedIds(ids) {
  const valid = new Set(goalStore.goals.map(goal => String(goal.id)))
  expandedIds.value = ids.map(String).filter(id => valid.has(id))
  saveUiState()
}

function refreshWorkspace() {
  goalStore.reload()
  taskStore.reload()
  stale.value = false
  sanitizeAndSaveUiState(routeGoalId.value)
}

function exportData() { goalStore.exportData() }

function selectGoal(id) {
  storedSelectedId.value = String(id)
  saveUiState()
  mobileTab.value = 'detail'
  router.push({ name: 'GoalDetail', params: { goalId: String(id) } })
}

function selectGoalFromDrawer(id) {
  treeDrawerOpen.value = false
  selectGoal(id)
}

function viewTasksForGoal(goalId) {
  router.push({ name: 'TodoList', query: { goalId: String(goalId), includeDescendants: '0' } })
}

function recoverFromInvalidGoal() {
  storedSelectedId.value = null
  saveUiState()
  router.push('/goals')
}

function openCreateGoal(parentGoalId) {
  editingGoal.value = null
  editorParentGoalId.value = parentGoalId == null ? null : String(parentGoalId)
  editorOpen.value = true
}

function openEditGoal(id) {
  editingGoal.value = goalStore.byId(id)
  editorParentGoalId.value = editingGoal.value?.parentGoalId || null
  editorOpen.value = Boolean(editingGoal.value)
}

function saveGoal(input) {
  try {
    const goal = input.id
      ? goalStore.updateGoal(input.id, input)
      : goalStore.createGoal(input)
    editorOpen.value = false
    selectGoal(goal.id)
    ElMessage.success(input.id ? '目标已更新' : '目标已创建')
  } catch (error) {
    ElMessage.error(error.message || '目标保存失败')
  }
}

async function createTaskForGoal(goalId) {
  try {
    const { value } = await ElMessageBox.prompt('输入任务标题', '新增目标任务', {
      inputPlaceholder: '下一步要完成什么？',
      inputValidator: text => Boolean(String(text || '').trim()) || '请输入任务标题'
    })
    taskStore.createTask({ title: value, goalId: String(goalId), parentTaskId: null })
    mobileTab.value = 'tasks'
    ElMessage.success('任务已创建')
  } catch (action) {
    if (action !== 'cancel' && action !== 'close') ElMessage.error(action?.message || '任务创建失败')
  }
}

async function createChildTask(parentTaskId) {
  const parent = taskStore.byId(parentTaskId)
  if (!parent) return
  try {
    const { value } = await ElMessageBox.prompt('输入子任务标题', '新增子任务', {
      inputValidator: text => Boolean(String(text || '').trim()) || '请输入任务标题'
    })
    taskStore.createTask({ title: value, parentTaskId: parent.id })
    ElMessage.success('子任务已创建')
  } catch (action) {
    if (action !== 'cancel' && action !== 'close') ElMessage.error(action?.message || '子任务创建失败')
  }
}

function toggleTask(id) {
  try { taskStore.toggleTask(id) } catch (error) { ElMessage.error(error.message) }
}

async function moveGoal(id) {
  try {
    const { value } = await ElMessageBox.prompt('输入新父目标ID；留空移动到根级', '移动目标')
    goalStore.moveGoal(id, String(value || '').trim() || null)
    ElMessage.success('目标已移动')
  } catch (action) {
    if (action !== 'cancel' && action !== 'close') ElMessage.error(action?.message || '目标移动失败')
  }
}

async function removeGoal(id) {
  const affectedGoalIds = new Set([String(id), ...getDescendantIds(goalStore.goals, id, 'parentGoalId')])
  const childGoalCount = affectedGoalIds.size - 1
  const taskCount = taskStore.tasks.filter(task => task.goalId != null && affectedGoalIds.has(String(task.goalId))).length
  let mode = 'promote'
  try {
    await ElMessageBox.confirm(
      `将影响 ${childGoalCount} 个子目标、${taskCount} 个任务。请选择处理方式。`,
      '删除目标',
      {
        type: 'warning',
        distinguishCancelAndClose: true,
        confirmButtonText: '提升并删除',
        cancelButtonText: '级联删除'
      }
    )
  } catch (action) {
    if (action === 'cancel') mode = 'cascade'
    else return
  }
  try {
    deleteGoal({ goalId: id, mode, goalStore, taskStore })
    storedSelectedId.value = null
    saveUiState()
    router.push('/goals')
    ElMessage.success('目标已删除')
  } catch (error) {
    ElMessage.error(error?.message || '目标删除失败')
  }
}
</script>

<style scoped>
.goals-page { min-height: 100%; box-sizing: border-box; padding: 20px; color: #1f2937; background: #f8fafc; }
.page-header { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-bottom: 18px; }
.page-header h1 { margin: 0; font-size: 24px; line-height: 1.3; }
.page-header p { margin: 5px 0 0; color: #64748b; font-size: 13px; }
.header-actions { display: flex; gap: 8px; }
.recovery-banner { display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 12px; border: 1px solid #fde68a; border-radius: 8px; padding: 8px 12px; background: #fffbeb; color: #92400e; font-size: 13px; }
.error-banner { border-color: #fecaca; background: #fef2f2; color: #991b1b; }
.workspace-shell { display: grid; grid-template-columns: 280px minmax(420px, 1fr) 360px; align-items: start; gap: 14px; }
.panel-card { min-width: 0; overflow: hidden; border: 1px solid #e5e7eb; border-radius: 12px; background: white; box-shadow: 0 1px 3px rgba(15,23,42,.06); }
.tree-panel { position: sticky; top: 12px; display: grid; gap: 12px; padding: 16px; max-height: calc(100vh - 128px); overflow: auto; }
.panel-heading { display: flex; align-items: center; justify-content: space-between; }
.panel-heading span { display: grid; place-items: center; min-width: 24px; height: 22px; border-radius: 99px; background: #eff6fc; color: #2564cf; font-size: 12px; }
.tasks-panel { position: sticky; top: 12px; max-height: calc(100vh - 128px); overflow: auto; }
.page-state { display: grid; place-items: center; min-height: 480px; border: 1px solid #e5e7eb; border-radius: 12px; background: white; }
.mobile-detail, .mobile-tree-button { display: none; }
@media (max-width: 1280px) {
  .workspace-shell { grid-template-columns: 260px minmax(400px, 1fr) 320px; }
}
@media (max-width: 1279px) {
  .tree-panel, .detail-panel, .tasks-panel { display: none; }
  .workspace-shell { display: block; }
  .mobile-detail, .mobile-tree-button { display: block; }
  .mobile-detail :deep(.el-tabs__content) { overflow: visible; }
}
@media (max-width: 640px) {
  .goals-page { padding: 14px; }
  .page-header { align-items: flex-start; }
  .page-header p { display: none; }
  .page-header h1 { font-size: 21px; }
}
</style>
