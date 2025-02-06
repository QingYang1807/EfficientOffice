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

// 添加日期格式化函数
const formatDate = (date) => {
  if (!date) return '未设置'
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 将目标数据转换为思维导图数据结构
const transformGoalsToMindMap = (goals) => {
  console.log('转换目标数据:', goals)
  const currentYear = new Date().getFullYear()
  const result = {
    data: {
      text: `${currentYear}年目标`,
      expand: true,
      isActive: false,
      style: {
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#409EFF'
      },
      children: (goals || []).map(goal => ({
        text: goal.title || '',
        id: goal.id,
        expand: true,
        isActive: false,
        // 增加优先级视觉提示
        style: {
          fontSize: '16px',
          color: getPriorityColor(goal.priority),
          border: `2px solid ${getPriorityColor(goal.priority)}`
        },
        // 添加目标信息提示
        tooltip: `
          优先级: ${goal.priority}
          开始: ${formatDate(goal.startDate)}
          截止: ${formatDate(goal.deadline)}
          进度: ${goal.progress}%
        `,
        children: (goal.steps || []).map(step => ({
          text: step.title || '',
          id: `${goal.id}-step-${step.id}`,
          expand: true,
          isActive: false,
          style: {
            color: step.completed ? '#67C23A' : '#909399',
            fontSize: '14px'
          },
          // 添加子任务信息提示
          tooltip: `
            完成标准: ${step.criteria}
            截止日期: ${formatDate(step.deadline)}
            权重: ${step.weight}%
          `
        }))
      }))
    }
  }
  console.log('转换后的思维导图数据:', result)
  return result
}

// 添加优先级颜色映射
const getPriorityColor = (priority) => {
  const colors = {
    high: '#F56C6C',
    medium: '#E6A23C',
    low: '#67C23A'
  }
  return colors[priority] || '#909399'
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
  console.log('初始化思维导图, 容器:', mindMapContainer.value)
  if (!mindMapContainer.value) return

  try {
    const data = transformGoalsToMindMap(props.goals)
    console.log('思维导图配置:', data)
    
    mindMap = new MindMap({
      el: mindMapContainer.value,
      data: data,
      // 修改为环形布局
      layout: 'circle',
      // 移除 direction 配置，环形布局不需要方向
      theme: {
        template: 'classic',
        config: {
          // 修改主题配置
          backgroundColor: '#fff',
          lineColor: '#91d5ff',
          lineWidth: 2,
          fontSize: 14,
          fontFamily: 'Arial',
          color: '#333',
          // 添加连接线样式
          lineStyle: 'curve',
          // 添加节点样式
          nodeStyle: {
            borderRadius: '50%',
            border: '2px solid #91d5ff',
            padding: '8px 16px'
          }
        }
      },
      width: mindMapContainer.value.clientWidth || 800,
      height: mindMapContainer.value.clientHeight || 600,
      // 调整节点间距
      xGap: 60,
      yGap: 60,
      mousewheelAction: 'zoom',
      enableFreeDrag: true,
      textOverflow: 'ellipsis',
      // 添加动画效果
      enableAnimation: true,
      // 添加节点展开/收起动画
      expandAnimation: {
        enable: true,
        duration: 300
      }
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
  background: linear-gradient(to bottom right, #f0f2f5, #ffffff);
}

.mind-map {
  width: 100%;
  height: 100%;
  min-height: 600px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
}

/* 添加响应式样式 */
@media screen and (max-width: 768px) {
  .mind-map-container,
  .mind-map {
    min-height: 400px;
  }
}
</style> 