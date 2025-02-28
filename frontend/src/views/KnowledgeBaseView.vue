<template>
  <div class="knowledge-base-container">
    <!-- 顶部导航栏 -->
    <div class="kb-header">
      <h1 class="kb-title">知识库</h1>
      <div class="kb-search-container">
        <el-input
          v-model="searchQuery"
          placeholder="搜索知识库内容..."
          prefix-icon="el-icon-search"
          clearable
          @input="handleSearch"
        />
        <el-dropdown @command="handleViewChange">
          <el-button type="primary" icon="el-icon-s-grid">
            视图选项
            <i class="el-icon-arrow-down"></i>
          </el-button>
          <template #dropdown>
            <el-dropdown-item command="card">卡片视图</el-dropdown-item>
            <el-dropdown-item command="list">列表视图</el-dropdown-item>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="kb-main-content">
      <!-- 左侧导航菜单 -->
      <div class="kb-sidebar">
        <el-menu
          :default-active="activeModule"
          class="kb-menu"
          @select="handleModuleChange"
        >
          <el-menu-item index="files">
            <i class="el-icon-document"></i>
            <span>文件管理</span>
          </el-menu-item>
          <el-menu-item index="corpus">
            <i class="el-icon-collection"></i>
            <span>语料管理</span>
          </el-menu-item>
          <el-menu-item index="rag">
            <i class="el-icon-chat-dot-square"></i>
            <span>RAG知识库</span>
          </el-menu-item>
        </el-menu>
        
        <div class="kb-stats">
          <h3>统计数据</h3>
          <div class="stat-item">
            <span>文件总数:</span>
            <span class="stat-value">{{ stats.totalFiles }}</span>
          </div>
          <div class="stat-item">
            <span>语料总数:</span>
            <span class="stat-value">{{ stats.totalCorpus }}</span>
          </div>
          <div class="stat-item">
            <span>知识库总数:</span>
            <span class="stat-value">{{ stats.totalRag }}</span>
          </div>
        </div>
      </div>

      <!-- 右侧内容区域 -->
      <div class="kb-content">
        <!-- 文件管理模块 -->
        <div v-if="activeModule === 'files'" class="module-container">
          <div class="module-header">
            <h2>文件管理</h2>
            <div class="module-actions">
              <el-button type="primary" @click="showUploadDialog">
                <i class="el-icon-upload"></i> 上传文件
              </el-button>
              <el-button @click="createFolder">
                <i class="el-icon-folder-add"></i> 创建文件夹
              </el-button>
            </div>
          </div>
          
          <!-- 文件导航路径 -->
          <el-breadcrumb separator="/">
            <el-breadcrumb-item 
              v-for="(path, index) in currentPath" 
              :key="index"
              @click="navigateTo(index)"
            >
              {{ path }}
            </el-breadcrumb-item>
          </el-breadcrumb>
          
          <!-- 文件列表/卡片视图 -->
          <div :class="['files-container', viewMode]">
            <template v-if="viewMode === 'card'">
              <el-card 
                v-for="file in filteredFiles" 
                :key="file.id" 
                class="file-card"
                :class="{ 'is-folder': file.type === 'folder' }"
                @click="handleFileClick(file)"
              >
                <div class="file-icon">
                  <i :class="getFileIcon(file)"></i>
                </div>
                <div class="file-info">
                  <div class="file-name">{{ file.name }}</div>
                  <div class="file-meta">
                    <span>{{ formatDate(file.updatedAt) }}</span>
                    <span>{{ formatSize(file.size) }}</span>
                  </div>
                </div>
                <div class="file-actions">
                  <el-dropdown @command="(cmd) => handleFileAction(cmd, file)">
                    <i class="el-icon-more"></i>
                    <template #dropdown>
                      <el-dropdown-item command="download">下载</el-dropdown-item>
                      <el-dropdown-item command="rename">重命名</el-dropdown-item>
                      <el-dropdown-item command="share">分享</el-dropdown-item>
                      <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                    </template>
                  </el-dropdown>
                </div>
              </el-card>
            </template>
            
            <template v-else>
              <el-table :data="filteredFiles" style="width: 100%">
                <el-table-column width="50">
                  <template #default="scope">
                    <i :class="getFileIcon(scope.row)"></i>
                  </template>
                </el-table-column>
                <el-table-column prop="name" label="文件名"></el-table-column>
                <el-table-column prop="updatedAt" label="最后修改时间" width="180">
                  <template #default="scope">
                    {{ formatDate(scope.row.updatedAt) }}
                  </template>
                </el-table-column>
                <el-table-column prop="size" label="文件大小" width="120">
                  <template #default="scope">
                    {{ formatSize(scope.row.size) }}
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="150">
                  <template #default="scope">
                    <el-dropdown @command="(cmd) => handleFileAction(cmd, scope.row)">
                      <el-button type="text">
                        操作
                        <i class="el-icon-arrow-down"></i>
                      </el-button>
                      <template #dropdown>
                        <el-dropdown-item command="download">下载</el-dropdown-item>
                        <el-dropdown-item command="rename">重命名</el-dropdown-item>
                        <el-dropdown-item command="share">分享</el-dropdown-item>
                        <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                      </template>
                    </el-dropdown>
                  </template>
                </el-table-column>
              </el-table>
            </template>
          </div>
        </div>

        <!-- 语料管理模块 -->
        <div v-if="activeModule === 'corpus'" class="module-container">
          <div class="module-header">
            <h2>语料管理</h2>
            <div class="module-actions">
              <el-button type="primary" @click="showAddCorpusDialog">
                <i class="el-icon-plus"></i> 添加语料
              </el-button>
              <el-button @click="importCorpus">
                <i class="el-icon-upload2"></i> 导入语料
              </el-button>
            </div>
          </div>
          
          <!-- 语料分类标签 -->
          <div class="corpus-tags">
            <el-tag 
              v-for="tag in corpusTags" 
              :key="tag.id"
              :class="{ active: activeTag === tag.id }"
              @click="filterByTag(tag.id)"
            >
              {{ tag.name }} ({{ tag.count }})
            </el-tag>
            <el-button size="small" icon="el-icon-plus" @click="showAddTagDialog">
              新建标签
            </el-button>
          </div>
          
          <!-- 语料列表 -->
          <div class="corpus-list">
            <el-card 
              v-for="corpus in filteredCorpus" 
              :key="corpus.id" 
              class="corpus-card"
            >
              <div class="corpus-header">
                <h3>{{ corpus.title }}</h3>
                <div class="corpus-tags">
                  <el-tag size="small" v-for="tag in corpus.tags" :key="tag" type="info">
                    {{ tag }}
                  </el-tag>
                </div>
              </div>
              <div class="corpus-content">
                {{ corpus.content.substring(0, 200) }}{{ corpus.content.length > 200 ? '...' : '' }}
              </div>
              <div class="corpus-footer">
                <span class="corpus-date">{{ formatDate(corpus.updatedAt) }}</span>
                <div class="corpus-actions">
                  <el-button size="mini" icon="el-icon-edit" @click="editCorpus(corpus)"></el-button>
                  <el-button size="mini" icon="el-icon-delete" @click="deleteCorpus(corpus)"></el-button>
                </div>
              </div>
            </el-card>
          </div>
        </div>

        <!-- RAG知识库模块 -->
        <div v-if="activeModule === 'rag'" class="module-container">
          <div class="module-header">
            <h2>RAG知识库</h2>
            <div class="module-actions">
              <el-button type="primary" @click="createRagKnowledgeBase">
                <i class="el-icon-plus"></i> 创建知识库
              </el-button>
            </div>
          </div>
          
          <!-- RAG知识库列表 -->
          <div class="rag-list">
            <el-card 
              v-for="kb in filteredRagKBs" 
              :key="kb.id" 
              class="rag-card"
            >
              <div class="rag-header">
                <h3>{{ kb.name }}</h3>
                <el-tag :type="kb.status === 'active' ? 'success' : 'info'">
                  {{ kb.status }}
                </el-tag>
              </div>
              <div class="rag-info">
                <div class="rag-stats">
                  <div class="rag-stat-item">
                    <i class="el-icon-document"></i>
                    <span>{{ kb.documentCount }} 文档</span>
                  </div>
                  <div class="rag-stat-item">
                    <i class="el-icon-time"></i>
                    <span>{{ formatDate(kb.updatedAt) }}</span>
                  </div>
                </div>
                <div class="rag-description">
                  {{ kb.description }}
                </div>
              </div>
              <div class="rag-footer">
                <el-button type="primary" @click="openRagChat(kb)">
                  提问
                </el-button>
                <div class="rag-actions">
                  <el-dropdown @command="(cmd) => handleRagAction(cmd, kb)">
                    <el-button type="text">
                      <i class="el-icon-more"></i>
                    </el-button>
                    <template #dropdown>
                      <el-dropdown-item command="edit">编辑</el-dropdown-item>
                      <el-dropdown-item command="update">更新知识库</el-dropdown-item>
                      <el-dropdown-item command="export">导出</el-dropdown-item>
                      <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                    </template>
                  </el-dropdown>
                </div>
              </div>
            </el-card>
          </div>
        </div>
      </div>
    </div>

    <!-- 对话框组件 -->
    <!-- 文件上传对话框 -->
    <el-dialog
      title="上传文件"
      v-model="uploadDialogVisible"
      width="500px"
    >
      <el-upload
        class="upload-container"
        drag
        action="/api/knowledge-base/upload"
        multiple
        :on-success="handleUploadSuccess"
        :on-error="handleUploadError"
      >
        <i class="el-icon-upload"></i>
        <div class="el-upload__text">
          将文件拖到此处，或
          <em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            支持各种文档格式，单个文件不超过10MB
          </div>
        </template>
      </el-upload>
    </el-dialog>

    <!-- 添加语料对话框 -->
    <el-dialog
      title="添加语料"
      v-model="corpusDialogVisible"
      width="700px"
    >
      <el-form :model="corpusForm" label-width="100px">
        <el-form-item label="标题" required>
          <el-input v-model="corpusForm.title"></el-input>
        </el-form-item>
        <el-form-item label="内容" required>
          <el-input
            type="textarea"
            v-model="corpusForm.content"
            :rows="10"
          ></el-input>
        </el-form-item>
        <el-form-item label="标签">
          <el-select
            v-model="corpusForm.tags"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="选择或创建标签"
          >
            <el-option
              v-for="tag in availableTags"
              :key="tag"
              :label="tag"
              :value="tag"
            ></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="corpusDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveCorpus">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- RAG知识库创建对话框 -->
    <el-dialog
      title="创建RAG知识库"
      v-model="ragDialogVisible"
      width="700px"
    >
      <el-form :model="ragForm" label-width="120px">
        <el-form-item label="名称" required>
          <el-input v-model="ragForm.name"></el-input>
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            type="textarea"
            v-model="ragForm.description"
            :rows="3"
          ></el-input>
        </el-form-item>
        <el-form-item label="数据源">
          <el-tabs v-model="ragForm.sourceType">
            <el-tab-pane label="文件" name="files">
              <el-transfer
                v-model="ragForm.selectedFiles"
                :data="transferFiles"
                :titles="['可选文件', '已选文件']"
              ></el-transfer>
            </el-tab-pane>
            <el-tab-pane label="语料" name="corpus">
              <el-transfer
                v-model="ragForm.selectedCorpus"
                :data="transferCorpus"
                :titles="['可选语料', '已选语料']"
              ></el-transfer>
            </el-tab-pane>
          </el-tabs>
        </el-form-item>
        <el-form-item label="嵌入模型">
          <el-select v-model="ragForm.embeddingModel" style="width: 100%">
            <el-option
              v-for="model in embeddingModels"
              :key="model.id"
              :label="model.name"
              :value="model.id"
            ></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="ragDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveRagKnowledgeBase">创建</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- RAG聊天对话框 -->
    <el-dialog
      :title="activeRagKB ? activeRagKB.name : 'RAG知识库对话'"
      v-model="ragChatVisible"
      width="800px"
      fullscreen
    >
      <div class="rag-chat-container">
        <div class="chat-messages">
          <div 
            v-for="(message, index) in chatMessages" 
            :key="index"
            :class="['chat-message', message.role]"
          >
            <div class="message-avatar">
              <i :class="message.role === 'user' ? 'el-icon-user' : 'el-icon-s-custom'"></i>
            </div>
            <div class="message-content">
              <div class="message-text" v-html="formatMessage(message.content)"></div>
              <div class="message-time">{{ formatTime(message.timestamp) }}</div>
            </div>
          </div>
        </div>
        <div class="chat-input">
          <el-input
            v-model="chatInput"
            type="textarea"
            :rows="3"
            placeholder="输入您的问题..."
            @keyup.enter="sendMessage"
          ></el-input>
          <el-button type="primary" icon="el-icon-s-promotion" @click="sendMessage">
            发送
          </el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
