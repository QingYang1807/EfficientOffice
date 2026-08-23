<template>
  <div ref="goalTreeRef" class="goal-tree" aria-label="目标层级">
    <el-tree
      ref="treeRef"
      :data="treeData"
      node-key="id"
      :current-node-key="selectedId"
      :default-expanded-keys="defaultExpandedKeys"
      highlight-current
      :expand-on-click-node="false"
      @node-click="handleSelect"
      @node-expand="handleExpand"
      @node-collapse="handleCollapse"
    >
      <template #default="{ data, node }">
        <div
          v-if="data.repairGroup"
          class="repair-label"
          data-testid="repair-group"
        >
          <el-icon><Warning /></el-icon>
          <span>待修复</span>
        </div>
        <div
          v-else
          class="goal-node"
          tabindex="0"
          role="treeitem"
          :aria-selected="String(selectedId) === String(data.id)"
          :aria-expanded="data.children?.length ? Boolean(node?.expanded) : undefined"
          :data-testid="`goal-node-${data.id}`"
          @keydown="handleKeydown($event, data, node)"
        >
          <span class="goal-title" :title="data.title">{{ data.title }}</span>
          <span v-if="data.progress != null" class="goal-progress">{{ data.progress }}%</span>
          <span class="goal-actions" @click.stop>
            <button
              type="button"
              class="node-action"
              :data-testid="`add-child-${data.id}`"
              :aria-label="`为${data.title}新增子目标`"
              @click="$emit('create-child', data.id)"
            >+</button>
            <button
              type="button"
              class="node-action"
              :data-testid="`add-task-${data.id}`"
              :aria-label="`为${data.title}新增任务`"
              @click="$emit('create-task', data.id)"
            >✓</button>
            <button
              type="button"
              class="node-action"
              :aria-label="`移动${data.title}`"
              @click="$emit('move', data.id)"
            >↗</button>
            <button
              type="button"
              class="node-action danger"
              :aria-label="`删除${data.title}`"
              @click="$emit('delete', data.id)"
            >×</button>
          </span>
        </div>
      </template>
    </el-tree>
    <el-empty v-if="!treeData.length" description="暂无目标" :image-size="72" />
  </div>
</template>

<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { Warning } from '@element-plus/icons-vue'

const props = defineProps({
  goals: { type: Array, default: () => [] },
  selectedId: { type: String, default: null },
  search: { type: String, default: '' },
  expandedIds: { type: Array, default: () => [] }
})

const emit = defineEmits([
  'select', 'create-child', 'create-task', 'move', 'delete', 'update:expandedIds'
])
const treeRef = ref(null)
const goalTreeRef = ref(null)
const localExpandedIds = reactive(new Set(props.expandedIds.map(String)))

watch(() => props.expandedIds, ids => {
  localExpandedIds.clear()
  ids.map(String).forEach(id => localExpandedIds.add(id))
}, { deep: true })

const records = computed(() => props.goals.map(goal => ({
  ...goal,
  id: String(goal.id),
  parentGoalId: goal.parentGoalId == null ? null : String(goal.parentGoalId)
})))

const treeData = computed(() => {
  const items = records.value
  const byId = new Map(items.map(item => [item.id, item]))
  const orphanIds = new Set(items
    .filter(item => item.parentGoalId != null && !byId.has(item.parentGoalId))
    .map(item => item.id))
  const query = props.search.trim().toLocaleLowerCase()
  const visible = new Set()

  if (!query) items.forEach(item => visible.add(item.id))
  else {
    for (const item of items) {
      if (!String(item.title || '').toLocaleLowerCase().includes(query)) continue
      visible.add(item.id)
      let parentId = item.parentGoalId
      const seen = new Set([item.id])
      while (parentId != null && byId.has(parentId) && !seen.has(parentId)) {
        visible.add(parentId)
        seen.add(parentId)
        parentId = byId.get(parentId).parentGoalId
      }
    }
  }

  // Broken records remain visible even when a search is active so users never
  // lose the recovery path. Descendants of an orphan stay with that subtree.
  const repairVisible = new Set(orphanIds)
  let added = true
  while (added) {
    added = false
    for (const item of items) {
      if (item.parentGoalId != null && repairVisible.has(item.parentGoalId) && !repairVisible.has(item.id)) {
        repairVisible.add(item.id)
        added = true
      }
    }
  }
  repairVisible.forEach(id => visible.add(id))

  const childrenByParent = new Map()
  for (const item of items) {
    if (!visible.has(item.id)) continue
    const parentId = orphanIds.has(item.id) ? '__repair__' : item.parentGoalId
    childrenByParent.set(parentId, [...(childrenByParent.get(parentId) || []), item])
  }
  const makeNodes = (parentId, lineage = new Set()) => (childrenByParent.get(parentId) || [])
    .filter(item => !lineage.has(item.id))
    .map(item => ({
      ...item,
      children: makeNodes(item.id, new Set(lineage).add(item.id))
    }))

  const roots = makeNodes(null)
  const repairChildren = makeNodes('__repair__')
  if (repairChildren.length) {
    roots.push({ id: '__repair__', title: '待修复', repairGroup: true, children: repairChildren })
  }
  return roots
})

