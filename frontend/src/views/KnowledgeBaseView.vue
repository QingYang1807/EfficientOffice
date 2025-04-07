<template>
  <div class="h-full flex flex-col relative">
    <!-- 顶部标题区 -->
    <div class="flex-none flex items-center justify-between px-6 py-2 border-b border-gray-100">
      <div class="flex items-center gap-3">
        <div class="w-1 h-6 bg-blue-500 rounded-full"></div>
        <h1 class="text-xl font-medium text-gray-900">知识库 📚</h1>
        <span class="text-sm text-gray-400">{{ currentDate }}</span>
      </div>
      <div class="flex items-center gap-2">
        <a-tag :color="stats.totalFiles > 0 ? 'processing' : 'default'">
          文件 {{ stats.totalFiles }}
        </a-tag>
        <a-tag color="success">
          语料 {{ stats.totalCorpus }}
        </a-tag>
        <a-tag color="warning">
          知识库 {{ stats.totalRag }}
        </a-tag>
      </div>
    </div>

    <!-- 搜索和视图切换区 -->
    <div class="flex-none flex items-center gap-3 px-6 py-2 bg-white border-b border-gray-100">
      <div class="flex-1 max-w-md relative group">
        <a-input
          v-model:value="searchQuery"
          placeholder="搜索知识库内容... (按 '/' 快速搜索)"
          class="search-input"
          :bordered="false"
          @focus="showSearchTips = true"
          @blur="handleSearchBlur"
          @input="handleSearch"
          @pressEnter="onSearch"
        >
          <template #prefix>
            <div class="search-prefix">
              <search-outlined 
                class="search-icon"
                :class="{ 'searching': isSearching }"
              />
            </div>
          </template>
          <template #suffix>
            <div class="search-suffix" v-if="searchQuery">
              <close-circle-outlined
                class="clear-icon"
                @click="clearSearch"
              />
            </div>
          </template>
        </a-input>

        <!-- 搜索提示面板 -->
        <div 
          class="search-tooltip"
          :class="{ 'visible': showSearchTips }"
        >
          <div class="tooltip-header">
            <span class="tooltip-title">搜索技巧</span>
            <span class="tooltip-subtitle">点击标签快速筛选</span>
          </div>
          
          <!-- 分类搜索区域 -->
          <div class="tooltip-section">
            <div class="section-header">
              <folder-outlined class="text-blue-500" />
              <span>按类型筛选</span>
            </div>
            <div class="tooltip-tags">
              <a-tag 
                v-for="type in fileTypes" 
                :key="type.value"
                :color="type.color"
                class="search-tag"
                @click="handleTagClick(type.value)"
              >
                {{ type.label }}
              </a-tag>
            </div>
          </div>

          <!-- 快捷搜索提示 -->
          <div class="tooltip-footer">
            <keyboard-outlined class="text-gray-400" />
            <span>按 <kbd>/</kbd> 快速聚焦搜索框</span>
          </div>
        </div>
      </div>

      <!-- 视图切换 -->
      <div class="flex items-center gap-2">
        <a-radio-group v-model:value="viewMode" button-style="solid" size="small">
          <a-radio-button value="card">
            <appstore-outlined />
            卡片视图
          </a-radio-button>
          <a-radio-button value="list">
            <bars-outlined />
            列表视图
          </a-radio-button>
        </a-radio-group>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="flex-1 flex overflow-hidden">
      <!-- 左侧导航菜单 -->
      <div class="flex-none w-60 border-r border-gray-100 bg-white">
        <a-menu
          mode="inline"
          :selectedKeys="[activeModule]"
          class="border-0 h-full"
          @select="handleModuleChange"
        >
          <a-menu-item key="files" class="py-3">
            <template #icon><file-outlined /></template>
            文件管理
          </a-menu-item>
          <a-menu-item key="corpus" class="py-3">
            <template #icon><read-outlined /></template>
            语料管理
          </a-menu-item>
          <a-menu-item key="rag" class="py-3">
            <template #icon><database-outlined /></template>
            RAG知识库
          </a-menu-item>
        </a-menu>
        
        <!-- 统计数据 -->
        <div class="p-4 border-t border-gray-100">
          <h3 class="text-sm font-medium text-gray-700 mb-3">统计数据</h3>
          <div class="space-y-2">
            <div class="flex justify-between items-center text-sm">
              <span class="text-gray-600">文件总数:</span>
              <span class="font-medium text-blue-500">{{ stats.totalFiles }}</span>
            </div>
            <div class="flex justify-between items-center text-sm">
              <span class="text-gray-600">语料总数:</span>
              <span class="font-medium text-green-500">{{ stats.totalCorpus }}</span>
            </div>
            <div class="flex justify-between items-center text-sm">
              <span class="text-gray-600">知识库总数:</span>
              <span class="font-medium text-orange-500">{{ stats.totalRag }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧内容区域 -->
      <div class="flex-1 overflow-auto p-6">
        <!-- 文件管理模块 -->
        <div v-if="activeModule === 'files'" class="h-full flex flex-col">
          <div class="flex justify-between items-center mb-4">
            <div class="flex items-center gap-2">
              <h2 class="text-lg font-medium text-gray-800">文件管理</h2>
              <a-breadcrumb separator="/">
                <a-breadcrumb-item 
                  v-for="(path, index) in currentPath" 
                  :key="index"
                  @click="navigateTo(index)"
                  :class="{'cursor-pointer hover:text-blue-500': index < currentPath.length - 1}"
                >
                  {{ path }}
                </a-breadcrumb-item>
              </a-breadcrumb>
            </div>
            <div class="flex gap-2">
              <a-button type="primary" @click="showUploadDialog">
                <template #icon><upload-outlined /></template>
                上传文件
              </a-button>
              <a-button @click="createFolder">
                <template #icon><folder-add-outlined /></template>
                创建文件夹
              </a-button>
            </div>
          </div>
          
          <!-- 文件列表/卡片视图 -->
          <div class="flex-1 overflow-hidden">
            <!-- 卡片视图 -->
            <div v-if="viewMode === 'card'" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <a-card 
                v-for="file in filteredFiles" 
                :key="file.id" 
                class="file-card hover:shadow-md transition-all cursor-pointer"
                :class="{ 'bg-gray-50': file.type === 'folder' }"
                hoverable
                @click="handleFileClick(file)"
              >
                <div class="flex flex-col items-center">
                  <div class="text-3xl mb-2" :class="getFileIconColor(file)">
                    <component :is="getFileIconComponent(file)" />
                  </div>
                  <div class="w-full text-center">
                    <div class="font-medium text-gray-800 truncate">{{ file.name }}</div>
                    <div class="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{{ formatDate(file.updatedAt) }}</span>
                      <span>{{ formatSize(file.size) }}</span>
                    </div>
                  </div>
                </div>
                <template #actions>
                  <download-outlined key="download" @click.stop="downloadFile(file)" />
                  <edit-outlined key="edit" @click.stop="renameFile(file)" />
                  <delete-outlined key="delete" @click.stop="deleteFile(file)" />
                </template>
              </a-card>
            </div>
            
            <!-- 列表视图 -->
            <a-table
              v-else
              :dataSource="filteredFiles"
              :columns="fileColumns"
              :pagination="false"
              :scroll="{ y: 'calc(100vh - 280px)' }"
              :bordered="false"
              size="middle"
              class="custom-table"
            >
              <template #bodyCell="{ column, record }">
                <!-- 文件名列 -->
                <template v-if="column.key === 'name'">
                  <div class="flex items-center gap-2 cursor-pointer" @click="handleFileClick(record)">
                    <component :is="getFileIconComponent(record)" :class="getFileIconColor(record)" />
                    <span>{{ record.name }}</span>
                  </div>
                </template>
                
                <!-- 更新时间列 -->
                <template v-else-if="column.key === 'updatedAt'">
                  {{ formatDate(record.updatedAt) }}
                </template>
                
                <!-- 文件大小列 -->
                <template v-else-if="column.key === 'size'">
                  {{ formatSize(record.size) }}
                </template>
                
                <!-- 操作列 -->
                <template v-else-if="column.key === 'action'">
                  <div class="flex gap-2">
                    <a-button type="text" @click.stop="downloadFile(record)">
                      <template #icon><download-outlined /></template>
                    </a-button>
                    <a-button type="text" @click.stop="renameFile(record)">
                      <template #icon><edit-outlined /></template>
                    </a-button>
                    <a-button type="text" @click.stop="deleteFile(record)" danger>
                      <template #icon><delete-outlined /></template>
                    </a-button>
                  </div>
                </template>
              </template>
            </a-table>
          </div>
        </div>

        <!-- 语料管理模块 -->
        <div v-if="activeModule === 'corpus'" class="h-full flex flex-col">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-medium text-gray-800">语料管理</h2>
            <div class="flex gap-2">
              <a-button type="primary" @click="showAddCorpusDialog">
                <template #icon><plus-outlined /></template>
                添加语料
              </a-button>
              <a-button @click="importCorpus">
                <template #icon><import-outlined /></template>
                导入语料
              </a-button>
            </div>
          </div>
          
          <!-- 语料分类标签 -->
          <div class="flex flex-wrap gap-2 mb-4">
            <a-tag 
              v-for="tag in corpusTags" 
              :key="tag.id"
              :color="activeTag === tag.id ? 'blue' : 'default'"
              class="cursor-pointer px-3 py-1"
              @click="filterByTag(tag.id)"
            >
              {{ tag.name }} ({{ tag.count }})
            </a-tag>
            <a-button size="small" @click="showAddTagDialog">
              <template #icon><plus-outlined /></template>
              新建标签
            </a-button>
          </div>
          
          <!-- 语料列表 -->
          <div class="flex-1 overflow-auto grid grid-cols-1 md:grid-cols-2 gap-4">
            <a-card 
              v-for="corpus in filteredCorpus" 
              :key="corpus.id" 
              class="corpus-card"
              hoverable
            >
              <template #title>
                <div class="flex justify-between items-center">
                  <span class="truncate">{{ corpus.title }}</span>
                  <div class="flex gap-1">
                    <a-tag v-for="tag in corpus.tags" :key="tag" size="small" color="blue">
                      {{ tag }}
                    </a-tag>
                  </div>
                </div>
              </template>
              <div class="corpus-content text-gray-600">
                {{ corpus.content.substring(0, 200) }}{{ corpus.content.length > 200 ? '...' : '' }}
              </div>
              <div class="flex justify-between items-center mt-4 pt-2 border-t border-gray-100">
                <span class="text-xs text-gray-500">{{ formatDate(corpus.updatedAt) }}</span>
                <div class="flex gap-2">
                  <a-button type="text" @click="editCorpus(corpus)">
                    <template #icon><edit-outlined /></template>
                  </a-button>
                  <a-button type="text" danger @click="deleteCorpus(corpus)">
                    <template #icon><delete-outlined /></template>
                  </a-button>
                </div>
              </div>
            </a-card>
          </div>
        </div>

        <!-- RAG知识库模块 -->
        <div v-if="activeModule === 'rag'" class="h-full flex flex-col">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-medium text-gray-800">RAG知识库</h2>
            <a-button type="primary" @click="createRagKnowledgeBase">
              <template #icon><plus-outlined /></template>
              创建知识库
            </a-button>
          </div>
          
          <!-- RAG知识库列表 -->
          <div class="flex-1 overflow-auto grid grid-cols-1 md:grid-cols-2 gap-4">
            <a-card 
              v-for="kb in filteredRagKBs" 
              :key="kb.id" 
              class="rag-card"
              hoverable
            >
              <template #title>
                <div class="flex justify-between items-center">
                  <span>{{ kb.name }}</span>
                  <a-tag :color="kb.status === 'active' ? 'success' : 'default'">
                    {{ kb.status === 'active' ? '已激活' : '未激活' }}
                  </a-tag>
                </div>
              </template>
              <div class="rag-info">
                <div class="flex justify-between text-sm text-gray-500 mb-2">
                  <div class="flex items-center gap-1">
                    <file-outlined />
                    <span>{{ kb.documentCount }} 文档</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <clock-circle-outlined />
                    <span>{{ formatDate(kb.updatedAt) }}</span>
                  </div>
                </div>
                <p class="text-gray-600">{{ kb.description }}</p>
              </div>
              <div class="flex justify-between items-center mt-4 pt-2 border-t border-gray-100">
                <a-button type="primary" @click="openRagChat(kb)">
                  <template #icon><message-outlined /></template>
                  提问
                </a-button>
                <a-dropdown>
                  <template #overlay>
                    <a-menu @click="({ key }) => handleRagAction(key, kb)">
                      <a-menu-item key="edit">
                        <edit-outlined /> 编辑
                      </a-menu-item>
                      <a-menu-item key="update">
                        <sync-outlined /> 更新知识库
                      </a-menu-item>
                      <a-menu-item key="export">
                        <export-outlined /> 导出
                      </a-menu-item>
                      <a-menu-divider />
                      <a-menu-item key="delete" danger>
                        <delete-outlined /> 删除
                      </a-menu-item>
                    </a-menu>
                  </template>
                  <a-button>
                    <template #icon><more-outlined /></template>
                  </a-button>
                </a-dropdown>
              </div>
            </a-card>
          </div>
        </div>
      </div>
    </div>

    <!-- 对话框组件 -->
    <!-- 文件上传对话框 -->
    <a-modal
      title="上传文件"
      v-model:visible="uploadDialogVisible"
      :footer="null"
      width="500px"
    >
      <a-upload-dragger
        name="file"
        :multiple="true"
        :action="`${API_BASE_URL}/upload`"
        :data="uploadData"
        @change="handleUploadChange"
      >
        <p class="ant-upload-drag-icon">
          <inbox-outlined />
        </p>
        <p class="ant-upload-text">点击或拖拽文件到此区域上传</p>
        <p class="ant-upload-hint">
          支持各种文档格式，单个文件不超过10MB
        </p>
      </a-upload-dragger>
    </a-modal>

    <!-- 添加语料对话框 -->
    <a-modal
      title="添加语料"
      v-model:visible="corpusDialogVisible"
      @ok="saveCorpus"
      width="700px"
    >
      <a-form :model="corpusForm" layout="vertical">
        <a-form-item label="标题" required>
          <a-input v-model:value="corpusForm.title" placeholder="请输入语料标题" />
        </a-form-item>
        <a-form-item label="内容" required>
          <a-textarea
            v-model:value="corpusForm.content"
            placeholder="请输入语料内容"
            :rows="10"
          />
        </a-form-item>
        <a-form-item label="标签">
          <a-select
            v-model:value="corpusForm.tags"
            mode="tags"
            style="width: 100%"
            placeholder="选择或创建标签"
            :options="availableTags.map(tag => ({ value: tag, label: tag }))"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- RAG知识库创建对话框 -->
    <a-modal
      title="创建RAG知识库"
      v-model:visible="ragDialogVisible"
      @ok="saveRagKnowledgeBase"
      width="700px"
    >
      <a-form :model="ragForm" layout="vertical">
        <a-form-item label="名称" required>
          <a-input v-model:value="ragForm.name" placeholder="请输入知识库名称" />
        </a-form-item>
        <a-form-item label="描述">
          <a-textarea
            v-model:value="ragForm.description"
            placeholder="请输入知识库描述"
            :rows="3"
          />
        </a-form-item>
        <a-form-item label="数据源">
          <a-tabs v-model:activeKey="ragForm.sourceType">
            <a-tab-pane key="files" tab="文件">
              <a-transfer
                v-model:targetKeys="ragForm.selectedFiles"
                :dataSource="transferFiles"
                :titles="['可选文件', '已选文件']"
                :render="item => item.title"
              />
            </a-tab-pane>
            <a-tab-pane key="corpus" tab="语料">
              <a-transfer
                v-model:targetKeys="ragForm.selectedCorpus"
                :dataSource="transferCorpus"
                :titles="['可选语料', '已选语料']"
                :render="item => item.title"
              />
            </a-tab-pane>
          </a-tabs>
        </a-form-item>
        <a-form-item label="嵌入模型">
          <a-select v-model:value="ragForm.embeddingModel" style="width: 100%">
            <a-select-option
              v-for="model in embeddingModels"
              :key="model.id"
              :value="model.id"
            >
              {{ model.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- RAG聊天对话框 -->
    <a-drawer
      :title="activeRagKB ? activeRagKB.name + ' - 知识库对话' : '知识库对话'"
      v-model:visible="ragChatVisible"
      width="800px"
      class="rag-chat-drawer"
    >
      <div class="h-full flex flex-col">
        <div class="flex-1 overflow-auto bg-gray-50 rounded-lg p-4 mb-4">
          <div 
            v-for="(message, index) in chatMessages" 
            :key="index"
            :class="[
              'mb-4 flex', 
              message.role === 'user' ? 'justify-end' : 'justify-start'
            ]"
          >
            <div 
              :class="[
                'max-w-3/4 rounded-lg p-3', 
                message.role === 'user' 
                  ? 'bg-blue-500 text-white rounded-tr-none' 
                  : 'bg-white text-gray-800 rounded-tl-none shadow-sm'
              ]"
            >
              <div class="message-text" v-html="formatMessage(message.content)"></div>
              <div 
                :class="[
                  'text-xs mt-1 text-right', 
                  message.role === 'user' ? 'text-blue-100' : 'text-gray-400'
                ]"
              >
                {{ formatTime(message.timestamp) }}
              </div>
            </div>
          </div>
        </div>
        <div class="flex gap-2">
          <a-textarea
            v-model:value="chatInput"
            placeholder="输入您的问题..."
            :rows="3"
            @pressEnter="sendMessage"
          />
          <a-button type="primary" @click="sendMessage">
            <template #icon><send-outlined /></template>
            发送
          </a-button>
        </div>
      </div>
    </a-drawer>

    <!-- 重命名文件对话框 -->
    <a-modal
      title="重命名文件"
      v-model:visible="renameModalVisible"
      @ok="doRenameFile"
    >
      <a-input 
        v-model:value="newFileName" 
        placeholder="请输入新名称"
        autofocus
      />
    </a-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, reactive, h } from 'vue'
