<template>
  <div class="reviews-container">
    <div class="page-header">
      <h2>复盘记录</h2>
      <el-button type="primary" @click="openReviewDialog">
        <el-icon><plus /></el-icon>新建复盘
      </el-button>
    </div>

    <!-- 复盘类型筛选 -->
    <div class="filter-section">
      <el-radio-group v-model="reviewType" size="large">
        <el-radio-button label="all">全部</el-radio-button>
        <el-radio-button label="daily">日复盘</el-radio-button>
        <el-radio-button label="weekly">周复盘</el-radio-button>
        <el-radio-button label="monthly">月复盘</el-radio-button>
      </el-radio-group>
    </div>

    <!-- 复盘列表 -->
    <el-timeline>
      <el-timeline-item
        v-for="review in filteredReviews"
        :key="review.id"
        :timestamp="getReviewTimeRange(review)"
        :type="getReviewType(review.type)"
      >
        <el-card class="review-item">
          <template #header>
            <div class="review-item-header">
              <el-tag :type="getReviewTagType(review.type)">
                {{ getReviewTypeText(review) }}
              </el-tag>
              <span class="review-title">{{ review.title }}</span>
              <div class="review-actions">
                <el-button type="primary" link @click="editReview(review)">
                  编辑
                </el-button>
                <el-button type="danger" link @click="deleteReview(review)">
                  删除
                </el-button>
              </div>
            </div>
          </template>
          <div class="review-content">
            <div v-if="review.achievements" class="review-section">
              <h4>🎯 主要成就</h4>
              <p>{{ review.achievements }}</p>
            </div>
            <div v-if="review.lessons" class="review-section">
              <h4>📝 经验教训</h4>
              <p>{{ review.lessons }}</p>
            </div>
            <div v-if="review.plans" class="review-section">
              <h4>📋 下步计划</h4>
              <p>{{ review.plans }}</p>
            </div>
          </div>
        </el-card>
      </el-timeline-item>
    </el-timeline>

    <!-- 复盘表单对话框 -->
    <el-dialog
      v-model="reviewDialogVisible"
      :title="dialogTitle"
      width="60%"
    >
      <el-form :model="reviewForm" ref="reviewFormRef" :rules="reviewRules">
        <el-form-item label="复盘类型" prop="type">
          <el-select v-model="reviewForm.type">
            <el-option label="日复盘" value="daily" />
            <el-option label="周复盘" value="weekly" />
            <el-option label="月复盘" value="monthly" />
          </el-select>
        </el-form-item>
        <el-form-item label="复盘标题" prop="title">
          <el-input v-model="reviewForm.title" placeholder="请输入复盘标题" />
        </el-form-item>
        <el-form-item label="主要成就" prop="achievements">
          <el-input
            v-model="reviewForm.achievements"
            type="textarea"
            :rows="3"
            placeholder="记录本阶段的主要成就和进展"
          />
        </el-form-item>
        <el-form-item label="经验教训" prop="lessons">
          <el-input
            v-model="reviewForm.lessons"
            type="textarea"
            :rows="3"
            placeholder="总结经验教训和改进点"
          />
        </el-form-item>
        <el-form-item label="下步计划" prop="plans">
          <el-input
            v-model="reviewForm.plans"
            type="textarea"
            :rows="3"
            placeholder="制定下一阶段的计划和目标"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="reviewDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitReview">
            确认
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useReviewStore } from '@/stores/review'

const reviewStore = useReviewStore()

// 状态
const reviewType = ref('all')
const reviewDialogVisible = ref(false)
const reviewFormRef = ref(null)
const isEditing = ref(false)
const currentReviewId = ref(null)

// 表单数据
const reviewForm = ref({
  type: 'daily',
  title: '',
  achievements: '',
  lessons: '',
  plans: '',
})

// 表单验证规则
const reviewRules = {
  type: [{ required: true, message: '请选择复盘类型', trigger: 'change' }],
  title: [{ required: true, message: '请输入复盘标题', trigger: 'blur' }],
  achievements: [{ required: true, message: '请输入主要成就', trigger: 'blur' }],
  lessons: [{ required: true, message: '请输入经验教训', trigger: 'blur' }],
  plans: [{ required: true, message: '请输入下步计划', trigger: 'blur' }],
}

// 计算属性：对话框标题
const dialogTitle = computed(() => {
  return isEditing.value ? '编辑复盘' : '新建复盘'
})

// 计算属性：根据类型筛选复盘记录
const filteredReviews = computed(() => {
  return reviewStore.getFilteredReviews(reviewType.value)
})

// 监听复盘类型变化，自动生成标题
watch(() => reviewForm.value.type, (newType) => {
  if (!isEditing.value) {  // 只在新建时自动生成标题
    const now = new Date()
    switch (newType) {
      case 'daily':
        reviewForm.value.title = formatDateWithYear(now)
        break
      case 'weekly': {
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - now.getDay() + 1)
        const firstDayOfYear = new Date(now.getFullYear(), 0, 1)
        const weekNumber = Math.ceil((((now - firstDayOfYear) / 86400000) + firstDayOfYear.getDay() + 1) / 7)
        reviewForm.value.title = `${now.getFullYear()}年${now.getMonth() + 1}月 第${weekNumber}周`
        break
      }
      case 'monthly':
        reviewForm.value.title = `${now.getFullYear()}年${now.getMonth() + 1}月`
        break
    }
  }
})

// 添加新的日期格式化函数（带年份）
const formatDateWithYear = (date) => {
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\//g, '年').replace(/-/g, '月') + '日'
}

