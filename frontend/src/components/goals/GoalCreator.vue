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

      <el-form-item label="描述" prop="description">
        <el-input
          v-model="goalForm.description"
          type="textarea"
          rows="4"
          placeholder="请描述你的目标..."
        />
      </el-form-item>

      <el-form-item label="时间范围" required>
        <el-col :span="11">
          <el-form-item prop="startDate">
            <el-date-picker
              v-model="goalForm.startDate"
              type="date"
              placeholder="开始日期"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="2" class="text-center">
          <span class="text-gray-500">-</span>
        </el-col>
        <el-col :span="11">
          <el-form-item prop="deadline">
            <el-date-picker
              v-model="goalForm.deadline"
              type="date"
              placeholder="截止日期"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-form-item>

      <el-form-item label="优先级" prop="priority">
        <el-select v-model="goalForm.priority" placeholder="请选择优先级">
          <el-option label="高" value="high" />
          <el-option label="中" value="medium" />
          <el-option label="低" value="low" />
        </el-select>
      </el-form-item>

      <el-form-item label="子任务">
        <div class="steps-container">
          <div
            v-for="(step, index) in goalForm.steps"
            :key="index"
            class="step-item"
          >
            <el-input v-model="step.title" placeholder="子任务描述" />
            <el-button
              type="danger"
              link
              @click="removeStep(index)"
            >
              删除
            </el-button>
          </div>
          <el-button type="primary" link @click="addStep">
            添加子任务
          </el-button>
        </div>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="submitForm(formRef)">
          创建目标
        </el-button>
        <el-button @click="resetForm(formRef)">重置</el-button>
        <el-button v-if="aiEnabled" type="success" @click="generateWithAI">
          AI 辅助
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits } from 'vue'
import { ElMessage } from 'element-plus'

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
  progress: 0
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
  ]
}

// 添加子任务
const addStep = () => {
  goalForm.value.steps.push({
    title: '',
    completed: false,
    status: 'not_started'
  })
}

// 删除子任务
const removeStep = (index) => {
  goalForm.value.steps.splice(index, 1)
}

// 提交表单
const submitForm = async (formEl) => {
  if (!formEl) return

  await formEl.validate((valid) => {
    if (valid) {
      emit('create', { ...goalForm.value })
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
</script>

<style scoped>
.goal-creator {
  padding: 20px;
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
}

.text-center {
  text-align: center;
  line-height: 32px;
}
</style> 