import { message, Modal } from 'ant-design-vue'
import dayjs from 'dayjs'
import axios from 'axios'
import { 
  SearchOutlined,
  FileOutlined,
  FolderOutlined,
  DatabaseOutlined,
  UploadOutlined,
  DownloadOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  InboxOutlined,
  MessageOutlined,
  SendOutlined,
  SyncOutlined,
  MoreOutlined,
  AppstoreOutlined,
  BarsOutlined,
  ReadOutlined,
  ClockCircleOutlined,
  FolderAddOutlined,
  ImportOutlined,
  ExportOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FilePptOutlined,
  FileImageOutlined,
  FileZipOutlined,
  FileTextOutlined,
  KeyboardOutlined,
  CloseCircleOutlined
} from '@ant-design/icons-vue'

// API基础URL
const API_BASE_URL = '/api/knowledge-base'

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 状态
const activeModule = ref('files')
const searchQuery = ref('')
const viewMode = ref('card')
const currentPath = ref(['根目录'])
const stats = ref({
  totalFiles: 0,
  totalCorpus: 0,
  totalRag: 0
})

// 文件数据
const files = ref([])
const fileColumns = [
  {
    title: '文件名',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: '更新时间',
    dataIndex: 'updatedAt',
    key: 'updatedAt',
    width: 180,
  },
  {
    title: '大小',
    dataIndex: 'size',
    key: 'size',
    width: 120,
  },
  {
    title: '操作',
    key: 'action',
    width: 150,
  }
]

