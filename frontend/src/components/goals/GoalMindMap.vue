<template>
  <div class="mind-map-container">
    <div class="mind-map" ref="mindMapContainer"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, defineProps, defineEmits } from 'vue'
import MindMap from 'simple-mind-map'

const props = defineProps({
  goals: {
    type: Array,
    required: true,
    default: () => []
  }
})

const emit = defineEmits(['node-click'])
const mindMapContainer = ref(null)
let mindMap = null

// 将目标数据转换为思维导图数据结构
const transformGoalsToMindMap = (goals) => {
  return {
    data: {
      text: '目标总览',
      expand: true,
      isActive: false,
      children: (goals || []).map(goal => ({
        text: goal.title || '',
        id: goal.id,
        expand: true,
        isActive: false,
        children: (goal.steps || []).map(step => ({
          text: step.title || '',
          id: `${goal.id}-step-${step.id}`,
          expand: true,
          isActive: false,
          style: {
            color: step.completed ? '#67C23A' : '#909399'
          }
        }))
      }))
    }
  }
}

// 调整视图以适应内容
const adjustView = () => {
  try {
    if (mindMap) {
      mindMap.command.execute('resetLayout')
      mindMap.render()
      // 居中显示
      const viewData = mindMap.view
      if (viewData) {
        const { clientWidth, clientHeight } = mindMapContainer.value
        const scale = Math.min(
          clientWidth / (viewData.width || 800),
          clientHeight / (viewData.height || 600)
        )
        mindMap.view.scale = Math.min(Math.max(0.5, scale), 2)
        mindMap.render()
      }
    }
  } catch (error) {
    console.error('Adjust view error:', error)
  }
}

// 初始化思维导图
const initMindMap = () => {
  if (!mindMapContainer.value) return

  try {
    const data = transformGoalsToMindMap(props.goals)
    
    // 创建思维导图实例
    mindMap = new MindMap({
      el: mindMapContainer.value,
      data: data,
      layout: 'mindMap',
      direction: 2, // 从左到右布局
      theme: {
        template: 'classic',
        config: {
          backgroundColor: '#fff',
          lineColor: '#91d5ff',
          lineWidth: 2,
          fontSize: 14,
          fontFamily: 'Arial',
          color: '#333'
        }
      },
      width: mindMapContainer.value.clientWidth || 800,
      height: mindMapContainer.value.clientHeight || 600,
      xGap: 20,
      yGap: 20,
      mousewheelAction: 'zoom',
      enableFreeDrag: true,
      textOverflow: 'ellipsis'
    })

    // 注册节点点击事件
    mindMap.on('node_click', (node) => {
      try {
        if (!node || !node.data) return
        const goalId = node.data.id
        if (!goalId) return
        const goal = props.goals.find(g => g.id === goalId)
        if (goal) {
          emit('node-click', goal)
        }
      } catch (error) {
        console.error('Node click error:', error)
      }
    })

    // 等待 DOM 更新后渲染
    setTimeout(() => {
      mindMap.render()
      adjustView()
    }, 0)
  } catch (error) {
    console.error('Mind map initialization error:', error)
  }
}

// 清理思维导图实例
const cleanupMindMap = () => {
  try {
    if (mindMap) {
      mindMap.off('node_click') // 移除特定事件监听
      mindMap.destroy()
      mindMap = null
    }
  } catch (error) {
    console.error('Mind map cleanup error:', error)
  }
}

// 处理窗口大小变化
const handleResize = () => {
  if (mindMap && mindMapContainer.value) {
    const { clientWidth, clientHeight } = mindMapContainer.value
    mindMap.resize(clientWidth, clientHeight)
    adjustView()
  }
}

onMounted(() => {
  initMindMap()
  window.addEventListener('resize', handleResize)
})

// 监听goals变化更新图表
watch(() => props.goals, (newGoals) => {
  try {
    if (mindMap) {
      const data = transformGoalsToMindMap(newGoals)
      mindMap.setData(data)
      // 等待数据更新后重新渲染
      setTimeout(() => {
        mindMap.render()
        adjustView()
      }, 0)
    }
  } catch (error) {
    console.error('Mind map update error:', error)
  }
}, { deep: true })

// 使用 onBeforeUnmount 替代 onUnmounted
onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  cleanupMindMap()
})
</script>

<style scoped>
.mind-map-container {
  width: 100%;
  height: 100%;
  min-height: 600px;
  position: relative;
  overflow: hidden;
}

.mind-map {
  width: 100%;
  height: 100%;
  min-height: 600px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  background: #fff;
}
</style> 