// 导入所需的组件和依赖
import { defineComponent } from 'vue'
import { 
  ElMessage, 
  ElMessageBox,
  ElButton,
  ElInput,
  ElDropdown,
  ElDropdownItem,
  ElMenu,
  ElMenuItem,
  ElBreadcrumb,
  ElBreadcrumbItem,
  ElCard,
  ElTable,
  ElTableColumn,
  ElTag,
  ElDialog,
  ElUpload,
  ElForm,
  ElFormItem,
  ElSelect,
  ElOption,
  ElTabs,
  ElTabPane,
  ElTransfer
} from 'element-plus'

export default defineComponent({
  name: 'KnowledgeBaseView',
  
  components: {
    // 注册所有使用的 Element Plus 组件
    ElButton,
    ElInput,
    ElDropdown,
    ElDropdownItem,
    ElMenu,
    ElMenuItem,
    ElBreadcrumb,
    ElBreadcrumbItem,
    ElCard,
    ElTable,
    ElTableColumn,
    ElTag,
    ElDialog,
    ElUpload,
    ElForm,
    ElFormItem,
    ElSelect,
    ElOption,
    ElTabs,
    ElTabPane,
    ElTransfer
  },

  data() {
    return {
      // 当前活动模块
      activeModule: 'files',
      // 搜索查询
      searchQuery: '',
      // 视图模式
      viewMode: 'card',
      // 当前文件路径
      currentPath: ['根目录'],
      // 统计数据
      stats: {
        totalFiles: 0,
        totalCorpus: 0,
        totalRag: 0
      },
      
      // 文件数据
      files: [],
      
      // 语料数据
      corpus: [],
      corpusTags: [],
      activeTag: null,
      
      // RAG知识库数据
      ragKBs: [],
      
      // 对话框控制
      uploadDialogVisible: false,
      corpusDialogVisible: false,
      ragDialogVisible: false,
      ragChatVisible: false,
      
      // 表单数据
      corpusForm: {
        title: '',
        content: '',
        tags: []
      },
      ragForm: {
        name: '',
        description: '',
        sourceType: 'files',
        selectedFiles: [],
        selectedCorpus: [],
        embeddingModel: ''
      },
      
      // 嵌入模型选项
      embeddingModels: [
        { id: 'openai-ada-002', name: 'OpenAI Ada 002' },
        { id: 'bge-large-zh', name: 'BGE Large Chinese' },
        { id: 'bge-large-en', name: 'BGE Large English' }
      ],
      
      // 聊天相关
      activeRagKB: null,
      chatMessages: [],
      chatInput: '',
      
      // 可用标签
      availableTags: ['文档', '笔记', '研究', '项目', '参考资料']
    };
  },

  computed: {
    // 过滤后的文件列表
    filteredFiles() {
      if (!this.searchQuery) {
        return this.files;
      }
      
      const query = this.searchQuery.toLowerCase();
      return this.files.filter(file => 
        file.name.toLowerCase().includes(query)
      );
    },
    
    // 过滤后的语料列表
    filteredCorpus() {
      let result = this.corpus;
      
      // 先按标签过滤
      if (this.activeTag) {
        result = result.filter(item => 
          item.tags.includes(this.activeTag)
        );
      }
      
      // 再按搜索词过滤
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        result = result.filter(item => 
          item.title.toLowerCase().includes(query) || 
          item.content.toLowerCase().includes(query)
        );
      }
      
      return result;
    },
    
    // 过滤后的RAG知识库列表
    filteredRagKBs() {
      if (!this.searchQuery) {
        return this.ragKBs;
      }
      
      const query = this.searchQuery.toLowerCase();
      return this.ragKBs.filter(kb => 
        kb.name.toLowerCase().includes(query) || 
        kb.description.toLowerCase().includes(query)
      );
    },
    
    // 用于穿梭框的文件数据
    transferFiles() {
      return this.files.map(file => ({
        key: file.id,
        label: file.name,
        disabled: file.type === 'folder'
      }));
    },
    
    // 用于穿梭框的语料数据
    transferCorpus() {
      return this.corpus.map(item => ({
        key: item.id,
        label: item.title
      }));
    }
  },

  methods: {
    // 修改消息提示方法
    showMessage(message, type = 'info') {
      ElMessage({
        message,
        type
      })
    },

    // 修改确认对话框方法
    async confirmAction(message, title = '警告') {
      try {
        await ElMessageBox.confirm(message, title, {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        return true
      } catch {
        return false
      }
    },

    // 修改文件删除方法
    async deleteFile(file) {
      const confirmed = await this.confirmAction(`确定要删除 ${file.name} 吗？`)
      if (confirmed) {
        // 删除文件逻辑
        this.showMessage('删除成功', 'success')
        this.loadFiles()
      }
    },

    // 修改语料删除方法
    async deleteCorpus(corpus) {
      const confirmed = await this.confirmAction(`确定要删除语料 ${corpus.title} 吗？`)
      if (confirmed) {
        // 删除语料逻辑
        this.showMessage('删除成功', 'success')
        this.loadCorpus()
      }
    },

    // 修改RAG知识库删除方法
    async deleteRagKB(kb) {
      const confirmed = await this.confirmAction(`确定要删除知识库 ${kb.name} 吗？`)
      if (confirmed) {
        // 删除知识库逻辑
        this.showMessage('删除成功', 'success')
        this.loadRagKBs()
      }
    },

    // 修改保存语料方法
    saveCorpus() {
      if (!this.corpusForm.title || !this.corpusForm.content) {
        this.showMessage('标题和内容不能为空', 'warning')
        return
      }
      
      // 保存语料逻辑
      this.showMessage('保存成功', 'success')
      this.corpusDialogVisible = false
      this.loadCorpus()
    },

    // 修改保存RAG知识库方法
    saveRagKnowledgeBase() {
      if (!this.ragForm.name) {
        this.showMessage('名称不能为空', 'warning')
        return
      }
      
      // 保存知识库逻辑
      this.showMessage('创建成功', 'success')
      this.ragDialogVisible = false
      this.loadRagKBs()
    },

    // 修改上传成功处理方法
    handleUploadSuccess(response, file, fileList) {
      this.showMessage('上传成功', 'success')
      this.uploadDialogVisible = false
      this.loadFiles()
    },

    // 修改上传错误处理方法
    handleUploadError(err, file, fileList) {
      this.showMessage('上传失败', 'error')
    },

    // 模块切换处理
    handleModuleChange(index) {
      this.activeModule = index;
    },
    
    // 搜索处理
    handleSearch() {
      // 实现搜索逻辑
    },
    
    // 视图模式切换
    handleViewChange(command) {
      this.viewMode = command;
    },
    
    // 文件图标获取
    getFileIcon(file) {
      if (file.type === 'folder') {
        return 'el-icon-folder';
      }
      
      const iconMap = {
        'pdf': 'el-icon-document',
        'doc': 'el-icon-document-word',
        'docx': 'el-icon-document-word',
        'xls': 'el-icon-document-excel',
        'xlsx': 'el-icon-document-excel',
        'ppt': 'el-icon-document-ppt',
        'pptx': 'el-icon-document-ppt',
        'txt': 'el-icon-document-text',
        'jpg': 'el-icon-picture',
        'jpeg': 'el-icon-picture',
        'png': 'el-icon-picture',
        'zip': 'el-icon-document-zip',
        'rar': 'el-icon-document-zip'
      };
      
      const ext = file.name.split('.').pop().toLowerCase();
      return iconMap[ext] || 'el-icon-document';
    },
    
    // 日期格式化
    formatDate(date) {
      if (!date) return '';
      const d = new Date(date);
      return d.toLocaleDateString();
    },
    
    // 时间格式化
    formatTime(timestamp) {
      if (!timestamp) return '';
      const d = new Date(timestamp);
      return d.toLocaleTimeString();
    },
    
    // 文件大小格式化
    formatSize(size) {
      if (!size) return '0 B';
      
      const units = ['B', 'KB', 'MB', 'GB', 'TB'];
      let i = 0;
      while (size >= 1024 && i < units.length - 1) {
        size /= 1024;
        i++;
      }
      
      return `${size.toFixed(2)} ${units[i]}`;
    },
    
    // 消息格式化
    formatMessage(content) {
      // 简单的Markdown格式支持
      return content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');
    },
    
    // 文件点击处理
    handleFileClick(file) {
      if (file.type === 'folder') {
        this.currentPath.push(file.name);
        // 加载文件夹内容
        this.loadFolderContents(file.id);
      } else {
        // 预览文件
        this.previewFile(file);
      }
    },
    
    // 文件操作处理
    handleFileAction(command, file) {
      switch (command) {
        case 'download':
          this.downloadFile(file);
          break;
        case 'rename':
          this.renameFile(file);
          break;
        case 'share':
          this.shareFile(file);
          break;
        case 'delete':
          this.deleteFile(file);
          break;
      }
    },
    
    // RAG知识库操作处理
    handleRagAction(command, kb) {
      switch (command) {
        case 'edit':
          this.editRagKB(kb);
          break;
        case 'update':
          this.updateRagKB(kb);
          break;
        case 'export':
          this.exportRagKB(kb);
          break;
        case 'delete':
          this.deleteRagKB(kb);
          break;
      }
    },
    
    // 路径导航
    navigateTo(index) {
      if (index < this.currentPath.length - 1) {
        this.currentPath = this.currentPath.slice(0, index + 1);
        // 加载对应路径的内容
        this.loadCurrentPathContents();
      }
    },
    
    // 显示上传对话框
    showUploadDialog() {
      this.uploadDialogVisible = true;
    },
    
    // 创建文件夹
    createFolder() {
      this.$prompt('请输入文件夹名称', '创建文件夹', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
      }).then(({ value }) => {
        if (value) {
          // 创建文件夹逻辑
          this.$message({
            type: 'success',
            message: `文件夹创建成功: ${value}`
          });
        }
      }).catch(() => {});
    },
    
    // 加载文件夹内容
    loadFolderContents(folderId) {
      // 从API获取特定文件夹内容的逻辑
      // 模拟数据
      this.files = [
        { id: 6, name: '子文件夹', type: 'folder', updatedAt: new Date(), size: 0 },
        { id: 7, name: '技术规范.pdf', type: 'file', updatedAt: new Date(), size: 1024 * 1024 * 1.8 },
        { id: 8, name: '开发计划.docx', type: 'file', updatedAt: new Date(), size: 1024 * 300 }
      ];
    },
    
    // 加载当前路径内容
    loadCurrentPathContents() {
      // 根据当前路径加载内容
      if (this.currentPath.length === 1) {
        this.loadFiles();
      } else {
        // 模拟加载特定路径的内容
        this.loadFolderContents();
      }
    },
    
    // 预览文件
    previewFile(file) {
      // 文件预览逻辑
      this.$message({
        message: `预览文件: ${file.name}`,
        type: 'info'
      });
    },
    
    // 下载文件
    downloadFile(file) {
      // 文件下载逻辑
      this.$message({
        message: `下载文件: ${file.name}`,
        type: 'success'
      });
    },
    
    // 重命名文件
    renameFile(file) {
      this.$prompt(this.$t('knowledgeBase.enterNewName'), this.$t('knowledgeBase.rename'), {
        confirmButtonText: this.$t('common.confirm'),
        cancelButtonText: this.$t('common.cancel'),
        inputValue: file.name
      }).then(({ value }) => {
        if (value) {
          // 重命名文件逻辑
          this.$message({
            type: 'success',
            message: `${this.$t('knowledgeBase.renamed')}: ${value}`
          });
        }
      }).catch(() => {});
    },
    
    // 分享文件
    shareFile(file) {
      // 文件分享逻辑
      this.$message({
        message: `分享文件: ${file.name}`,
        type: 'info'
      });
    },
    
    // 显示添加语料对话框
    showAddCorpusDialog() {
      this.corpusForm = {
        title: '',
        content: '',
        tags: []
      };
      this.corpusDialogVisible = true;
    },
    
    // 导入语料
    importCorpus() {
      // 导入语料逻辑
    },
    
    // 编辑语料
    editCorpus(corpus) {
      this.corpusForm = {
        id: corpus.id,
        title: corpus.title,
        content: corpus.content,
        tags: [...corpus.tags]
      };
      this.corpusDialogVisible = true;
    },
    
    // 按标签过滤
    filterByTag(tagId) {
      this.activeTag = this.activeTag === tagId ? null : tagId;
    },
    
    // 显示添加标签对话框
    showAddTagDialog() {
      this.$prompt(this.$t('knowledgeBase.enterTagName'), this.$t('knowledgeBase.newTag'), {
        confirmButtonText: this.$t('common.confirm'),
        cancelButtonText: this.$t('common.cancel')
      }).then(({ value }) => {
        if (value) {
          // 添加标签逻辑
          this.corpusTags.push({
            id: Date.now(),
            name: value,
            count: 0
          });
          this.$message({
            type: 'success',
            message: this.$t('knowledgeBase.tagCreated')
          });
        }
      }).catch(() => {});
    },
    
    // 加载语料数据
    loadCorpus() {
      // 从API获取语料数据的逻辑
      // 模拟数据
      this.corpus = [
        {
          id: 1,
          title: '人工智能基础概念',
          content: '人工智能（AI）是计算机科学的一个分支，致力于创建能够执行通常需要人类智能的任务的系统。这包括视觉感知、语音识别、决策制定和语言翻译等。',
          tags: ['研究', '技术'],
          updatedAt: new Date()
        },
        {
          id: 2,
          title: '机器学习算法比较',
          content: '监督学习算法需要标记的训练数据，而无监督学习算法可以在没有标记的情况下工作。常见的监督学习算法包括线性回归、逻辑回归和支持向量机。无监督学习算法包括K均值聚类和主成分分析。',
          tags: ['研究', '算法'],
          updatedAt: new Date()
        },
        {
          id: 3,
          title: '深度学习框架概述',
          content: 'TensorFlow和PyTorch是两个最流行的深度学习框架。TensorFlow由Google开发，提供了强大的生产部署工具。PyTorch由Facebook开发，以其动态计算图和易用性而闻名。',
          tags: ['技术', '工具'],
          updatedAt: new Date()
        }
      ];
      
      // 更新标签数据
      this.updateCorpusTags();
      
      // 更新统计数据
      this.updateStats();
    },
    
    // 更新语料标签
    updateCorpusTags() {
      const tagCounts = {};
      
      // 计算每个标签的使用次数
      this.corpus.forEach(item => {
        item.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      });
      
      // 更新标签列表
      this.corpusTags = Object.keys(tagCounts).map(tag => ({
        id: tag,
        name: tag,
        count: tagCounts[tag]
      }));
    },
    
    // 创建RAG知识库
    createRagKnowledgeBase() {
      this.ragForm = {
        name: '',
        description: '',
        sourceType: 'files',
        selectedFiles: [],
        selectedCorpus: [],
        embeddingModel: this.embeddingModels[0].id
      };
      this.ragDialogVisible = true;
    },
    
    // 编辑RAG知识库
    editRagKB(kb) {
      // 编辑RAG知识库逻辑
    },
    
    // 更新RAG知识库
    updateRagKB(kb) {
      // 更新RAG知识库逻辑
    },
    
    // 导出RAG知识库
    exportRagKB(kb) {
      // 导出RAG知识库逻辑
    },
    
    // 打开RAG聊天
    openRagChat(kb) {
      this.activeRagKB = kb;
      this.chatMessages = [
        {
          role: 'system',
          content: `欢迎使用"${kb.name}"知识库。您可以询问任何相关问题，我将基于知识库内容为您解答。`,
          timestamp: new Date()
        }
      ];
      this.chatInput = '';
      this.ragChatVisible = true;
    },
    
    // 发送消息
    sendMessage() {
      if (!this.chatInput.trim()) return;
      
      // 添加用户消息
      this.chatMessages.push({
        role: 'user',
        content: this.chatInput,
        timestamp: new Date()
      });
      
      const userQuestion = this.chatInput;
      this.chatInput = '';
      
      // 模拟AI响应
      setTimeout(() => {
        this.chatMessages.push({
          role: 'assistant',
          content: `基于"${this.activeRagKB.name}"知识库，对于您的问题"${userQuestion}"，我找到了以下信息：\n\n这是一个基于RAG（检索增强生成）的回答示例。在实际应用中，这里会返回从知识库中检索到的相关信息，并生成针对用户问题的回答。`,
          timestamp: new Date()
        });
      }, 1000);
    },
    
    // 更新统计数据
    updateStats() {
      this.stats = {
        totalFiles: this.files.length,
        totalCorpus: this.corpus.length,
        totalRag: this.ragKBs.length
      };
    },
    
    // 加载文件数据
    loadFiles() {
      // 从API获取文件数据的逻辑
      // 模拟数据
      this.files = [
        { id: 1, name: '项目文档', type: 'folder', updatedAt: new Date(), size: 0 },
        { id: 2, name: '研究报告.pdf', type: 'file', updatedAt: new Date(), size: 1024 * 1024 * 2.5 },
        { id: 3, name: '会议记录.docx', type: 'file', updatedAt: new Date(), size: 1024 * 500 },
        { id: 4, name: '数据分析.xlsx', type: 'file', updatedAt: new Date(), size: 1024 * 1024 * 1.2 },
        { id: 5, name: '产品说明.pptx', type: 'file', updatedAt: new Date(), size: 1024 * 1024 * 3.7 }
      ];
      
      // 更新统计数据
      this.updateStats();
    },
    
    // 加载RAG知识库数据
    loadRagKBs() {
      // 从API获取RAG知识库数据的逻辑
      // 模拟数据
      this.ragKBs = [
        {
          id: 1,
          name: '产品知识库',
          description: '包含所有产品相关的文档、规格和使用说明',
          status: 'active',
          documentCount: 24,
          updatedAt: new Date()
        },
        {
          id: 2,
          name: '研究论文库',
          description: '收集了领域内的重要研究论文和文献',
          status: 'active',
          documentCount: 57,
          updatedAt: new Date()
        },
        {
          id: 3,
          name: '技术文档库',
          description: '技术规范、API文档和开发指南的集合',
          status: 'inactive',
          documentCount: 18,
          updatedAt: new Date()
        }
      ];
      
      // 更新统计数据
      this.updateStats();
    }
  },

  created() {
    // 初始化加载数据
    this.loadFiles()
    this.loadCorpus()
    this.loadRagKBs()
  }
})
</script>