// 语料数据
const corpus = ref([])
const corpusTags = ref([])
const activeTag = ref(null)

// RAG知识库数据
const ragKBs = ref([])

// 对话框控制
const uploadDialogVisible = ref(false)
const corpusDialogVisible = ref(false)
const ragDialogVisible = ref(false)
const ragChatVisible = ref(false)

// 表单数据
const corpusForm = ref({
  title: '',
  content: '',
  tags: []
})

const ragForm = ref({
  name: '',
  description: '',
  sourceType: 'files',
  selectedFiles: [],
  selectedCorpus: [],
  embeddingModel: ''
})

// 嵌入模型选项
const embeddingModels = [
  { id: 'openai-ada-002', name: 'OpenAI Ada 002' },
  { id: 'bge-large-zh', name: 'BGE Large Chinese' },
  { id: 'bge-large-en', name: 'BGE Large English' }
]

// 聊天相关
const activeRagKB = ref(null)
const chatMessages = ref([])
const chatInput = ref('')

// 可用标签
const availableTags = ref(['文档', '笔记', '研究', '项目', '参考资料'])

// 搜索相关
const showSearchTips = ref(false)
const isSearching = ref(false)
const fileTypes = [
  { label: '文档', value: 'document', color: 'blue' },
  { label: '图片', value: 'image', color: 'green' },
  { label: '表格', value: 'spreadsheet', color: 'orange' },
  { label: '演示', value: 'presentation', color: 'purple' },
  { label: '压缩包', value: 'archive', color: 'red' },
  { label: '文件夹', value: 'folder', color: 'default' }
]

