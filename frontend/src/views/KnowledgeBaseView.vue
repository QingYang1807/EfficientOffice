<template>
  <div class="kb-container">
    <div class="kb-sidebar">
      <el-tree
        :data="docTree"
        :props="defaultProps"
        @node-click="handleNodeClick"
      >
        <template #default="{ node }">
          <div class="tree-node">
            <el-icon><folder /></el-icon>
            <span>{{ node.label }}</span>
          </div>
        </template>
      </el-tree>
    </div>
    
    <div class="kb-main">
      <div class="kb-toolbar">
        <el-button-group>
          <el-button @click="createDoc">新建文档</el-button>
          <el-button @click="createFolder">新建文件夹</el-button>
        </el-button-group>
        
        <el-input
          v-model="searchQuery"
          placeholder="搜索文档"
          prefix-icon="Search"
          style="width: 200px"
        />
      </div>
      
      <div class="kb-editor" v-if="currentDoc">
        <el-input v-model="currentDoc.title" placeholder="文档标题" />
        
        <md-editor
          v-model="currentDoc.content"
          height="70vh"
          @save="saveDoc"
          @upload-img="handleUploadImage"
          :toolbars="toolbars"
        />
        
        <div class="doc-meta">
          <span>最后编辑: {{ formatDate(currentDoc.updatedAt) }}</span>
          <el-tag size="small">{{ currentDoc.category }}</el-tag>
        </div>
      </div>
      
      <div v-else class="empty-state">
        <el-empty description="选择或创建一个文档" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Folder, Search } from '@element-plus/icons-vue'

// 工具栏配置
const toolbars = [
  'bold',
  'underline',
  'italic',
  'strikethrough',
  'sub',
  'sup',
  'quote',
  'unorderedList',
  'orderedList',
  'codeRow',
  'code',
  'link',
  'image',
  'table',
  'save'
]

// 添加必要的响应式数据
const docTree = ref([])
const searchQuery = ref('')
const currentDoc = ref(null)

// 树形控件的属性配置
const defaultProps = {
  children: 'children',
  label: 'name'
}

// 处理节点点击
const handleNodeClick = (node) => {
  // 处理文档节点点击逻辑
  console.log('节点点击:', node)
}

// 创建新文档
const createDoc = () => {
  // 实现创建文档的逻辑
}

// 创建新文件夹
const createFolder = () => {
  // 实现创建文件夹的逻辑
}

// 保存文档
const saveDoc = () => {
  // 实现保存文档的逻辑
}

// 格式化日期
const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString()
}

// 处理图片上传
const handleUploadImage = async (event, insertImage, files) => {
  // 这里处理图片上传逻辑
  try {
    // TODO: 实现图片上传到服务器
    const url = 'uploaded_image_url'
    insertImage({
      url,
      desc: '图片描述'
    })
  } catch (error) {
    console.error('图片上传失败:', error)
  }
}
</script>

<style scoped>
.kb-container {
  display: flex;
  height: 100%;
  gap: 20px;
}

.kb-sidebar {
  width: 250px;
  border-right: 1px solid var(--el-border-color-light);
}

.kb-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.kb-editor {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: calc(100vh - 180px);
}

:deep(.v-md-editor) {
  flex: 1;
  overflow: hidden;
}

/* ... 更多样式 ... */
</style> 