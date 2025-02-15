<template>
  <el-dialog
    :modelValue="modelValue"
    @update:modelValue="$emit('update:modelValue', $event)"
    :title="currentItem ? '编辑' : '添加'"
    width="500px"
  >
    <el-form :model="form" label-width="80px">
      <el-form-item label="标题">
        <el-input v-model="form.title" />
      </el-form-item>
      
      <template v-if="form.type === 'site'">
        <el-form-item label="URL">
          <el-input v-model="form.url" />
        </el-form-item>
        
        <el-form-item label="图标">
          <el-radio-group v-model="form.iconType">
            <el-radio label="url">URL</el-radio>
            <el-radio label="upload">上传</el-radio>
            <el-radio label="random">随机</el-radio>
          </el-radio-group>
          
          <div class="icon-input" v-if="form.iconType === 'url'">
            <el-input v-model="form.icon" />
          </div>
          
          <div class="icon-upload" v-if="form.iconType === 'upload'">
            <el-upload
              class="avatar-uploader"
              action="/api/upload"
              :show-file-list="false"
              :on-success="handleIconUpload"
            >
              <img v-if="form.icon" :src="form.icon" class="avatar">
              <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
            </el-upload>
          </div>
        </el-form-item>
      </template>
    </el-form>
    
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="$emit('update:modelValue', false)">取消</el-button>
        <el-button type="primary" @click="handleConfirm">确定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { Plus } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: Boolean,
  currentItem: Object
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const form = ref({
  type: 'site',
  title: '',
  url: '',
  icon: '',
  iconType: 'url'
})

watch(() => props.currentItem, (newVal) => {
  if (newVal) {
    form.value = { ...newVal }
  } else {
    form.value = {
      type: 'site',
      title: '',
      url: '',
      icon: '',
      iconType: 'url'
    }
  }
}, { immediate: true })

const handleIconUpload = (res) => {
  form.value.icon = res.url
}

const handleConfirm = () => {
  emit('confirm', form.value)
  emit('update:modelValue', false)
}
</script>

<style scoped>
.icon-input {
  margin-top: 10px;
}

.avatar-uploader {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 100px;
  height: 100px;
  margin-top: 10px;
}

.avatar-uploader:hover {
  border-color: var(--el-color-primary);
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 100px;
  height: 100px;
  text-align: center;
  line-height: 100px;
}

.avatar {
  width: 100px;
  height: 100px;
  display: block;
}
</style> 