// 添加引用变量用于对话框
const folderNameRef = ref('')
const fileNameRef = ref('')

// 添加一个状态变量来控制模态框的显示
const renameModalVisible = ref(false);
const fileToRename = ref(null);
const newFileName = ref('');

// 计算属性
const currentDate = computed(() => {
  return new Date().toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
})

// 过滤后的文件列表
const filteredFiles = computed(() => {
  if (!searchQuery.value) {
    return files.value
  }
  
  const query = searchQuery.value.toLowerCase()
  return files.value.filter(file => 
    file.name.toLowerCase().includes(query)
  )
})

// 过滤后的语料列表
const filteredCorpus = computed(() => {
  let result = corpus.value
  
  // 先按标签过滤
  if (activeTag.value) {
    result = result.filter(item => 
      item.tags.includes(activeTag.value)
    )
  }
  
  // 再按搜索词过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(item => 
      item.title.toLowerCase().includes(query) || 
      item.content.toLowerCase().includes(query)
    )
  }
  
  return result
})

// 过滤后的RAG知识库列表
const filteredRagKBs = computed(() => {
  if (!searchQuery.value) {
    return ragKBs.value
  }
  
  const query = searchQuery.value.toLowerCase()
  return ragKBs.value.filter(kb => 
    kb.name.toLowerCase().includes(query) || 
    kb.description.toLowerCase().includes(query)
  )
})

