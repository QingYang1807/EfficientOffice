<template>
  <div class="ai-chat-container">
    <!-- 主内容区域 -->
    <div class="chat-main">
      <!-- 左侧菜单栏 -->
      <div class="menu-sidebar">
        <div class="menu-item active">
          <el-icon><ChatRound /></el-icon>
          <span class="menu-label">对话</span>
        </div>
        <div class="menu-item">
          <el-icon><Document /></el-icon>
          <span class="menu-label">文档</span>
        </div>
        <div class="menu-item">
          <el-icon><List /></el-icon>
          <span class="menu-label">任务</span>
        </div>
        <div class="menu-item">
          <el-icon><Setting /></el-icon>
          <span class="menu-label">设置</span>
        </div>
      </div>
      
      <!-- 中间对话列表栏 -->
      <div class="chat-sidebar" :class="{ collapsed: sidebarCollapsed }">
        <!-- 紧凑型头部设计 -->
        <div class="sidebar-header">
          <div class="new-chat-search-row">
            <el-button 
              type="primary" 
              class="new-chat-btn"
              @click="createNewChat"
              size="small"
            >
              <el-icon><Plus /></el-icon>
              新对话
            </el-button>
            
            <el-input
              v-model="searchQuery"
              placeholder="搜索历史..."
              class="search-input"
              prefix-icon="Search"
              clearable
              size="small"
            />
          </div>
        </div>

        <!-- 搜索结果指示器 -->
        <div class="search-result-indicator" v-if="searchQuery">
          <span>搜索结果: {{ filteredHistory.length }} 条对话</span>
          <span class="search-detail">(匹配{{ searchType }})</span>
          <el-button link size="small" @click="searchQuery = ''">
            <el-icon><Close /></el-icon>清除
          </el-button>
        </div>

        <!-- 历史记录列表 -->
        <div class="chat-history">
          <div class="history-category" v-if="pinnedHistory.length > 0">
            <div class="category-title">
              <el-icon><Star /></el-icon>
              <span>已固定对话</span>
            </div>
            <TransitionGroup name="list" tag="div" class="history-items-container">
              <div
                v-for="chat in pinnedHistory"
                :key="chat.id"
                class="history-item"
                :class="{ active: currentChatId === chat.id }"
                @click="loadChat(chat)"
              >
                <div class="history-item-content">
                  <div class="history-title-time">
                    <template v-if="editingChatId === chat.id">
                      <el-input
                        v-model="editingTitle"
                        size="small"
                        @click.stop
                        @keyup.enter="saveTitle(chat)"
                        @blur="handleBlur(chat)"
                        ref="titleInputRef"
                        :autofocus="true"
                      />
                    </template>
                    <div v-else class="history-title-container">
                      <el-icon><ChatRound /></el-icon>
                      <span class="history-title">{{ chat.title }}</span>
                      <span class="history-time">{{ formatTime(chat.time) }}</span>
                    </div>
                  </div>
                  
                  <!-- 匹配内容预览 -->
                  <div class="match-preview" v-if="searchQuery && getMatchContent(chat)">
                    <div class="match-content" v-html="getMatchContent(chat)"></div>
                  </div>
                  
                  <div class="history-actions">
                    <el-button 
                      circle
                      link 
                      size="small"
                      @click.stop="togglePin(chat)"
                    >
                      <el-icon><StarFilled /></el-icon>
                    </el-button>
                    <el-button 
                      circle
                      link 
                      size="small"
                      @click.stop="startEditTitle(chat)"
                    >
                      <el-icon><Edit /></el-icon>
                    </el-button>
                    <el-button 
                      circle
                      link 
                      type="danger" 
                      size="small"
                      @click.stop="deleteChat(chat)"
                    >
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </div>
                </div>
              </div>
            </TransitionGroup>
          </div>

          <div class="history-category">
            <div class="category-title">
              <el-icon><Clock /></el-icon>
              <span>最近对话</span>
            </div>
            <TransitionGroup name="list" tag="div" class="history-items-container">
              <div
                v-for="chat in unpinnedHistory"
                :key="chat.id"
                class="history-item"
                :class="{ active: currentChatId === chat.id }"
                @click="loadChat(chat)"
              >
                <div class="history-item-content">
                  <div class="history-title-time">
                    <template v-if="editingChatId === chat.id">
                      <el-input
                        v-model="editingTitle"
                        size="small"
                        @click.stop
                        @keyup.enter="saveTitle(chat)"
                        @blur="handleBlur(chat)"
                        ref="titleInputRef"
                        :autofocus="true"
                      />
                    </template>
                    <div v-else class="history-title-container">
                      <el-icon><ChatRound /></el-icon>
                      <span class="history-title">{{ chat.title }}</span>
                      <span class="history-time">{{ formatTime(chat.time) }}</span>
                    </div>
                  </div>
                  
                  <!-- 匹配内容预览 -->
                  <div class="match-preview" v-if="searchQuery && getMatchContent(chat)">
                    <div class="match-content" v-html="getMatchContent(chat)"></div>
                  </div>
                  
                  <div class="history-actions">
                    <el-button 
                      circle
                      link 
                      size="small"
                      @click.stop="togglePin(chat)"
                    >
                      <el-icon><Star /></el-icon>
                    </el-button>
                    <el-button 
                      circle
                      link 
                      size="small"
                      @click.stop="startEditTitle(chat)"
                    >
                      <el-icon><Edit /></el-icon>
                    </el-button>
                    <el-button 
                      circle
                      link 
                      type="danger" 
                      size="small"
                      @click.stop="deleteChat(chat)"
                    >
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </div>
                </div>
              </div>
            </TransitionGroup>
          </div>
        </div>

        <!-- 侧边栏控制区 -->
        <div class="sidebar-controls">
          <el-button 
            link 
            @click="toggleSidebar"
            class="sidebar-toggle"
          >
            <el-icon><ArrowLeft /></el-icon>
            收起
          </el-button>
        </div>
      </div>

      <!-- 右侧对话内容区 -->
      <div class="chat-content">
        <!-- 顶部工具栏 -->
        <div class="content-toolbar">
          <div class="toolbar-left">
            <el-button
              v-if="sidebarCollapsed"
              link
              @click="toggleSidebar"
              class="expand-sidebar-btn"
            >
              <el-icon><ArrowRight /></el-icon>
            </el-button>
            
            <div class="current-chat-info">
              <!-- <div class="app-logo"> -->
                <!-- <img src="/logo.png" alt="Logo" /> -->
                <!-- <span class="app-name">AI 助手</span> -->
              <!-- </div> -->
              <span class="current-chat-title">{{ currentChat.title }}</span>
              <el-tag size="small" class="model-tag">{{ getModelLabel(currentChat.currentModel || currentModel) }}</el-tag>
            </div>
          </div>
          
          <div class="toolbar-right">
            <el-dropdown trigger="click" @command="handleModelParamCommand">
              <el-button link>
                <el-icon><SetUp /></el-icon>
                参数设置
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <div class="dropdown-content param-settings-panel">
                    <h3 class="param-panel-title">模型参数设置</h3>
                    <div class="param-item">
                      <div class="param-label-row">
                        <span class="param-label">温度</span>
                        <el-input-number 
                          v-model="modelParams.temperature" 
                          :min="0" 
                          :max="2" 
                          :step="0.1" 
                          size="small"
                          controls-position="right"
                        />
                      </div>
                      <div class="param-description">
                        控制输出的随机性。较低的值使输出更确定，较高的值使输出更多样化。
                      </div>
                      <el-slider 
                        v-model="modelParams.temperature" 
                        :min="0" 
                        :max="2" 
                        :step="0.1" 
                        :format-tooltip="(val) => val.toFixed(1)"
                      />
                    </div>
                    <div class="param-item">
                      <div class="param-label-row">
                        <span class="param-label">最大输出</span>
                        <el-input-number 
                          v-model="modelParams.maxTokens" 
                          :min="256" 
                          :max="4096" 
                          :step="100" 
                          size="small"
                          controls-position="right"
                        />
                      </div>
                      <div class="param-description">
                        控制模型生成的最大标记数量。较高的值允许更长的回复。
                      </div>
                      <el-slider 
                        v-model="modelParams.maxTokens" 
                        :min="256" 
                        :max="4096" 
                        :step="100" 
                        :format-tooltip="(val) => val"
                      />
                    </div>
                    <div class="param-actions">
                      <el-button type="primary" size="small" @click="applyModelParams">应用</el-button>
                      <el-button size="small" @click="resetModelParams">重置</el-button>
                    </div>
                  </div>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            
            <el-dropdown trigger="click">
              <el-button link>
                <el-icon><Document /></el-icon>
                导出
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="exportAsMarkdown">
                    <el-icon><Document /></el-icon> 导出为 Markdown
                  </el-dropdown-item>
                  <el-dropdown-item @click="exportAsHTML">
                    <el-icon><Document /></el-icon> 导出为 HTML
                  </el-dropdown-item>
                  <el-dropdown-item @click="exportAsTXT">
                    <el-icon><Document /></el-icon> 导出为 TXT
                  </el-dropdown-item>
                  <el-dropdown-item @click="exportAsPNG">
                    <el-icon><Picture /></el-icon> 导出为 PNG
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            
            <!-- 模型下拉菜单 -->
            <el-dropdown trigger="click" class="model-dropdown">
              <el-button link>
                <el-icon><Select /></el-icon>
                模型
              </el-button>
              <template #dropdown>
                <el-dropdown-menu class="model-dropdown-menu">
                  <!-- OpenAI 模型 -->
                  <div class="model-group">
                    <div class="model-vendor">
                      <img src="../../src/assets/llm_logo/openai.png" class="vendor-logo" />
                      <span>OpenAI</span>
                    </div>
                    <el-dropdown-item 
                      v-for="model in openaiModels" 
                      :key="model.value"
                      @click="switchModel(model.value)"
                      :class="{ 'active-model': model.value === (currentChat.currentModel || currentModel) }"
                    >
                      <div class="model-option">
                        <img :src="model.avatar" class="model-avatar" />
                        <div class="model-info">
                          <div class="model-name">{{ model.label }}</div>
                          <div class="model-desc">{{ model.description }}</div>
                        </div>
                        <el-tag size="small" type="success" v-if="model.tag">{{ model.tag }}</el-tag>
                      </div>
                    </el-dropdown-item>
                  </div>
                  
                  <el-divider />
                  
                  <!-- Anthropic 模型 -->
                  <div class="model-group">
                    <div class="model-vendor">
                      <img src="../../src/assets/llm_logo/anthropic.png" class="vendor-logo" />
                      <span>Anthropic</span>
                    </div>
                    <el-dropdown-item 
                      v-for="model in anthropicModels" 
                      :key="model.value"
                      @click="switchModel(model.value)"
                      :class="{ 'active-model': model.value === (currentChat.currentModel || currentModel) }"
                    >
                      <div class="model-option">
                        <img :src="model.avatar" class="model-avatar" />
                        <div class="model-info">
                          <div class="model-name">{{ model.label }}</div>
                          <div class="model-desc">{{ model.description }}</div>
                        </div>
                        <el-tag size="small" type="success" v-if="model.tag">{{ model.tag }}</el-tag>
                      </div>
                    </el-dropdown-item>
                  </div>
                  
                  <el-divider />
                  
                  <!-- Google 模型 -->
                  <div class="model-group">
                    <div class="model-vendor">
                      <img src="../../src/assets/llm_logo/google.png" class="vendor-logo" />
                      <span>Google</span>
                    </div>
                    <el-dropdown-item 
                      v-for="model in googleModels" 
                      :key="model.value"
                      @click="switchModel(model.value)"
                      :class="{ 'active-model': model.value === (currentChat.currentModel || currentModel) }"
                    >
                      <div class="model-option">
                        <img :src="model.avatar" class="model-avatar" />
                        <div class="model-info">
                          <div class="model-name">{{ model.label }}</div>
                          <div class="model-desc">{{ model.description }}</div>
                        </div>
                        <el-tag size="small" type="success" v-if="model.tag">{{ model.tag }}</el-tag>
                      </div>
                    </el-dropdown-item>
                  </div>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            
            <!-- 添加明暗切换按钮 -->
            <el-button-group class="theme-toggle">
              <el-button 
                :type="isDarkTheme ? 'default' : 'primary'" 
                @click="toggleTheme(false)"
                size="small"
              >
                <el-icon><Sunny /></el-icon>
              </el-button>
              <el-button 
                :type="isDarkTheme ? 'primary' : 'default'" 
                @click="toggleTheme(true)"
                size="small"
              >
                <el-icon><Moon /></el-icon>
              </el-button>
            </el-button-group>
            
            <!-- 添加设置和快捷键下拉菜单 -->
            <el-dropdown trigger="click">
              <el-avatar :src="userAvatar" size="small" />
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="showSettings = true">
                    <el-icon><Setting /></el-icon>设置
                  </el-dropdown-item>
                  <el-dropdown-item @click="showKeyboardShortcuts = true">
                    <el-icon><Document /></el-icon>快捷键
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>

        <!-- 消息容器 -->
        <div class="message-container" ref="messagesContainer">
          <!-- 选择操作区 -->
          <div class="selected-actions" v-if="selectedMessages.length > 0">
            <div class="selection-info">已选择 {{ selectedMessages.length }} 条消息</div>
            <div class="action-buttons">
              <el-button size="small" @click="copySelectedMessages">
                <el-icon><Document /></el-icon>
                复制
              </el-button>
              <el-button size="small" @click="exportSelectedAsImage">
                <el-icon><Picture /></el-icon>
                导出为图片
              </el-button>
              <el-button size="small" type="danger" @click="deleteSelectedMessages">
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
              <el-button size="small" @click="clearSelection">
                <el-icon><Close /></el-icon>
                取消选择
              </el-button>
            </div>
          </div>
        
          <!-- 消息列表 -->
          <div v-if="currentChat.messages.length === 0" class="empty-chat">
            <div class="empty-chat-content">
              <div class="model-info">
                <img :src="getCurrentModelAvatar()" class="model-avatar" />
                <h2>{{ getModelLabel(currentChat.currentModel || currentModel) }}</h2>
              </div>
              <p class="model-description">
                优秀的通用型AI助手，可以回答各种问题、编写文本、分析数据等
              </p>
              
              <!-- 建议提示 -->
              <div class="suggestion-title">你可以尝试问我：</div>
              <div class="suggestion-chips">
                <div 
                  v-for="(suggestion, index) in suggestions" 
                  :key="index" 
                  class="suggestion-chip"
                  @click="applySuggestion(suggestion)"
                >
                  {{ suggestion }}
                </div>
              </div>
            </div>
          </div>
          
          <template v-else>
            <div 
              v-for="(message, index) in currentChat.messages" 
              :key="index"
              :class="[
                'message-item', 
                message.role, 
                { 'selected': selectedMessages.includes(message) }
              ]"
              @click="handleMessageClick($event, message)"
              @contextmenu.prevent="openContextMenu($event, message, index)"
            >
              <!-- 消息内容 -->
              <div class="message-content">
                <div class="message-header">
                  <div class="message-avatar">
                    <el-avatar 
                      :size="36" 
                      :src="message.role === 'user' ? userAvatar : getCurrentModelAvatar()"
                    />
                  </div>
                  <div class="message-role">
                    {{ message.role === 'user' ? '用户' : getModelLabel(currentChat.currentModel || currentModel) }}
                  </div>
                  <div class="message-time">{{ formatTime(message.time || currentChat.time) }}</div>
                </div>
                <div class="message-body">{{ message.content }}</div>
                <div class="message-actions">
                  <el-button link size="small" @click.stop="copyMessage(message)">
                    <el-icon><Document /></el-icon>复制
                  </el-button>
                  <el-button link size="small" @click.stop="editMessage(message, index)" v-if="message.role === 'user'">
                    <el-icon><Edit /></el-icon>编辑
                  </el-button>
                  <el-button link size="small" type="danger" @click.stop="deleteMessage(index)">
                    <el-icon><Delete /></el-icon>删除
                  </el-button>
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- 输入区域 -->
        <div class="input-area" :class="{ 'folded': inputFolded }">
          <!-- 折叠控制按钮 -->
          <div class="fold-control" @click="toggleInputFold">
            <el-icon v-if="inputFolded"><ArrowUp /></el-icon>
            <el-icon v-else><ArrowDown /></el-icon>
            {{ inputFolded ? '展开' : '收起' }}
          </div>
          
          <!-- 折叠状态的输入区 -->
          <div v-if="inputFolded" class="folded-input-area" @click="toggleInputFold">
            <el-icon><ChatRound /></el-icon>
            <span>点击展开输入框</span>
          </div>
          
          <!-- 正常状态的输入区 -->
          <div v-else class="normal-input-area">
            <!-- 附件预览区 -->
            <div class="attachments-container" v-if="hasAttachments">
              <!-- 附件内容 -->
            </div>
            
            <!-- 录音状态 -->
            <div class="recording-container" v-if="isRecording">
              <!-- 录音内容 -->
            </div>
            
            <!-- 输入框 -->
            <div class="message-input" v-else>
              <el-input
                v-model="userInput"
                type="textarea"
                :autosize="{ minRows: 3, maxRows: 5 }"
                placeholder="输入消息，Ctrl+Enter 发送..."
                @keydown.ctrl.enter="sendMessage"
              />
              
              <!-- 附件工具栏 -->
              <div class="attachment-tools">
                <div class="attachment-tool" @click="imageUpload.click()">
                  <el-icon><Picture /></el-icon>
                </div>
                <div class="attachment-tool" @click="fileUpload.click()">
                  <el-icon><Upload /></el-icon>
                </div>
                <div class="attachment-tool" @click="startRecording">
                  <el-icon><Microphone /></el-icon>
                </div>
              </div>
              
              <!-- 发送按钮 -->
              <el-button
                circle
                class="send-btn"
                :disabled="!userInput.trim() && !hasAttachments"
                @click="sendMessage"
              >
                <el-icon><Position /></el-icon>
              </el-button>
              
              <!-- 隐藏的文件上传输入 -->
              <input 
                type="file"
                ref="imageUpload"
                accept="image/*"
                style="display: none"
                @change="handleImageUpload"
              />
              <input 
                type="file"
                ref="fileUpload"
                style="display: none"
                @change="handleFileUpload"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import { ChatRound, Star, Clock, Plus, Edit, Delete, StarFilled, 
  ArrowLeft, ArrowRight, Document, Setting, Sunny, Moon, Close, 
  List, SetUp, Position, Picture, Upload, Microphone, Select } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

