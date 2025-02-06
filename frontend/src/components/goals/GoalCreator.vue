<template>
  <div class="goal-creator">
    <el-form
      ref="formRef"
      :model="goalForm"
      :rules="rules"
      label-width="100px"
    >
      <el-form-item label="目标名称" prop="title">
        <el-input v-model="goalForm.title" placeholder="请输入目标名称" />
      </el-form-item>

      <el-form-item label="目标类别" prop="category">
        <el-select v-model="goalForm.category" placeholder="请选择目标类别">
          <el-option label="工作" value="work" />
          <el-option label="学习" value="study" />
          <el-option label="生活" value="life" />
          <el-option label="其他" value="other" />
        </el-select>
      </el-form-item>

      <el-form-item label="优先级" prop="priority">
        <el-radio-group v-model="goalForm.priority">
          <el-radio-button label="high">高</el-radio-button>
          <el-radio-button label="medium">中</el-radio-button>
          <el-radio-button label="low">低</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="时间范围" required>
        <el-col :span="11">
          <el-form-item prop="startDate">
            <el-date-picker
              v-model="goalForm.startDate"
              type="date"
              placeholder="开始日期"
              style="width: 100%"
              :disabled-date="disablePastDates"
            />
          </el-form-item>
        </el-col>
        <el-col :span="2" class="text-center">-</el-col>
        <el-col :span="11">
          <el-form-item prop="deadline">
            <el-date-picker
              v-model="goalForm.deadline"
              type="date"
              placeholder="截止日期"
              style="width: 100%"
              :disabled-date="(date) => disableDates(date, goalForm.startDate)"
            />
          </el-form-item>
        </el-col>
      </el-form-item>

      <el-form-item label="描述" prop="description">
        <el-input
          v-model="goalForm.description"
          type="textarea"
          rows="4"
          placeholder="请描述你的目标..."
        />
      </el-form-item>

      <div class="sub-tasks-section">
        <h3>子任务列表</h3>
        <div class="steps-container">
          <el-form-item
            v-for="(step, index) in goalForm.steps"
            :key="index"
            :prop="`steps.${index}.title`"
            :rules="stepRules.title"
          >
            <div class="step-item">
              <el-input
                v-model="step.title"
                placeholder="子任务名称"
                style="width: 200px"
              />
              <el-input
                v-model="step.criteria"
                placeholder="完成标准"
                style="width: 200px"
              />
              <el-date-picker
                v-model="step.deadline"
                type="date"
                placeholder="截止日期"
              />
              <el-input-number
                v-model="step.weight"
                :min="0"
                :max="100"
                placeholder="权重"
              />
              <el-button type="danger" link @click="removeStep(index)">
                删除
              </el-button>
            </div>
          </el-form-item>
          <el-button type="primary" link @click="addStep">
            <el-icon><Plus /></el-icon> 添加子任务
          </el-button>
        </div>
      </div>

      <el-form-item>
        <el-button type="primary" @click="submitForm(formRef)">
          创建目标
        </el-button>
        <el-button @click="resetForm(formRef)">重置</el-button>
        <el-button 
          v-if="aiEnabled" 
          type="success" 
          @click="generateWithAI"
          :loading="aiLoading"
        >
          AI 辅助
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

defineProps({
  aiEnabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['create', 'cancel'])

const formRef = ref(null)

// 表单数据
const goalForm = ref({
  title: '',
  description: '',
  startDate: '',
  deadline: '',
  priority: 'medium',
  steps: [],
  status: 'not_started',
  progress: 0,
  year: new Date().getFullYear(),
  category: '',
  expectedResults: '',
})

// 表单验证规则
const rules = {
  title: [
    { required: true, message: '请输入目标名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入目标描述', trigger: 'blur' }
  ],
  startDate: [
    { type: 'date', required: true, message: '请选择开始日期', trigger: 'change' }
  ],
  deadline: [
    { type: 'date', required: true, message: '请选择截止日期', trigger: 'change' }
  ],
  priority: [
    { required: true, message: '请选择优先级', trigger: 'change' }
  ],
  category: [
    { required: true, message: '请选择目标类别', trigger: 'change' }
  ]
}

// 添加子任务
const addStep = () => {
  goalForm.value.steps.push({
    title: '',
    description: '',
    completed: false,
    status: 'not_started',
    deadline: '',
    criteria: '',
    weight: 0,
  })
}

// 删除子任务
const removeStep = (index) => {
  goalForm.value.steps.splice(index, 1)
}

// 添加 AI 加载状态
const aiLoading = ref(false)

// 日期禁用函数
const disablePastDates = (date) => {
  return date < new Date(new Date().setHours(0, 0, 0, 0))
}

const disableDates = (date, startDate) => {
  if (!startDate) return disablePastDates(date)
  return date < startDate
}

// 生成唯一ID
const generateId = () => {
  return 'goal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

// 提交表单
const submitForm = async (formEl) => {
  if (!formEl) return

  await formEl.validate((valid) => {
    if (valid) {
      // 添加必要的字段
      const newGoal = {
        ...goalForm.value,
        id: generateId(), // 生成唯一ID
        status: 'not_started',
        progress: 0,
        createdAt: new Date().toISOString(),
        steps: goalForm.value.steps.map((step, index) => ({
          ...step,
          id: `step_${index}_${Date.now()}`,
          completed: false,
          status: 'not_started'
        }))
      }
      
      emit('create', newGoal)
      ElMessage.success('目标创建成功')
      resetForm(formEl)
    } else {
      ElMessage.error('请完善表单信息')
    }
  })
}

// 重置表单
const resetForm = (formEl) => {
  if (!formEl) return
  formEl.resetFields()
  goalForm.value.steps = []
}

// AI 辅助生成
const generateWithAI = () => {
  // TODO: 实现 AI 辅助生成功能
  ElMessage.info('AI 辅助功能开发中...')
}

// 添加日期验证
const validateDates = (rule, value, callback) => {
  if (goalForm.value.startDate && goalForm.value.deadline) {
    if (goalForm.value.startDate > goalForm.value.deadline) {
      callback(new Error('开始日期不能晚于截止日期'))
    } else {
      callback()
    }
  }
  callback()
}

// 子任务表单验证
const stepRules = {
  title: [{ required: true, message: '请输入子任务名称', trigger: 'blur' }],
  criteria: [{ required: true, message: '请设置完成标准', trigger: 'blur' }],
  deadline: [{ required: true, message: '请设置截止日期', trigger: 'change' }],
  weight: [{ 
    required: true,
    type: 'number',
    min: 0,
    max: 100,
    message: '权重需在0-100之间',
    trigger: 'change'
  }]
}
</script>

<style scoped>
.goal-creator {
  padding: 20px;
}

.sub-tasks-section {
  margin: 20px 0;
  padding: 20px;
  background: var(--el-bg-color-page);
  border-radius: 8px;
}

.sub-tasks-section h3 {
  margin-bottom: 20px;
  color: var(--el-text-color-primary);
}

.steps-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.step-item {
  display: flex;
  gap: 1rem;
  align-items: center;
  padding: 10px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.text-center {
  text-align: center;
  line-height: 32px;
}

/* 响应式调整 */
@media screen and (max-width: 768px) {
  .step-item {
    flex-direction: column;
    align-items: stretch;
  }
  
  .step-item > * {
    width: 100% !important;
    margin-bottom: 10px;
  }
}
</style> 