// 用于穿梭框的文件数据
const transferFiles = computed(() => {
  return files.value.map(file => ({
    key: file.id,
    title: file.name,
    description: `${formatDate(file.updatedAt)} - ${formatSize(file.size)}`,
    disabled: file.type === 'folder'
  }))
})

// 用于穿梭框的语料数据
const transferCorpus = computed(() => {
  return corpus.value.map(item => ({
    key: item.id,
    title: item.title,
    description: item.content.substring(0, 50) + (item.content.length > 50 ? '...' : '')
  }))
})

// 上传数据
const uploadData = computed(() => {
  // 如果不是在根目录，需要添加父文件夹ID
  if (currentPath.value.length > 1) {
    const currentFolder = files.value.find(f => 
      f.name === currentPath.value[currentPath.value.length - 1] && 
      f.type === 'folder'
    )
    if (currentFolder) {
      return { parent_id: currentFolder.id }
    }
  }
  return {}
})

// 方法
// 模块切换处理
const handleModuleChange = ({ key }) => {
  activeModule.value = key
}

// 搜索处理
const handleSearch = () => {
  if (searchQuery.value) {
    isSearching.value = true
  } else {
    isSearching.value = false
  }
}

// 搜索框失焦处理
const handleSearchBlur = () => {
  setTimeout(() => {
    showSearchTips.value = false
  }, 200)
}

// 清除搜索
const clearSearch = () => {
  searchQuery.value = ''
  isSearching.value = false
  message.success('已清除搜索')
}

// 执行搜索
const onSearch = () => {
  if (!searchQuery.value.trim()) return
  
  message.success({
    content: '搜索完成 🔍',
    duration: 1
  })
}

// 标签点击处理
const handleTagClick = (value) => {
  searchQuery.value = value
  onSearch()
}

// 文件图标获取
const getFileIconComponent = (file) => {
  if (file.type === 'folder') {
    return FolderOutlined
  }
  
  const ext = file.name.split('.').pop().toLowerCase()
  
  const iconMap = {
    'pdf': FilePdfOutlined,
    'doc': FileWordOutlined,
    'docx': FileWordOutlined,
    'xls': FileExcelOutlined,
    'xlsx': FileExcelOutlined,
    'ppt': FilePptOutlined,
    'pptx': FilePptOutlined,
    'txt': FileTextOutlined,
    'jpg': FileImageOutlined,
    'jpeg': FileImageOutlined,
    'png': FileImageOutlined,
    'gif': FileImageOutlined,
    'zip': FileZipOutlined,
    'rar': FileZipOutlined
  }
  
  return iconMap[ext] || FileOutlined
}

// 获取文件图标颜色
const getFileIconColor = (file) => {
  if (file.type === 'folder') {
    return 'text-blue-500'
  }
  
  const ext = file.name.split('.').pop().toLowerCase()
  
  const colorMap = {
    'pdf': 'text-red-500',
    'doc': 'text-blue-600',
    'docx': 'text-blue-600',
    'xls': 'text-green-600',
    'xlsx': 'text-green-600',
    'ppt': 'text-orange-500',
    'pptx': 'text-orange-500',
    'txt': 'text-gray-600',
    'jpg': 'text-purple-500',
    'jpeg': 'text-purple-500',
    'png': 'text-purple-500',
    'gif': 'text-purple-500',
    'zip': 'text-yellow-600',
    'rar': 'text-yellow-600'
  }
  
  return colorMap[ext] || 'text-gray-500'
}