// 打开新建复盘对话框
const openReviewDialog = () => {
  isEditing.value = false
  currentReviewId.value = null
  const now = new Date()
  const type = reviewType.value === 'all' ? 'daily' : reviewType.value
  
  // 根据类型生成初始标题
  let title = ''
  switch (type) {
    case 'daily':
      title = formatDateWithYear(now)
      break
    case 'weekly': {
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - now.getDay() + 1)
      const firstDayOfYear = new Date(now.getFullYear(), 0, 1)
      const weekNumber = Math.ceil((((now - firstDayOfYear) / 86400000) + firstDayOfYear.getDay() + 1) / 7)
      title = `${now.getFullYear()}年${now.getMonth() + 1}月 第${weekNumber}周`
      break
    }
    case 'monthly':
      title = `${now.getFullYear()}年${now.getMonth() + 1}月`
      break
  }

  reviewForm.value = {
    type,
    title,
    achievements: '',
    lessons: '',
    plans: '',
  }
  reviewDialogVisible.value = true
}

// 编辑复盘
const editReview = (review) => {
  isEditing.value = true
  currentReviewId.value = review.id
  reviewForm.value = { ...review }
  reviewDialogVisible.value = true
}

// 删除复盘
const deleteReview = async (review) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这条复盘记录吗？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    reviewStore.deleteReview(review.id)
    ElMessage.success('删除成功')
  } catch {
    // 用户取消删除
  }
}

// 提交复盘
const submitReview = async () => {
  if (!reviewFormRef.value) return
  
  await reviewFormRef.value.validate((valid) => {
    if (valid) {
      const now = new Date()
      let reviewDate = now
      
      // 根据复盘类型设置日期
      switch (reviewForm.value.type) {
        case 'weekly':
          reviewDate = new Date(now)
          reviewDate.setDate(now.getDate() - now.getDay() + 1)
          break
        case 'monthly':
          reviewDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
      }

      if (isEditing.value) {
        reviewStore.updateReview(currentReviewId.value, {
          ...reviewForm.value,
        })
      } else {
        reviewStore.addReview({
          id: Date.now(),
          ...reviewForm.value,
          date: formatDate(reviewDate),
        })
      }
      
      reviewDialogVisible.value = false
      reviewFormRef.value.resetFields()
      ElMessage.success(isEditing.value ? '更新成功' : '复盘记录已保存')
    }
  })
}

// 辅助函数
const getReviewType = (type) => {
  const typeMap = {
    daily: 'primary',
    weekly: 'success',
    monthly: 'warning',
  }
  return typeMap[type] || 'info'
}

const getReviewTagType = (type) => {
  const typeMap = {
    daily: '',
    weekly: 'success',
    monthly: 'warning',
  }
  return typeMap[type] || 'info'
}

const getReviewTypeText = (review) => {
  const date = new Date(review.date)
  
  switch (review.type) {
    case 'daily':
      return '日复盘'  // 简化标签显示
    case 'weekly': {
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay() + 1)
      const weekEnd = new Date(date)
      weekEnd.setDate(date.getDate() + (7 - date.getDay()))
      const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
      const weekNumber = Math.ceil((((date - firstDayOfYear) / 86400000) + firstDayOfYear.getDay() + 1) / 7)
      return `周复盘 第${weekNumber}周`
    }
    case 'monthly': {
      const monthNames = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二']
      return `月复盘 ${monthNames[date.getMonth()]}月`
    }
    default:
      return '未知类型'
  }
}

// 在 script setup 部分添加以下函数
const getReviewTimeRange = (review) => {
  const date = new Date(review.date)
  
  switch (review.type) {
    case 'daily':
      return formatDate(date)  // 只显示日期
    case 'weekly': {
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay() + 1)
      const weekEnd = new Date(date)
      weekEnd.setDate(date.getDate() + (7 - date.getDay()))
      return `${formatDate(weekStart)} ~ ${formatDate(weekEnd)}`
    }
    case 'monthly': {
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)
      return `${formatDate(monthStart)} ~ ${formatDate(monthEnd)}`
    }
    default:
      return review.date
  }
}

// 添加日期格式化函数
const formatDate = (date) => {
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\//g, '-')
}

// 初始化
onMounted(() => {
  reviewStore.loadReviews()
})
</script>

<style scoped>
.reviews-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 500;
}

.filter-section {
  margin-bottom: 24px;
}

.review-item {
  margin-bottom: 16px;
}

.review-item-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.review-title {
  flex: 1;
  font-weight: 500;
  color: var(--el-text-color-primary);
  font-size: 16px;
  margin-left: 8px;  /* 调整标题与标签的间距 */
}

.review-actions {
  display: flex;
  gap: 8px;
}

.review-content {
  padding: 8px 0;
}

.review-section {
  margin-bottom: 12px;
  text-align: left;  /* 添加左对齐 */
}

.review-section h4 {
  margin: 0 0 8px 0;
  color: var(--el-text-color-regular);
  text-align: left;  /* 添加左对齐 */
}

.review-section p {
  margin: 0;
  color: var(--el-text-color-primary);
  line-height: 1.5;
  text-align: left;  /* 添加左对齐 */
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 修改时间戳样式 */
.el-timeline-item__timestamp {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  font-weight: normal;
}

/* 让时间范围在小屏幕上也能完整显示 */
@media screen and (max-width: 768px) {
  .el-timeline-item__timestamp {
    word-break: keep-all;
    white-space: nowrap;
  }
}

/* 修改标签样式 */
.el-tag {
  min-width: 80px;  /* 减小标签宽度 */
  padding: 0 12px;
  text-align: center;
  font-size: 13px;
  height: 28px;
  line-height: 26px;
}
</style> 