<style scoped>
.knowledge-base-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.kb-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #ebeef5;
}

.kb-title {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.kb-search-container {
  display: flex;
  gap: 16px;
  width: 50%;
}

.kb-main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.kb-sidebar {
  width: 240px;
  border-right: 1px solid #ebeef5;
  display: flex;
  flex-direction: column;
}

.kb-menu {
  border-right: none;
}

.kb-stats {
  margin-top: auto;
  padding: 16px;
  border-top: 1px solid #ebeef5;
}

.kb-stats h3 {
  margin-top: 0;
  margin-bottom: 12px;
  font-size: 16px;
  color: #606266;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
  color: #606266;
}

.stat-value {
  font-weight: bold;
  color: #409eff;
}

.kb-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.module-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.module-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.module-header h2 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.module-actions {
  display: flex;
  gap: 12px;
}

.files-container {
  margin-top: 16px;
}

.files-container.card {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.file-card {
  cursor: pointer;
  transition: all 0.3s;
}

.file-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.file-card.is-folder {
  background-color: #f5f7fa;
}

.file-icon {
  font-size: 32px;
  color: #409eff;
  margin-bottom: 8px;
  text-align: center;
}

.file-info {
  text-align: center;
}

.file-name {
  font-weight: bold;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
}

.file-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  opacity: 0;
  transition: opacity 0.3s;
}

.file-card:hover .file-actions {
  opacity: 1;
}

.corpus-tags {
  margin-bottom: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.el-tag {
  cursor: pointer;
}

.el-tag.active {
  background-color: #409eff;
  color: white;
  border-color: #409eff;
}

.corpus-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.corpus-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.corpus-header {
  margin-bottom: 12px;
}

.corpus-header h3 {
  margin-top: 0;
  margin-bottom: 8px;
  font-size: 18px;
}

.corpus-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.corpus-content {
  flex: 1;
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
}

.corpus-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
}

.corpus-date {
  font-size: 12px;
  color: #909399;
}

.corpus-actions {
  display: flex;
  gap: 8px;
}

.rag-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
}

.rag-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.rag-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.rag-header h3 {
  margin: 0;
  font-size: 18px;
}

.rag-info {
  flex: 1;
}

.rag-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}

.rag-stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #606266;
}

.rag-description {
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 16px;
}

.rag-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.rag-actions {
  display: flex;
  gap: 8px;
}

.rag-chat-container {
  height: 70vh;
  display: flex;
  flex-direction: column;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 16px;
}

.chat-message {
  display: flex;
  margin-bottom: 16px;
}

.chat-message.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #409eff;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 20px;
  margin: 0 12px;
}

.chat-message.user .message-avatar {
  background-color: #67c23a;
}

.message-content {
  max-width: 70%;
  background-color: white;
  padding: 12px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.chat-message.user .message-content {
  background-color: #ecf5ff;
}

.message-text {
  color: #303133;
  line-height: 1.5;
}

.message-time {
  text-align: right;
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.chat-input {
  display: flex;
  gap: 16px;
}

.upload-container {
  width: 100%;
}

@media (max-width: 768px) {
  .kb-main-content {
    flex-direction: column;
  }
  
  .kb-sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #ebeef5;
  }
  
  .files-container.card {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
  
  .corpus-list, .rag-list {
    grid-template-columns: 1fr;
  }
}
</style>