// 日期格式化
const formatDate = (date) => {
  if (!date) return ''
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

// 时间格式化
const formatTime = (timestamp) => {
  if (!timestamp) return ''
  return dayjs(timestamp).format('HH:mm:ss')
}

// 文件大小格式化
const formatSize = (size) => {
  if (!size) return '0 B'
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  let formattedSize = size
  
  while (formattedSize >= 1024 && i < units.length - 1) {
    formattedSize /= 1024
    i++
  }
  
  return `${formattedSize.toFixed(2)} ${units[i]}`
}

// 消息格式化
const formatMessage = (content) => {
  // 简单的Markdown格式支持
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>')
}

// 文件点击处理
const handleFileClick = (file) => {
  if (file.type === 'folder') {
    currentPath.value.push(file.name)
    // 加载文件夹内容
    loadFolderContents(file.id)
  } else {
    // 预览文件
    previewFile(file)
  }
}

// 路径导航
const navigateTo = (index) => {
  if (index < currentPath.value.length - 1) {
    currentPath.value = currentPath.value.slice(0, index + 1)
    // 加载对应路径的内容
    loadCurrentPathContents()
  }
}

// 显示上传对话框
const showUploadDialog = () => {
  uploadDialogVisible.value = true
}

// 处理上传变化
const handleUploadChange = async (info) => {
  if (info.file.status === 'done') {
    message.success(`${info.file.name} 上传成功`)
    await loadFiles()
  } else if (info.file.status === 'error') {
    message.error(`${info.file.name} 上传失败`)
  }
}

// 创建文件夹
const createFolder = async () => {
  try {
    folderNameRef.value = '';
    Modal.confirm({
      title: '创建文件夹',
      content: h('div', [
        h('a-input', {
          placeholder: '请输入文件夹名称',
          value: folderNameRef.value,
          'onUpdate:value': val => folderNameRef.value = val
        })
      ]),
      onOk: async () => {
        const folderName = folderNameRef.value;
        if (!folderName) return;
        
        const formData = new FormData();
        formData.append('name', folderName);
        
        // 如果不是在根目录，需要添加父文件夹ID
        if (currentPath.value.length > 1) {
          const currentFolder = files.value.find(f => 
            f.name === currentPath.value[currentPath.value.length - 1] && 
            f.type === 'folder'
          );
          if (currentFolder) {
            formData.append('parent_id', currentFolder.id);
          }
        }
        
        await api.post('/folders', formData);
        message.success('创建文件夹成功');
        await loadFiles();
      }
    });
  } catch (error) {
    console.error('创建文件夹失败:', error);
    message.error('创建文件夹失败');
  }
}

// 加载文件夹内容
const loadFolderContents = async (folderId) => {
  try {
    const response = await api.get('/files', { 
      params: { parent_id: folderId } 
    })
    files.value = response.data
  } catch (error) {
    console.error('加载文件夹内容失败:', error)
    message.error('加载文件夹内容失败')
  }
}

// 加载当前路径内容
const loadCurrentPathContents = async () => {
  if (currentPath.value.length === 1) {
    await loadFiles()
  } else {
    // 需要找到当前路径对应的文件夹ID
    let currentFolderId = null
    let parentId = null
    
    for (let i = 1; i < currentPath.value.length; i++) {
      const folderName = currentPath.value[i]
      
      // 加载当前层级的文件夹
      const response = await api.get('/files', { 
        params: { parent_id: parentId } 
      })
      
      // 查找当前文件夹
      const folder = response.data.find(f => f.name === folderName && f.type === 'folder')
      if (!folder) {
        message.error(`找不到文件夹: ${folderName}`)
        return
      }
      
      currentFolderId = folder.id
      parentId = folder.id
    }
    
    if (currentFolderId) {
      await loadFolderContents(currentFolderId)
    }
  }
}

// 预览文件
const previewFile = (file) => {
  // 文件预览逻辑
  message.info(`预览文件: ${file.name}`)
}

// 下载文件
const downloadFile = (file) => {
  // 创建一个临时链接来模拟下载
  // 在实际应用中，这里应该调用真实的下载API
  const url = `${API_BASE_URL}/files/${file.id}/download`;
  
  // 创建一个隐藏的a标签
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = file.name;
  
  // 添加到文档并触发点击
  document.body.appendChild(a);
  a.click();
  
  // 清理
  setTimeout(() => {
    document.body.removeChild(a);
  }, 100);
  
  message.success(`开始下载: ${file.name}`);
}

// 重命名文件
const renameFile = (file) => {
  fileToRename.value = file;
  newFileName.value = file.name;
  renameModalVisible.value = true;
};

// 执行重命名操作
const doRenameFile = async () => {
  try {
    if (!newFileName.value || newFileName.value === fileToRename.value.name) {
      renameModalVisible.value = false;
      return;
    }
    
    const formData = new FormData();
    formData.append('name', newFileName.value);
    
    // 发送请求时不使用默认的 Content-Type，让 axios 自动设置
    await axios.put(`${API_BASE_URL}/files/${fileToRename.value.id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    message.success('重命名成功');
    await loadFiles();
    renameModalVisible.value = false;
  } catch (error) {
    console.error('重命名失败:', error);
    message.error('重命名失败');
  }
};

// 删除文件
const deleteFile = async (file) => {
  try {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除 ${file.name} 吗？`,
      okText: '确定',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        await api.delete(`/files/${file.id}`);
        message.success('删除成功');
        await loadFiles();
      }
    });
  } catch (error) {
    console.error('删除失败:', error);
    message.error('删除失败');
  }
}

// 显示添加语料对话框
const showAddCorpusDialog = () => {
  corpusForm.value = {
    title: '',
    content: '',
    tags: []
  }
  corpusDialogVisible.value = true
}

// 导入语料
const importCorpus = () => {
  message.info('导入语料功能尚未实现')
}

// 编辑语料
const editCorpus = (item) => {
  corpusForm.value = {
    id: item.id,
    title: item.title,
    content: item.content,
    tags: [...item.tags]
  }
  corpusDialogVisible.value = true
}

