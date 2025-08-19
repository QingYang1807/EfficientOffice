<template>
  <div class="custom-node" :class="{ selected: selected }">
    <div class="custom-node-header">
      <div class="node-handle source" data-handleid="source" data-nodeid="id" data-handlepos="top"></div>
    </div>
    <div class="custom-node-content">
      <div v-if="editing">
        <el-input 
          v-model="editLabel" 
          size="small" 
          @blur="finishEditing" 
          @keyup.enter="finishEditing"
          ref="labelInput"
        />
      </div>
      <div v-else class="node-label" @dblclick="startEditing">
        {{ data.label }}
      </div>
      <div class="node-type">{{ nodeType }}</div>
    </div>
    <div class="custom-node-footer">
      <div class="node-handle target" data-handleid="target" data-nodeid="id" data-handlepos="bottom"></div>
    </div>
  </div>
</template>

<script>
import { ref, computed, nextTick } from 'vue';

export default {
  name: 'CustomNode',
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
  emits: ['update:label'],
  setup(props, { emit }) {
    const editing = ref(false);
    const editLabel = ref('');
    const labelInput = ref(null);

    const nodeType = computed(() => {
      // 可以根据节点数据确定节点类型
      return '流程节点';
    });

    const startEditing = () => {
      editLabel.value = props.data.label;
      editing.value = true;
      nextTick(() => {
        labelInput.value.focus();
      });
    };

    const finishEditing = () => {
      editing.value = false;
      if (editLabel.value.trim() !== '') {
        emit('update:label', props.id, editLabel.value);
      }
    };

    return {
      editing,
      editLabel,
      labelInput,
      nodeType,
      startEditing,
      finishEditing
    };
  }
};
</script>

<style scoped>
.custom-node {
  padding: 10px;
  border-radius: 5px;
  background: white;
  border: 1px solid #ddd;
  width: 180px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  font-size: 14px;
  display: flex;
  flex-direction: column;
}

.custom-node.selected {
  border: 1px solid #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.3);
}

.custom-node-header,
.custom-node-footer {
  display: flex;
  justify-content: center;
  padding: 5px 0;
}

.custom-node-content {
  padding: 10px 0;
  text-align: center;
}

.node-handle {
  width: 10px;
  height: 10px;
  background: #ddd;
  border-radius: 50%;
  cursor: crosshair;
}

.node-handle.source {
  background: #4caf50;
}

.node-handle.target {
  background: #f44336;
}

.node-label {
  font-weight: bold;
  margin-bottom: 5px;
  cursor: pointer;
}

.node-type {
  font-size: 12px;
  color: #666;
}
</style> 