<template>
  <div class="task-suggestions">
    <div class="section-header">
      <el-icon><List /></el-icon>
      <span>建议的子任务 ({{ tasks.length }})</span>
    </div>
    
    <el-scrollbar height="400px">
      <div class="tasks-timeline">
        <div v-for="(task, index) in tasks" 
          :key="index"
          class="task-card"
          :class="{ selected: selectedTasks.includes(index) }"
        >
          <!-- 时间线节点 -->
          <div class="timeline-node">
            <div class="node-number">{{ index + 1 }}</div>
            <div class="node-line" v-if="index < tasks.length - 1"></div>
          </div>
          
          <!-- 任务内容 -->
          <el-checkbox 
            :label="index"
            v-model="selectedTasks"
            class="task-checkbox"
          >
            <div class="task-content">
              <!-- 任务头部 -->
              <div class="task-header">
                <h4>{{ task.name }}</h4>
                <div class="task-meta">
                  <el-tag 
                    :type="getPriorityType(task.priority)"
                    effect="dark"
                    size="small"
                  >
                    {{ task.priority }}优先级
                  </el-tag>
                  <span class="estimated-time">
                    <el-icon><Timer /></el-icon>
                    {{ task.estimatedTime }}
                  </span>
                </div>
              </div>
              
              <!-- 任务步骤 -->
              <div class="task-steps">
                <div class="steps-header">
                  <el-icon><Guide /></el-icon>
                  <span>执行步骤</span>
                </div>
                <ol class="steps-list">
                  <li v-for="(step, stepIndex) in task.steps" 
                    :key="stepIndex"
                  >
                    {{ step }}
                  </li>
                </ol>
              </div>
              
              <!-- 任务详情 -->
              <div class="task-details">
                <div class="detail-item completion">
                  <el-icon><Aim /></el-icon>
                  <span>完成标准：{{ task.completionCriteria }}</span>
                </div>
                <div class="detail-item resources">
                  <el-icon><Collection /></el-icon>
                  <div class="resources-list">
                    <el-tag 
                      v-for="(resource, rIndex) in task.resources"
                      :key="rIndex"
                      size="small"
                      class="resource-tag"
                    >
                      {{ resource }}
                    </el-tag>
                  </div>
                </div>
              </div>
            </div>
          </el-checkbox>
        </div>
      </div>
    </el-scrollbar>
  </div>
</template>

<style scoped>
.task-suggestions {
  padding: 20px;
}

.tasks-timeline {
  position: relative;
  padding-left: 40px;
}

.timeline-node {
  position: absolute;
  left: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.node-number {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--el-color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

.node-line {
  width: 2px;
  height: calc(100% - 24px);
  background: #e5e7eb;
  margin-top: 4px;
}

.task-card {
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
}

/* ... 其他样式保持不变 ... */
</style> 