// 删除语料
const deleteCorpus = async (corpus) => {
  try {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除语料 ${corpus.title} 吗？`,
      okText: '确定',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        await api.delete(`/corpus/${corpus.id}`);
        message.success('删除成功');
        await loadCorpus();
      }
    });
  } catch (error) {
    console.error('删除语料失败:', error);
    message.error('删除语料失败');
  }
}

// 保存语料
const saveCorpus = async () => {
  if (!corpusForm.value.title || !corpusForm.value.content) {
    message.warning('标题和内容不能为空')
    return
  }
  
  try {
    const data = {
      title: corpusForm.value.title,
      content: corpusForm.value.content,
      tags: corpusForm.value.tags
    }
    
    if (corpusForm.value.id) {
      // 更新现有语料
      await api.put(`/corpus/${corpusForm.value.id}`, data)
      message.success('更新成功')
    } else {
      // 创建新语料
      await api.post('/corpus', data)
      message.success('创建成功')
    }
    
    corpusDialogVisible.value = false
    await loadCorpus()
  } catch (error) {
    console.error('保存语料失败:', error)
    message.error('保存语料失败')
  }
}

// 按标签过滤
const filterByTag = (tagId) => {
  activeTag.value = activeTag.value === tagId ? null : tagId
}

// 显示添加标签对话框
const showAddTagDialog = () => {
  message.info('添加标签功能')
}

// 创建RAG知识库
const createRagKnowledgeBase = () => {
  ragForm.value = {
    name: '',
    description: '',
    sourceType: 'files',
    selectedFiles: [],
    selectedCorpus: [],
    embeddingModel: embeddingModels[0].id
  }
  ragDialogVisible.value = true
}

// 保存RAG知识库
const saveRagKnowledgeBase = async () => {
  if (!ragForm.value.name) {
    message.warning('名称不能为空')
    return
  }
  
  try {
    const data = {
      name: ragForm.value.name,
      description: ragForm.value.description,
      sourceType: ragForm.value.sourceType,
      selectedFiles: ragForm.value.selectedFiles,
      selectedCorpus: ragForm.value.selectedCorpus,
      embeddingModel: ragForm.value.embeddingModel
    }
    
    if (ragForm.value.id) {
      // 更新现有知识库
      await api.put(`/rag/${ragForm.value.id}`, data)
      message.success('更新成功')
    } else {
      // 创建新知识库
      await api.post('/rag', data)
      message.success('创建成功')
    }
    
    ragDialogVisible.value = false
    await loadRagKBs()
  } catch (error) {
    console.error('保存知识库失败:', error)
    message.error('保存知识库失败')
  }
}

// RAG知识库操作处理
const handleRagAction = async (command, kb) => {
  switch (command) {
    case 'edit':
      // 编辑知识库
      ragForm.value = {
        id: kb.id,
        name: kb.name,
        description: kb.description,
        sourceType: 'files',
        selectedFiles: [],
        selectedCorpus: [],
        embeddingModel: embeddingModels[0].id
      }
      ragDialogVisible.value = true
      break
    case 'update':
      // 更新知识库
      try {
        await api.put(`/rag/${kb.id}/status`, { status: kb.status === 'active' ? 'inactive' : 'active' })
        message.success(`知识库状态已${kb.status === 'active' ? '停用' : '激活'}`)
        await loadRagKBs()
      } catch (error) {
        console.error('更新知识库状态失败:', error)
        message.error('更新知识库状态失败')
      }
      break
    case 'export':
      message.info(`导出知识库功能尚未实现: ${kb.name}`)
      break
    case 'delete':
      await deleteRagKB(kb)
      break
  }
}

// 删除RAG知识库
const deleteRagKB = async (kb) => {
  try {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除知识库 ${kb.name} 吗？`,
      okText: '确定',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        await api.delete(`/rag/${kb.id}`);
        message.success('删除成功');
        await loadRagKBs();
      }
    });
  } catch (error) {
    console.error('删除知识库失败:', error);
    message.error('删除知识库失败');
  }
}

// 打开RAG聊天
const openRagChat = async (kb) => {
  activeRagKB.value = kb
  chatMessages.value = [
    {
      role: 'system',
      content: `欢迎使用"${kb.name}"知识库。您可以询问任何相关问题，我将基于知识库内容为您解答。`,
      timestamp: new Date()
    }
  ]
  chatInput.value = ''
  ragChatVisible.value = true
}

// 发送消息
const sendMessage = async () => {
  if (!chatInput.value.trim()) return
  
  // 添加用户消息
  const userMessage = {
    role: 'user',
    content: chatInput.value,
    timestamp: new Date()
  }
  chatMessages.value.push(userMessage)
  
  const userQuestion = chatInput.value
  chatInput.value = ''
  
  try {
    // 发送消息到后端
    const formData = new FormData()
    formData.append('message', userQuestion)
    
    const response = await api.post(`/rag/${activeRagKB.value.id}/chat`, formData)
    
    // 添加AI回复
    chatMessages.value.push(response.data)
  } catch (error) {
    console.error('发送消息失败:', error)
    
    // 添加错误消息
    chatMessages.value.push({
      role: 'assistant',
      content: '抱歉，处理您的问题时出现了错误。请稍后再试。',
      timestamp: new Date()
    })
  }
}

// 加载统计数据
const loadStats = async () => {
  try {
    const response = await api.get('/stats')
    stats.value = response.data
  } catch (error) {
    console.error('加载统计数据失败:', error)
    message.error('加载统计数据失败')
  }
}

// 加载文件数据
const loadFiles = async () => {
  try {
    const params = {}
    if (currentPath.value.length > 1) {
      // 如果不是根目录，需要获取当前文件夹的ID
      const folderName = currentPath.value[currentPath.value.length - 1]
      const folder = files.value.find(f => f.name === folderName && f.type === 'folder')
      if (folder) {
        params.parent_id = folder.id
      }
    }
    
    if (searchQuery.value) {
      params.search = searchQuery.value
    }
    
    const response = await api.get('/files', { params })
    files.value = response.data
    
    // 更新统计数据
    await loadStats()
  } catch (error) {
    console.error('加载文件失败:', error)
    message.error('加载文件失败')
  }
}

