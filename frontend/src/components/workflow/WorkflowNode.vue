<template>
  <div 
    class="workflow-node" 
    :class="{ 'configured': data.isConfigured }"
    @click="nodeClick"
  >
    <!-- 输入连接点 -->
    <Handle
      type="target"
      position="left"
      :style="handleStyle"
      class="handle target-handle"
    />

    <div class="node-header">
      <div class="node-icon" :class="[data.iconBg || GetIconBgClass(data.type)]">
        <i v-if="data.icon" class="fas" :class="data.icon"></i>
        <i v-else-if="data.type" :class="GetIconClass(data.type)"></i>
        <i v-else class="fas fa-cube"></i>
      </div>
      <div class="node-title">{{ data.label }}</div>
      <div 
        v-if="data.isConfigured !== undefined" 
        class="node-status" 
        :class="data.isConfigured ? 'status-complete' : 'status-incomplete'"
        :title="data.isConfigured ? '配置完成' : '配置未完成'"
      ></div>
    </div>
    <div v-if="data.description" class="node-description">
      {{ data.description }}
    </div>
    <div v-if="showParams" class="node-params">
      <div v-if="data.input" class="node-param-item">
        <span class="node-param-label">输入:</span>
        <span class="node-param-value">{{ data.input }}</span>
      </div>
      <div v-if="data.output" class="node-param-item">
        <span class="node-param-label">输出:</span>
        <span class="node-param-value">{{ data.output }}</span>
      </div>
    </div>
    <div class="node-actions">
      <button class="edit-button" @click.stop="EditNode" title="编辑节点">
        <i class="fas fa-pencil-alt"></i>
      </button>
    </div>

    <!-- 输出连接点 -->
    <Handle
      type="source"
      position="right"
      :style="handleStyle"
      class="handle source-handle"
    />
  </div>
</template>

<script>
import { Handle } from '@vue-flow/core';

export default {
  name: 'WorkflowNode',
  components: {
    Handle
  },
  props: {
    id: {
      type: String,
      required: true
    },
    data: {
      type: Object,
      required: true
    },
    selected: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      handleStyle: {
        width: '12px',
        height: '12px',
        backgroundColor: '#3b82f6',
        border: '2px solid white'
      }
    };
  },
  computed: {
    showParams() {
      return this.data.input || this.data.output;
    }
  },
  methods: {
    nodeClick(event) {
      // 节点点击事件会冒泡到 VueFlow 的 node-click 事件
    },
    EditNode(event) {
      // 防止事件冒泡，避免触发节点选择
      event.stopPropagation();
      // 发出编辑节点事件，供父组件处理
      this.$emit('edit-node', this.id);
    },
    GetIconClass(type) {
      const iconMap = {
        'data-cleaning': 'fas fa-tint',
        'text-processing': 'fas fa-font',
        'data-validation': 'fas fa-check-circle',
        'quality-check': 'fas fa-exclamation-triangle',
        'mysql': 'fas fa-database',
        'postgresql': 'fas fa-database',
        'rest-api': 'fas fa-cloud'
      };
      return iconMap[type] || 'fas fa-cube';
    },
    GetIconBgClass(type) {
      const bgMap = {
        'data-cleaning': 'bg-blue-500',
        'text-processing': 'bg-green-500',
        'data-validation': 'bg-purple-500',
        'quality-check': 'bg-yellow-500',
        'mysql': 'bg-red-500',
        'postgresql': 'bg-indigo-500',
        'rest-api': 'bg-pink-500'
      };
      return bgMap[type] || 'bg-gray-500';
    }
  },
  mounted() {
    // 检查是否已加载 FontAwesome
    if (!document.getElementById('font-awesome-cdn')) {
      const link = document.createElement('link');
      link.id = 'font-awesome-cdn';
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css';
      document.head.appendChild(link);
    }
  }
}
</script>

<style scoped>
.workflow-node {
  padding: 10px;
  border-radius: 8px;
  background-color: white;
  border: 1px solid #e2e8f0;
  width: 180px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  position: relative;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.workflow-node:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  transform: translateY(-2px);
}

.workflow-node.configured {
  border-color: #3b82f6;
}

.node-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  position: relative;
  text-align: left;
}

.node-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  margin-right: 8px;
  flex-shrink: 0;
}

/* 图标背景颜色 */
.bg-blue-100 {
  background-color: #dbeafe;
  color: #2563eb;
}

.bg-green-100 {
  background-color: #d1fae5;
  color: #059669;
}

.bg-teal-100 {
  background-color: #ccfbf1;
  color: #0d9488;
}

.bg-red-100 {
  background-color: #fee2e2;
  color: #dc2626;
}

.bg-indigo-100 {
  background-color: #e0e7ff;
  color: #4f46e5;
}

.bg-purple-100 {
  background-color: #ede9fe;
  color: #7c3aed;
}

.bg-gray-100 {
  background-color: #f3f4f6;
  color: #4b5563;
}

.node-title {
  font-weight: 500;
  color: #1f2937;
  font-size: 14px;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
  display: flex;
  align-items: center;
  min-height: 24px;
}

.node-status {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  position: absolute;
  top: 0;
  right: 0;
  border: 2px solid white;
}

.status-incomplete {
  background-color: #fbbf24;
}

.status-complete {
  background-color: #34d399;
}

.node-description {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.node-params {
  font-size: 12px;
  color: #6b7280;
  border-top: 1px dashed #e5e7eb;
  padding-top: 8px;
}

.node-param-item {
  display: flex;
  margin-bottom: 4px;
}

.node-param-label {
  color: #4b5563;
  font-weight: 500;
  margin-right: 4px;
}

.node-param-value {
  color: #1f2937;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 添加节点操作按钮样式 */
.node-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: none;
}

.workflow-node:hover .node-actions {
  display: block;
}

.edit-button {
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.edit-button:hover {
  background-color: #2563eb;
}

/* 连接点样式 */
.handle {
  opacity: 0;
  transition: opacity 0.2s;
  cursor: crosshair;
}

.workflow-node:hover .handle {
  opacity: 1;
}

.source-handle {
  right: -6px;
}

.target-handle {
  left: -6px;
}

/* 鼠标悬停时的样式 */
.handle:hover {
  transform: scale(1.2);
  transition: transform 0.2s, background-color 0.2s;
}
</style> 