const defaultExpandedKeys = computed(() => {
  const ids = new Set(props.expandedIds.map(String))
  if (props.search.trim()) {
    const visit = node => {
      if (node.children?.length) ids.add(node.id)
      node.children?.forEach(visit)
    }
    treeData.value.forEach(visit)
  }
  if (treeData.value.some(node => node.id === '__repair__')) ids.add('__repair__')
  return [...ids]
})

watch(defaultExpandedKeys, keys => {
  keys.forEach(key => treeRef.value?.store?.nodesMap?.[key]?.expand())
}, { flush: 'post' })

function handleSelect(data) {
  if (!data.repairGroup) emit('select', data.id)
}

function updateExpanded(id, expanded) {
  if (id === '__repair__') return
  const ids = new Set(localExpandedIds)
  if (expanded) ids.add(String(id)); else ids.delete(String(id))
  localExpandedIds.clear()
  ids.forEach(value => localExpandedIds.add(value))
  emit('update:expandedIds', [...ids])
}

function handleExpand(data) { updateExpanded(data.id, true) }
function handleCollapse(data) { updateExpanded(data.id, false) }

function focusItem(id) {
  nextTick(() => visibleItems()
    .find(item => item.dataset.testid === `goal-node-${String(id)}`)
    ?.focus())
}

function visibleItems() {
  return [...(goalTreeRef.value?.querySelectorAll('.goal-node') || [])].filter(item => {
    let node = treeRef.value?.getNode?.(item.dataset.testid?.slice('goal-node-'.length))
    while (node?.parent && node.parent.level > 0) {
      if (!node.parent.expanded) return false
      node = node.parent
    }
    return true
  })
}

function handleKeydown(event, data, slotNode) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    emit('select', data.id)
    return
  }
  const node = slotNode || treeRef.value?.getNode?.(data.id)
  if (event.key === 'ArrowRight' && node?.childNodes?.length) {
    event.preventDefault()
    if (!node.expanded) node.expand()
    else focusItem(node.childNodes[0].data.id)
    return
  }
  if (event.key === 'ArrowLeft') {
    event.preventDefault()
    if (node?.expanded && node.childNodes?.length) node.collapse()
    else if (node?.parent?.level > 0 && !node.parent.data?.repairGroup) focusItem(node.parent.data.id)
    return
  }
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    const items = visibleItems()
    const index = items.indexOf(event.currentTarget)
    const offset = event.key === 'ArrowDown' ? 1 : -1
    items[index + offset]?.focus()
  }
}
</script>

<style scoped>
.goal-tree { min-height: 180px; }
.goal-tree :deep(.el-tree-node__content) { height: 38px; border-radius: 7px; margin: 1px 0; }
.goal-tree :deep(.el-tree-node__content:hover) { background: #eff6fc; }
.goal-tree :deep(.is-current > .el-tree-node__content) { background: #e8f1fd; color: #2564cf; }
.goal-node { display: flex; align-items: center; width: calc(100% - 8px); min-width: 0; gap: 6px; }
.goal-title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 14px; flex: 1; }
.goal-progress { font-size: 12px; color: #64748b; }
.goal-actions { display: inline-flex; gap: 2px; opacity: 0; visibility: hidden; }
.goal-node:hover .goal-actions, .goal-node:focus-within .goal-actions, .goal-actions:focus-within { opacity: 1; visibility: visible; }
.goal-node:focus-visible { border-radius: 6px; outline: 2px solid #93c5fd; outline-offset: 1px; }
.node-action { width: 24px; height: 24px; padding: 0; border: 0; border-radius: 5px; color: #475569; background: transparent; cursor: pointer; }
.node-action:hover, .node-action:focus-visible { color: #2564cf; background: #dbeafe; outline: none; }
.node-action.danger:hover, .node-action.danger:focus-visible { color: #dc2626; background: #fee2e2; }
.repair-label { display: flex; align-items: center; gap: 6px; color: #b45309; font-weight: 600; font-size: 13px; }
</style>