// 加载语料数据
const loadCorpus = async () => {
  try {
    const params = {}
    
    if (activeTag.value) {
      params.tag = activeTag.value
    }
    
    if (searchQuery.value) {
      params.search = searchQuery.value
    }
    
    const response = await api.get('/corpus', { params })
    corpus.value = response.data
    
    // 加载标签
    await loadCorpusTags()
    
    // 更新统计数据
    await loadStats()
  } catch (error) {
    console.error('加载语料失败:', error)
    message.error('加载语料失败')
  }
}

// 加载语料标签
const loadCorpusTags = async () => {
  try {
    const response = await api.get('/corpus/tags')
    corpusTags.value = response.data
  } catch (error) {
    console.error('加载语料标签失败:', error)
    message.error('加载语料标签失败')
  }
}

// 加载RAG知识库数据
const loadRagKBs = async () => {
  try {
    const params = {}
    
    if (searchQuery.value) {
      params.search = searchQuery.value
    }
    
    const response = await api.get('/rag', { params })
    ragKBs.value = response.data
    
    // 更新统计数据
    await loadStats()
  } catch (error) {
    console.error('加载知识库失败:', error)
    message.error('加载知识库失败')
  }
}

// 添加键盘快捷键监听
onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  
  // 初始化加载数据
  loadFiles()
  loadCorpus()
  loadRagKBs()
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})

const handleKeyDown = (e) => {
  // 当按下 '/' 键且不在输入框中时，聚焦搜索框
  if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
    e.preventDefault()
    const searchInput = document.querySelector('.search-input input')
    if (searchInput) {
      searchInput.focus()
    }
  }
}
</script>

<style scoped>
/* 搜索框样式 */
.search-input {
  @apply bg-white hover:bg-gray-50 transition-all duration-300 !important;
  border-radius: 12px !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.search-input:hover,
.search-input:focus-within {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.search-prefix {
  @apply flex items-center mr-2;
}

.search-icon {
  @apply text-gray-400 text-lg transition-all duration-300;
}

.search-icon.searching {
  @apply text-blue-500;
  animation: searching 1.5s ease-in-out infinite;
}

.search-suffix {
  @apply flex items-center gap-2;
}

.clear-icon {
  @apply text-gray-400 hover:text-red-500 cursor-pointer transition-colors;
  font-size: 16px;
}

/* 搜索提示框样式 */
.search-tooltip {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 8px;
  opacity: 0;
  transform: translateY(-10px);
  pointer-events: none;
  transition: all 0.3s ease;
  z-index: 1000;
}

.search-tooltip.visible {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.tooltip-header {
  @apply flex items-center justify-between mb-4 pb-3 border-b border-gray-100;
}

.tooltip-title {
  @apply text-base font-medium text-gray-700;
}

.tooltip-subtitle {
  @apply text-sm text-gray-400;
}

.tooltip-section {
  @apply mb-4;
}

.section-header {
  @apply flex items-center gap-2 mb-2 text-sm text-gray-600;
}

.tooltip-tags {
  @apply flex flex-wrap gap-2;
}

.search-tag {
  @apply cursor-pointer transition-all hover:scale-105;
  padding: 4px 8px;
}

.tooltip-footer {
  @apply flex items-center gap-2 mt-4 pt-3 border-t border-gray-100 text-sm text-gray-500;
}

.tooltip-footer kbd {
  @apply bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-sm font-mono;
}

/* 文件卡片样式 */
.file-card {
  transition: all 0.3s ease;
}

.file-card:hover {
  transform: translateY(-5px);
}

/* 语料卡片样式 */
.corpus-card {
  height: 100%;
}

.corpus-content {
  max-height: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
}

/* 自定义表格样式 */
.custom-table :deep(.ant-table) {
  @apply bg-transparent;
}

.custom-table :deep(.ant-table-thead > tr > th) {
  @apply bg-transparent !important;
  @apply text-gray-500 font-medium !important;
  @apply border-b border-gray-100 !important;
  @apply before:hidden !important;
  @apply py-3 !important;
}

.custom-table :deep(.ant-table-tbody > tr > td) {
  @apply border-none !important;
  @apply py-3 !important;
}

.custom-table :deep(.ant-table-tbody > tr) {
  @apply hover:bg-gray-50/80;
}

/* 美化滚动条 */
:deep(::-webkit-scrollbar) {
  @apply w-1.5;
}

:deep(::-webkit-scrollbar-track) {
  @apply bg-transparent;
}

:deep(::-webkit-scrollbar-thumb) {
  @apply bg-gray-200 rounded-full;
}

:deep(::-webkit-scrollbar-thumb:hover) {
  @apply bg-gray-300;
}

/* 搜索图标动画 */
@keyframes searching {
  0% {
    transform: scale(1) rotate(0deg);
  }
  50% {
    transform: scale(1.1) rotate(180deg);
  }
  100% {
    transform: scale(1) rotate(360deg);
  }
}

/* 聊天消息样式 */
.message-text {
  line-height: 1.5;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .flex-1.flex {
    flex-direction: column;
  }
  
  .flex-none.w-60 {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #f0f0f0;
  }
}
</style>