export default {
  name: 'AIChatView',
  components: {
    ChatRound, Star, Clock, Plus, Edit, Delete, StarFilled, 
    ArrowLeft, ArrowRight, Document, Setting, Sunny, Moon, Close, 
    List, SetUp, Position, Picture, Upload, Microphone, Select
  },
  setup() {
    // 基础状态
    const isDarkTheme = ref(false);
    const sidebarCollapsed = ref(false);
    const sidebarWidth = ref(280);
    const inputFolded = ref(false);
    const userAvatar = ref('https://api.dicebear.com/7.x/avataaars/svg?seed=68');
    const showSettings = ref(false);
    const showKeyboardShortcuts = ref(false);
    
    // 聊天相关状态
    const searchQuery = ref('');
    const searchType = ref('标题和内容');
    const editingChatId = ref(null);
    const editingTitle = ref('');
    const currentChatId = ref(null);
    const selectedMessages = ref([]);
    const userInput = ref('');
    const currentModel = ref('gpt-3.5-turbo');
    const titleInputRef = ref(null);
    
    // 模型设置
    const modelSettings = ref({
      fontSize: 14,
      lineHeight: 1.6
    });
    
    // 模型参数
    const modelParams = ref({
      temperature: 0.7,
      maxTokens: 2048
    });
    
    // 模拟数据
    const chatHistory = ref([
      {
        id: '1',
        title: '关于人工智能的讨论',
        time: new Date().getTime() - 3600000,
        messages: [
          { role: 'user', content: '什么是人工智能？' },
          { role: 'assistant', content: '人工智能是计算机科学的一个分支，致力于创造能够模拟人类智能的系统。' }
        ],
        pinned: true,
        currentModel: 'gpt-3.5-turbo'
      },
      {
        id: '2',
        title: '编程问题解答',
        time: new Date().getTime() - 7200000,
        messages: [
          { role: 'user', content: '如何用JavaScript实现深拷贝？' },
          { role: 'assistant', content: '可以使用JSON.parse(JSON.stringify(obj))或者使用递归函数实现深拷贝。' }
        ],
        pinned: false,
        currentModel: 'gpt-4'
      }
    ]);
    
    // 当前聊天
    const currentChat = computed(() => {
      return chatHistory.value.find(chat => chat.id === currentChatId.value) || {
        id: 'new',
        title: '新对话',
        time: new Date().getTime(),
        messages: [],
        pinned: false,
        currentModel: currentModel.value
      };
    });
    
    // 固定和未固定的历史记录
    const pinnedHistory = computed(() => {
      return chatHistory.value.filter(chat => chat.pinned);
    });
    
    const unpinnedHistory = computed(() => {
      return chatHistory.value.filter(chat => !chat.pinned);
    });
    
    // 过滤后的历史记录
    const filteredHistory = computed(() => {
      if (!searchQuery.value) return chatHistory.value;
      
      return chatHistory.value.filter(chat => {
        const titleMatch = chat.title.toLowerCase().includes(searchQuery.value.toLowerCase());
        const contentMatch = chat.messages.some(msg => 
          msg.content.toLowerCase().includes(searchQuery.value.toLowerCase())
        );
        
        return searchType.value === '仅标题' ? titleMatch : (titleMatch || contentMatch);
      });
    });
    
    // 模型选项按厂商分组
    const openaiModels = [
      { 
        value: 'gpt-3.5-turbo', 
        label: 'GPT-3.5 Turbo', 
        avatar: 'https://api.dicebear.com/9.x/fun-emoji/svg?seed=George',
        description: '快速、经济的通用模型',
        tag: '推荐'
      },
      { 
        value: 'gpt-4', 
        label: 'GPT-4', 
        avatar: 'https://api.dicebear.com/9.x/fun-emoji/svg?seed=George',
        description: '更强大的推理和创意能力',
      },
      { 
        value: 'gpt-4-turbo', 
        label: 'GPT-4 Turbo', 
        avatar: 'https://api.dicebear.com/9.x/fun-emoji/svg?seed=George',
        description: '更快速的GPT-4版本',
        tag: '新'
      }
    ];
    
    const anthropicModels = [
      { 
        value: 'claude-3-opus', 
        label: 'Claude 3 Opus', 
        avatar: '../../src/assets/llm_logo/claude.png',
        description: '最强大的Claude模型',
        tag: '高级'
      },
      { 
        value: 'claude-3-sonnet', 
        label: 'Claude 3 Sonnet', 
        avatar: '../../src/assets/llm_logo/claude.png',
        description: '平衡性能与速度',
        tag: '推荐'
      },
      { 
        value: 'claude-3-haiku', 
        label: 'Claude 3 Haiku', 
        avatar: '/llm_logo/claude.png',
        description: '快速响应的轻量级模型',
      }
    ];
    
    const googleModels = [
      { 
        value: 'gemini-pro', 
        label: 'Gemini Pro', 
        avatar: '../../src/assets/llm_logo/gemini.png',
        description: '谷歌多模态大语言模型',
        tag: '推荐'
      },
      { 
        value: 'gemini-ultra', 
        label: 'Gemini Ultra', 
        avatar: '../../src/assets/llm_logo/gemini.png',
        description: '谷歌最强大的AI模型',
        tag: '高级'
      }
    ];
    
    // 合并所有模型选项用于其他功能
    const modelOptions = computed(() => {
      return [...openaiModels, ...anthropicModels, ...googleModels];
    });
    
    // 建议提示
    const suggestions = [
      '解释量子计算的基本原理',
      '帮我写一个简单的React组件',
      '如何提高英语口语水平？',
      '分析当前全球经济形势'
    ];
    
    // 方法
    const toggleTheme = (isDark) => {
      isDarkTheme.value = isDark;
      document.documentElement.classList.toggle('dark', isDark);
    };
    
    const toggleSidebar = () => {
      sidebarCollapsed.value = !sidebarCollapsed.value;
    };
    
    const toggleInputFold = () => {
      inputFolded.value = !inputFolded.value;
    };
    
    const createNewChat = () => {
      const newChat = {
        id: Date.now().toString(),
        title: '新对话',
        time: new Date().getTime(),
        messages: [],
        pinned: false,
        currentModel: currentModel.value
      };
      
      chatHistory.value.unshift(newChat);
      currentChatId.value = newChat.id;
      
      // 清空用户输入
      userInput.value = '';
      // 清空选中的消息
      selectedMessages.value = [];
    };
    
    const loadChat = (chat) => {
      currentChatId.value = chat.id;
    };
    
    const togglePin = (chat) => {
      chat.pinned = !chat.pinned;
    };
    
    const startEditTitle = (chat) => {
      editingChatId.value = chat.id;
      editingTitle.value = chat.title;
      // 在下一个DOM更新周期后聚焦输入框
      setTimeout(() => {
        if (titleInputRef.value) {
          titleInputRef.value.focus();
        }
      }, 0);
    };
    
    const saveTitle = (chat) => {
      chat.title = editingTitle.value || '新对话';
      editingChatId.value = null;
    };
    
    const handleBlur = (chat) => {
      saveTitle(chat);
    };
    
    const deleteChat = (chat) => {
      const index = chatHistory.value.findIndex(c => c.id === chat.id);
      if (index !== -1) {
        chatHistory.value.splice(index, 1);
        if (currentChatId.value === chat.id) {
          currentChatId.value = chatHistory.value.length > 0 ? chatHistory.value[0].id : null;
        }
      }
    };
    
    const formatTime = (timestamp) => {
      const date = new Date(timestamp);
      const now = new Date();
      const diff = now - date;
      
      // 如果是今天，只显示时间
      if (diff < 24 * 60 * 60 * 1000 && 
          date.getDate() === now.getDate() &&
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()) {
        return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
      }
      
      // 如果是昨天，显示"昨天"
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      if (date.getDate() === yesterday.getDate() &&
          date.getMonth() === yesterday.getMonth() &&
          date.getFullYear() === yesterday.getFullYear()) {
        return '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
      }
      
      // 如果是今年，显示月日
      if (date.getFullYear() === now.getFullYear()) {
        return (date.getMonth() + 1) + '月' + date.getDate() + '日';
      }
      
      // 其他情况显示年月日
      return date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + date.getDate();
    };
    
    const getMatchContent = (chat) => {
      if (!searchQuery.value) return '';
      
      const matchedMessage = chat.messages.find(msg => 
        msg.content.toLowerCase().includes(searchQuery.value.toLowerCase())
      );
      
      if (!matchedMessage) return '';
      
      const content = matchedMessage.content;
      const index = content.toLowerCase().indexOf(searchQuery.value.toLowerCase());
      const start = Math.max(0, index - 20);
      const end = Math.min(content.length, index + searchQuery.value.length + 20);
      let snippet = content.substring(start, end);
      
      if (start > 0) snippet = '...' + snippet;
      if (end < content.length) snippet += '...';
      
      return snippet.replace(
        new RegExp(searchQuery.value, 'gi'),
        match => `<span class="highlight">${match}</span>`
      );
    };
    
    const getModelLabel = (modelId) => {
      const model = modelOptions.value.find(m => m.value === modelId);
      return model ? model.label : modelId;
    };
    
    const getCurrentModelAvatar = () => {
      const model = modelOptions.value.find(m => m.value === (currentChat.value.currentModel || currentModel.value));
      return model ? model.avatar : '../../src/assets/llm_logo/default_model.png';
    };
    
    const switchModel = (modelId) => {
      if (currentChat.value.id !== 'new') {
        currentChat.value.currentModel = modelId;
      } else {
        currentModel.value = modelId;
      }
    };
    
    const handleModelParamCommand = (command) => {
      if (command === 'reset') {
        resetModelParams();
      } else if (command === 'apply') {
        applyModelParams();
      }
    };
    
    const applyModelParams = () => {
      ElMessage({
        message: '参数设置已应用',
        type: 'success'
      });
    };
    
    const resetModelParams = () => {
      modelParams.value = {
        temperature: 0.7,
        maxTokens: 2048
      };
      ElMessage({
        message: '参数已重置为默认值',
        type: 'info'
      });
    };
    
    const exportAsMarkdown = () => {
      const content = formatChatAsMarkdown();
      downloadFile(content, `${currentChat.value.title}.md`, 'text/markdown');
    };
    
    const exportAsHTML = () => {
      const content = formatChatAsHTML();
      downloadFile(content, `${currentChat.value.title}.html`, 'text/html');
    };
    
    const exportAsTXT = () => {
      const content = formatChatAsText();
      downloadFile(content, `${currentChat.value.title}.txt`, 'text/plain');
    };
    
    const exportAsPNG = () => {
      // 使用html2canvas将对话内容转换为图片
      import('html2canvas').then(html2canvas => {
        const messagesEl = document.querySelector('.message-container');
        if (!messagesEl) return;
        
        ElMessage({
          message: '正在生成图片，请稍候...',
          type: 'info'
        });
        
        html2canvas.default(messagesEl).then(canvas => {
          const link = document.createElement('a');
          link.download = `${currentChat.value.title}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
        });
      }).catch(err => {
        console.error('导出为PNG失败:', err);
        ElMessage({
          message: '导出为PNG失败，请重试',
          type: 'error'
        });
      });
    };
    
    const formatChatAsMarkdown = () => {
      let md = `# ${currentChat.value.title}\n\n`;
      md += `模型: ${getModelLabel(currentChat.value.currentModel || currentModel.value)}\n\n`;
      
      currentChat.value.messages.forEach(msg => {
        const role = msg.role === 'user' ? '用户' : 'AI';
        md += `## ${role}\n\n${msg.content}\n\n`;
      });
      
      return md;
    };
    
    const formatChatAsHTML = () => {
      let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${currentChat.value.title}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    .message { margin-bottom: 20px; padding: 15px; border-radius: 10px; }
    .user { background-color: #f0f9ff; }
    .assistant { background-color: #f9f9f9; }
    .role { font-weight: bold; margin-bottom: 5px; }
  </style>
</head>
<body>
  <h1>${currentChat.value.title}</h1>
  <p>模型: ${getModelLabel(currentChat.value.currentModel || currentModel.value)}</p>
`;
      
      currentChat.value.messages.forEach(msg => {
        const role = msg.role === 'user' ? '用户' : 'AI';
        html += `  <div class="message ${msg.role}">
    <div class="role">${role}</div>
    <div class="content">${msg.content.replace(/\n/g, '<br>')}</div>
  </div>
`;
      });
      
      html += `</body>
</html>`;
      
      return html;
    };
    
    const formatChatAsText = () => {
      let txt = `${currentChat.value.title}\n`;
      txt += `模型: ${getModelLabel(currentChat.value.currentModel || currentModel.value)}\n\n`;
      
      currentChat.value.messages.forEach(msg => {
        const role = msg.role === 'user' ? '用户' : 'AI';
        txt += `[${role}]\n${msg.content}\n\n`;
      });
      
      return txt;
    };
    
    const downloadFile = (content, filename, contentType) => {
      const blob = new Blob([content], { type: contentType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
      
      ElMessage({
        message: `已导出为 ${filename}`,
        type: 'success'
      });
    };
    
    const sendMessage = () => {
      if (!userInput.value.trim() && !hasAttachments.value) return;
      
      const newMessage = {
        role: 'user',
        content: userInput.value,
        time: new Date().getTime()
      };
      
      currentChat.value.messages.push(newMessage);
      userInput.value = '';
      
      // 模拟AI回复
      setTimeout(() => {
        currentChat.value.messages.push({
          role: 'assistant',
          content: '这是一个模拟的AI回复。在实际应用中，这里会调用AI API获取回复。',
          time: new Date().getTime()
        });
      }, 1000);
    };
    
    const applySuggestion = (suggestion) => {
      userInput.value = suggestion;
    };
    
    const handleMessageClick = (event, message) => {
      if (event.ctrlKey || event.metaKey) {
        if (selectedMessages.value.includes(message)) {
          selectedMessages.value = selectedMessages.value.filter(m => m !== message);
        } else {
          selectedMessages.value.push(message);
        }
      }
    };
    
    const clearSelection = () => {
      selectedMessages.value = [];
    };
    
    const copySelectedMessages = () => {
      // 复制选中消息的实现
      console.log('复制选中消息');
      clearSelection();
    };
    
    const exportSelectedAsImage = () => {
      // 导出选中消息为图片的实现
      console.log('导出选中消息为图片');
      clearSelection();
    };
    
    const deleteSelectedMessages = () => {
      // 删除选中消息的实现
      console.log('删除选中消息');
      clearSelection();
    };
    
    const openContextMenu = (event, message, index) => {
      // 打开上下文菜单的实现
      console.log('打开上下文菜单', message, index);
    };
    
    // 附件相关
    const hasAttachments = ref(false);
    const isRecording = ref(false);
    
    const imageUpload = ref(null);
    const fileUpload = ref(null);
    
    const handleImageUpload = () => {
      // 处理图片上传
      console.log('处理图片上传');
      hasAttachments.value = true;
    };
    
    const handleFileUpload = () => {
      // 处理文件上传
      console.log('处理文件上传');
      hasAttachments.value = true;
    };
    
    const startRecording = () => {
      // 开始录音
      console.log('开始录音');
      isRecording.value = true;
    };
    
    const copyMessage = (message) => {
      navigator.clipboard.writeText(message.content)
        .then(() => {
          ElMessage({
            message: '消息已复制到剪贴板',
            type: 'success'
          });
        })
        .catch(() => {
          ElMessage({
            message: '复制失败，请手动复制',
            type: 'error'
          });
        });
    };
    
    const editMessage = (message, index) => {
      userInput.value = message.content;
      // 可选：删除该消息及其后的所有消息
      currentChat.value.messages = currentChat.value.messages.slice(0, index);
    };
    
    const deleteMessage = (index) => {
      // 删除单个消息
      currentChat.value.messages.splice(index, 1);
    };
    
    // 初始化
    onMounted(() => {
      // 加载上次的主题设置
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark') {
        toggleTheme(true);
      }
      
      // 如果有历史记录，加载第一个聊天
      if (chatHistory.value.length > 0) {
        currentChatId.value = chatHistory.value[0].id;
      }
    });
    
    return {
      // 状态
      isDarkTheme,
      sidebarCollapsed,
      sidebarWidth,
      inputFolded,
      userAvatar,
      showSettings,
      showKeyboardShortcuts,
      searchQuery,
      searchType,
      editingChatId,
      editingTitle,
      currentChatId,
      selectedMessages,
      userInput,
      currentModel,
      modelParams,
      modelSettings,
      chatHistory,
      currentChat,
      pinnedHistory,
      unpinnedHistory,
      filteredHistory,
      modelOptions,
      suggestions,
      hasAttachments,
      isRecording,
      imageUpload,
      fileUpload,
      titleInputRef,
      openaiModels,
      anthropicModels,
      googleModels,
      
      // 方法
      toggleTheme,
      toggleSidebar,
      toggleInputFold,
      createNewChat,
      loadChat,
      togglePin,
      startEditTitle,
      saveTitle,
      handleBlur,
      deleteChat,
      formatTime,
      getMatchContent,
      getModelLabel,
      getCurrentModelAvatar,
      switchModel,
      handleModelParamCommand,
      applyModelParams,
      resetModelParams,
      exportAsMarkdown,
      exportAsHTML,
      exportAsTXT,
      exportAsPNG,
      sendMessage,
      applySuggestion,
      handleMessageClick,
      clearSelection,
      copySelectedMessages,
      exportSelectedAsImage,
      deleteSelectedMessages,
      openContextMenu,
      handleImageUpload,
      handleFileUpload,
      startRecording,
      copyMessage,
      editMessage,
      deleteMessage,
      
      // 图标
      ChatRound, Star, Clock, Plus, Edit, Delete, StarFilled, 
      ArrowLeft, ArrowRight, Document, Setting, Sunny, Moon, Close, 
      List, SetUp, Position, Picture, Upload, Microphone, Select
    };
  }
};
</script>

<style scoped>
/* 主容器 */
.ai-chat-container {
  display: flex;
  flex-direction: column;
  height: 100%; /* 改为100%而不是100vh */
  width: 100%;
  overflow: hidden;
  background-color: var(--el-bg-color-page);
  color: var(--el-text-color-primary);
  position: relative; /* 改为relative */
}

/* 主内容区域 */
.chat-main {
  display: flex;
  flex: 1;
  overflow: hidden;
  position: relative;
  height: 100%; /* 改为100%而不是100vh */
}

/* 左侧菜单栏 - 移除或隐藏，因为已经有主布局的侧边栏 */
.menu-sidebar {
  display: none; /* 隐藏左侧菜单栏 */
}

/* 中间对话列表栏 */
.chat-sidebar {
  width: 280px;
  height: 100%;
  border-right: 1px solid var(--el-border-color-lighter);
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  flex-shrink: 0;
  overflow: hidden;
}

.chat-sidebar.collapsed {
  width: 0;
  min-width: 0;
  border-right: none;
}

/* 侧边栏头部 */
.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.new-chat-search-row {
  display: flex;
  gap: 8px;
}

.new-chat-btn {
  flex-shrink: 0;
}

.search-input {
  flex: 1;
}

/* 搜索结果指示器 */
.search-result-indicator {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background-color: var(--el-color-primary-light-9);
  font-size: 12px;
}

.search-detail {
  color: var(--el-text-color-secondary);
  margin-left: 4px;
}

/* 历史记录列表 */
.chat-history {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 16px;
}

.category-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 12px;
  color: var(--el-text-color-secondary);
}

.history-items-container {
  margin-bottom: 20px;
}

.history-item {
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  margin-bottom: 8px;
  background-color: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color-lighter);
}

.history-item:hover {
  background-color: var(--el-fill-color-light);
  transform: translateX(4px);
  border-color: var(--el-border-color);
}

.history-item.active {
  background-color: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-5);
}

.history-item-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-title-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.history-title {
  flex: 1;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-time {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.history-actions {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.history-item:hover .history-actions {
  opacity: 1;
}

.match-preview {
  background-color: var(--el-fill-color-lighter);
  padding: 8px;
  border-radius: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.match-content {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* 侧边栏控制区 */
.sidebar-controls {
  padding: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
  display: flex;
  justify-content: center;
}

/* 右侧对话内容区 */
.chat-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background-color: var(--el-bg-color-page);
  min-width: 0;
  max-width: 100%; /* 改为100% */
}

/* 当侧边栏折叠时调整内容区宽度 */
.chat-sidebar.collapsed + .chat-content {
  max-width: calc(100vw - 80px);
}

/* 顶部工具栏 */
.content-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
  height: 60px; /* 固定高度 */
}

.toolbar-left, .toolbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.current-chat-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.app-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-right: 16px;
}

.app-logo img {
  width: 28px;
  height: 28px;
}

.app-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-color-primary);
}

.current-chat-title {
  font-weight: 600;
  font-size: 16px;
}

.model-tag {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  border: none;
}

/* 消息容器 */
.message-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 20px;
  background-color: var(--el-bg-color-page);
  scroll-behavior: smooth;
  width: 100%;
  max-height: calc(100% - 60px - 120px); /* 使用百分比 */
  height: auto;
}

/* 选择操作区 */
.selected-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: var(--el-color-primary-light-9);
  border-radius: 8px;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.selection-info {
  font-weight: 500;
  color: var(--el-color-primary);
}

.action-buttons {
  display: flex;
  gap: 8px;
}

/* 空白对话提示 */
.empty-chat {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding: 20px;
}

.empty-chat-content {
  max-width: 600px;
  padding: 40px;
  border-radius: 16px;
  background-color: var(--el-bg-color);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  text-align: center;
}

.model-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 24px;
}

.model-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.model-description {
  color: var(--el-text-color-secondary);
  margin-bottom: 30px;
  line-height: 1.6;
}

.suggestion-title {
  font-weight: 500;
  margin-bottom: 16px;
}

.suggestion-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
}

.suggestion-chip {
  padding: 12px 20px;
  background-color: var(--el-fill-color-light);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.suggestion-chip:hover {
  transform: translateY(-4px) scale(1.05);
  background-color: var(--el-color-primary-light-9);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
}

/* 消息项 */
.message-item {
  display: flex;
  gap: 16px;
  padding: 16px;
  margin-bottom: 20px;
  border-radius: 12px;
  transition: all 0.3s ease;
  background-color: var(--el-bg-color);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  max-width: 100%;
  word-break: break-word;
  overflow-wrap: break-word;
}

.message-item:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.message-item.selected {
  background-color: var(--el-color-primary-light-9);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.message-item.user {
  background-color: var(--el-color-primary-light-9);
}

.message-content {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.message-role {
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.message-time {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-left: auto;
}

.message-body {
  line-height: 1.6;
  white-space: pre-wrap;
}

.message-actions {
  display: flex;
  gap: 12px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.message-item:hover .message-actions {
  opacity: 1;
}

.message-item.assistant {
  background-color: var(--el-bg-color);
}

.highlight {
  background-color: var(--el-color-warning-light-9);
  padding: 0 2px;
  border-radius: 2px;
}

/* 输入区域 */
.input-area {
  height: auto;
  max-height: 120px;
  min-height: 120px;
  padding: 16px 20px;
  border-top: 1px solid var(--el-border-color-lighter);
  background-color: var(--el-bg-color);
  position: relative;
  flex-shrink: 0;
}

.input-area.folded {
  min-height: 60px;
  max-height: 60px;
  padding: 10px 20px;
  overflow: hidden;
}

/* 折叠控制按钮 */
.fold-control {
  position: absolute;
  top: -14px;
  left: 50%;
  transform: translateX(-50%);
  background-color: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  z-index: 2;
  box-shadow: 0 -2px 6px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.fold-control:hover {
  background-color: var(--el-fill-color-light);
}

/* 折叠状态的输入区 */
.folded-input-area {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border-radius: 8px;
  background-color: var(--el-fill-color-light);
  cursor: pointer;
  transition: all 0.2s ease;
  height: 100%;
}

.folded-input-area:hover {
  background-color: var(--el-fill-color);
  transform: translateY(-2px);
}

/* 消息输入框 */
.message-input {
  position: relative;
  border-radius: 12px;
  background-color: var(--el-fill-color-light);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  padding: 8px 60px 8px 16px; /* 右侧留出发送按钮的空间 */
  height: calc(100% - 16px); /* 减去上下padding */
  display: flex;
  flex-direction: column;
}

.message-input:focus-within {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
  background-color: var(--el-bg-color);
}

.message-input .el-textarea {
  border: none;
  background: transparent;
  height: 100%;
}

.message-input .el-textarea__inner {
  min-height: 60px !important; /* 固定最小高度 */
  max-height: 80px !important; /* 最大高度 */
  height: 100%;
  padding: 0;
  border: none;
  background: transparent;
  box-shadow: none;
  resize: none; /* 禁止手动调整大小 */
}

/* 发送按钮 - 放在输入框内 */
.send-btn {
  position: absolute;
  right: 12px;
  bottom: 12px;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  background-color: var(--el-color-primary);
  color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.send-btn:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.send-btn .el-icon {
  font-size: 18px;
}

/* 附件工具栏 */
.attachment-tools {
  display: flex;
  gap: 8px;
  position: absolute;
  left: 16px;
  bottom: 12px;
}

.attachment-tool {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--el-fill-color);
  transition: all 0.2s ease;
  cursor: pointer;
}

.attachment-tool:hover {
  background-color: var(--el-fill-color-darker);
  transform: translateY(-2px);
}

/* 响应式布局调整 */
@media (max-width: 1200px) {
  .chat-content {
    max-width: calc(100% - 280px); /* 使用百分比 */
  }
}

@media (max-width: 992px) {
  .chat-content {
    max-width: calc(100% - 200px); /* 使用百分比 */
  }
  
  .chat-sidebar {
    width: 200px;
  }
}

@media (max-width: 768px) {
  .chat-content {
    max-width: 100%;
  }
  
  .message-container {
    max-height: calc(100% - 50px - 100px);
  }
}

/* 自定义滚动条 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background-color: var(--el-border-color);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background-color: var(--el-text-color-secondary);
}

/* 模型下拉菜单样式 */
.model-dropdown-menu {
  width: 320px;
  max-height: 500px;
  overflow-y: auto;
  padding: 0;
}

.model-group {
  padding: 8px 0;
}

.model-vendor {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.vendor-logo {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  object-fit: contain;
}

.model-option {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 4px 0;
}

.model-avatar {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  object-fit: cover;
}

.model-info {
  flex: 1;
  min-width: 0;
}

.model-name {
  font-weight: 500;
  margin-bottom: 2px;
}

.model-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.active-model {
  background-color: var(--el-color-primary-light-9) !important;
}

.active-model .model-name {
  color: var(--el-color-primary);
}

/* 分割线样式 */
.el-divider {
  margin: 4px 0;
}

/* 悬浮效果 */
.model-option:hover {
  transform: translateX(4px);
  transition: transform 0.3s ease;
}

/* 参数设置面板 */
.param-settings-panel {
  width: 380px;
  padding: 16px;
}

.param-panel-title {
  margin-top: 0;
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  text-align: center;
}

.param-item {
  margin-bottom: 20px;
}

.param-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.param-label {
  font-weight: 500;
  font-size: 14px;
}

.param-description {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 8px;
  line-height: 1.4;
}

.param-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}

.dropdown-content {
  padding: 16px;
}
</style>