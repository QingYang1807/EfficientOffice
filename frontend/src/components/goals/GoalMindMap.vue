<template>
  <section class="mind-map-panel" aria-label="目标思维导图">
    <div v-if="!goals.length" class="empty-state">暂无目标</div>
    <div v-else ref="mindMapContainer" class="mind-map" />
  </section>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import MindMap from 'simple-mind-map'

const props = defineProps({ goals: { type: Array, default: () => [] } })
const emit = defineEmits(['node-click'])
const mindMapContainer = ref(null)
let mindMap = null

const toMindMap = nodes => (nodes || []).map(goal => ({
  id: String(goal.id),
  text: goal.title || '未命名目标',
  progress: Number(goal.progress) || 0,
  expand: true,
  children: toMindMap(goal.children || [])
}))

function dataFor(nodes) {
  return {
    data: {
      text: '目标', expand: true,
      style: { color: '#2564cf', fontSize: '18px', fontWeight: 'bold' },
      children: toMindMap(nodes)
    }
  }
}

function initialize() {
  if (!mindMapContainer.value || !props.goals.length) return
  mindMap = new MindMap({
    el: mindMapContainer.value,
    data: dataFor(props.goals),
    layout: 'logicalStructure',
    theme: { template: 'classic', config: { backgroundColor: '#fff', lineColor: '#cbd5e1', color: '#1f2937' } },
    mousewheelAction: 'zoom',
    enableFreeDrag: true,
    enableAnimation: true
  })
  mindMap.on('node_click', node => {
    const id = node?.data?.id
    if (id != null) emit('node-click', String(id))
  })
  mindMap.render()
}

function dispose() {
  if (!mindMap) return
  mindMap.off('node_click')
  mindMap.destroy()
  mindMap = null
}

function resize() { mindMap?.resize(mindMapContainer.value?.clientWidth || 800, mindMapContainer.value?.clientHeight || 600) }

onMounted(() => { initialize(); window.addEventListener('resize', resize) })
watch(() => props.goals, goals => {
  if (mindMap) mindMap.setData(dataFor(goals))
  else initialize()
}, { deep: true })
onBeforeUnmount(() => { window.removeEventListener('resize', resize); dispose() })

defineExpose({ toMindMap })
</script>

<style scoped>
.mind-map-panel { min-height: 560px; overflow: hidden; border: 1px solid #e5e7eb; border-radius: 12px; background: #fff; box-shadow: 0 1px 3px rgba(15,23,42,.08); }
.mind-map { width: 100%; height: 620px; }
.empty-state { display: grid; min-height: 420px; place-items: center; color: #6b7280; }
</style>
