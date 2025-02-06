<template>
  <div class="ai-chat-container">
    <!-- 左侧边栏 -->
    <div class="sidebar">
      <!-- 新建对话按钮 -->
      <el-button 
        type="primary" 
        class="new-chat-btn"
        @click="createNewChat"
      >
        <el-icon><Plus /></el-icon>
        新建对话
      </el-button>

      <!-- 模型选择 -->
      <div class="model-selector">
        <el-select 
          v-model="currentModel" 
          class="model-select"
          popper-class="model-select-dropdown"
        >
          <el-option
            v-for="option in modelOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          >
            <div class="model-option">
              <div class="model-info">
                <div class="model-name">{{ option.label }}</div>
                <div class="model-desc">{{ option.description }}</div>
              </div>
              <el-tag size="small" type="info" v-if="option.tag">
                {{ option.tag }}
              </el-tag>
            </div>
          </el-option>
        </el-select>
      </div>

      <!-- 历史记录列表 -->
      <div class="chat-history">
        <div
          v-for="(chat, index) in filteredHistory"
          :key="chat.id"
          class="history-item"
          :class="{ active: currentChatId === chat.id }"
          @click="loadChat(chat)"
        >
          <div class="history-content">
            <el-icon><ChatRound /></el-icon>
            <div class="chat-title-wrapper">
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
              <span v-else class="chat-title">{{ chat.title }}</span>
            </div>
          </div>
          <div class="history-actions">
            <el-button 
              link 
              size="small"
              @click.stop="startEditTitle(chat)"
            >
              <el-icon><Edit /></el-icon>
            </el-button>
            <el-button 
              link 
              type="danger" 
              size="small"
              @click.stop="deleteChat(index)"
            >
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>
      </div>

      <!-- 底部设置按钮 -->
      <div class="sidebar-footer">
        <el-button 
          link 
          @click="showSettings = true"
        >
          <el-icon><Setting /></el-icon>
          设置
        </el-button>
      </div>
    </div>

    <!-- 右侧对话区域 -->
    <div class="chat-area">
      <!-- 对话内容 -->
      <div class="messages" ref="messagesContainer">
        <div class="messages-wrapper" v-if="currentChat.messages.length">
          <!-- 当前模型标记 -->
          <div class="model-indicator">
            <el-tag size="small" effect="plain">
              {{ getModelLabel(currentChat.currentModel || currentModel.value) }}
            </el-tag>
          </div>

          <template v-for="(message, index) in currentChat.messages" :key="index">
            <!-- 模型切换标记 -->
            <template v-if="message.modelSwitch">
              <div class="model-switch-divider">
                <div class="divider-line"></div>
                <el-tag size="small" effect="plain">
                  切换至 {{ getModelLabel(message.modelSwitch) }}
                </el-tag>
                <div class="divider-line"></div>
              </div>
            </template>
            <div
              v-else
              :class="['message', message.role, { selected: selectedMessages.includes(message) }]"
              @contextmenu.prevent="showContextMenu($event, message, index)"
            >
              <div class="message-avatar">
                <el-avatar 
                  :size="36"
                  :src="message.role === 'user' ? userAvatar : aiAvatar"
                />
              </div>
              <div class="message-body">
                <div class="message-header">
                  <span class="message-role">{{ message.role === 'user' ? '用户' : 'AI' }}</span>
                </div>
                <div class="message-content" v-html="formatMessage(message.content)" />
              </div>
            </div>
          </template>
        </div>
        <div v-else class="empty-chat">
          <div class="empty-icon">
            <el-icon :size="48"><ChatRound /></el-icon>
          </div>
          <h2>开始新对话</h2>
          <p>选择模型并输入问题开始对话</p>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="input-area">
        <div class="input-container">
          <el-input
            v-model="userInput"
            type="textarea"
            :rows="3"
            :placeholder="inputPlaceholder"
            resize="none"
            @keyup.enter.ctrl="sendMessage"
          />
          <el-button 
            class="send-btn"
            type="primary" 
            :loading="loading"
            @click="sendMessage"
          >
            发送
          </el-button>
        </div>
        <div class="input-tip">
          按 Ctrl + Enter 发送
        </div>
      </div>
    </div>

    <!-- 设置对话框 -->
    <el-dialog
      v-model="showSettings"
      title="模型设置"
      width="500px"
    >
      <el-tabs>
        <el-tab-pane 
          v-for="option in modelOptions" 
          :key="option.value"
          :label="option.label"
        >
          <el-form label-width="100px">
            <el-form-item label="API地址">
              <el-input 
                v-model="modelSettings.apiUrls[option.value]" 
                placeholder="请输入API地址"
              />
            </el-form-item>
            <el-form-item label="API密钥">
              <el-input 
                v-model="modelSettings.apiKeys[option.value]" 
                type="password" 
                placeholder="请输入API密钥"
                show-password
              />
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
      <el-divider>通用设置</el-divider>
      <el-form label-width="200px">
        <el-form-item label="自动总结对话标题">
          <el-switch
            v-model="modelSettings.autoSummarize"
            active-text="开启"
            inactive-text="关闭"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showSettings = false">取消</el-button>
          <el-button type="primary" @click="saveSettings">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Apple风格右键菜单 -->
    <div v-if="contextMenu.visible" 
         class="context-menu" 
         :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
    >
      <ul>
        <li @click="copyMessage(contextMenu.message?.content)">
          <el-icon><Document /></el-icon>
          <span>复制</span>
        </li>
        <li @click="toggleMessageSelection(contextMenu.message)">
          <el-icon><Select /></el-icon>
          <span>{{ selectedMessages.includes(contextMenu.message) ? '取消选择' : '选择' }}</span>
        </li>
        <li v-if="selectedMessages.length > 0" @click="downloadAsImage">
          <el-icon><Download /></el-icon>
          <span>下载选中消息</span>
        </li>
        <li class="danger" @click="deleteMessage(contextMenu.index)">
          <el-icon><Delete /></el-icon>
          <span>删除</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Setting, Plus, ChatRound, Delete, Document, Select, Download, Edit } from '@element-plus/icons-vue'
import { marked } from 'marked'
import { ElMessage } from 'element-plus'
import html2canvas from 'html2canvas'

// 基础变量
const searchQuery = ref('')
const userInput = ref('')
const loading = ref(false)
const currentChatId = ref(null)
const messagesContainer = ref(null)
const showSettings = ref(false)

const userAvatar = 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'
const aiAvatar = 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'

// 聊天历史记录
const chatHistory = ref([])

// 当前聊天
const currentChat = ref({
  id: null,
  title: '',
  time: new Date(),
  messages: [],
  currentModel: null  // 添加当前模型字段
})

// 过滤后的历史记录
const filteredHistory = computed(() => {
  if (!searchQuery.value) return chatHistory.value
  return chatHistory.value.filter(chat => 
    chat.title.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

// 格式化时间
const formatTime = (time) => {
  return formatDistanceToNow(new Date(time), { addSuffix: true, locale: zhCN })
}

// 加载聊天记录
const loadChat = (chat) => {
  currentChatId.value = chat.id
  currentChat.value = JSON.parse(JSON.stringify(chat))
  // 如果有历史模型记录，设置为当前模型
  if (currentChat.value.currentModel) {
    currentModel.value = currentChat.value.currentModel
  } else {
    // 如果没有历史模型记录，设置默认模型
    currentChat.value.currentModel = currentModel.value
  }
  // 等待DOM更新后滚动到底部
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

// 模型相关配置
const modelOptions = ref([
  { 
    label: 'kimi', 
    value: 'kimi',
    model: 'moonshot-v1-8k',
    type: 'kimi',
    description: '适用于大多数问题',
    tag: '推荐',
    systemPrompt: '你是 Kimi，由 Moonshot AI 提供的人工智能助手，你更擅长中文和英文的对话。你会为用户提供安全，有帮助，准确的回答。同时，你会拒绝一切涉及恐怖主义，种族歧视，黄色暴力等问题的回答。Moonshot AI 为专有名词，不可翻译成其他语言。'
  },
  { 
    label: 'DeepSeek', 
    value: 'deepseek',
    model: 'deepseek-r1:latest',
    type: 'deepseek',
    description: '快速进行高级推理',
    systemPrompt: 'You are a helpful assistant.'
  },
  {
    label: '通义千问Plus',
    value: 'qwen',
    model: 'qwen-plus',
    type: 'qwen',
    description: '擅长编码和逻辑推理',
    systemPrompt: 'You are a helpful assistant.'
  }
])

// 必须在 modelOptions 后声明
const currentModel = ref(modelOptions.value[0].value)

const modelSettings = ref({
  apiUrls: {
    kimi: 'https://api.moonshot.cn/v1/chat/completions',
    deepseek: 'http://localhost:8888/api/generate',
    qwen: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
  },
  apiKeys: {
    kimi: '',
    deepseek: '',
    qwen: ''
  },
  autoSummarize: true  // 默认开启自动总结
})

// 添加保存设置的方法
const saveSettings = () => {
  localStorage.setItem('modelSettings', JSON.stringify(modelSettings.value))
  showSettings.value = false
}

// 添加自动总结标题的函数
const generateTitle = async (messages) => {
  const currentModelConfig = modelOptions.value.find(m => m.value === currentModel.value)
  try {
    const response = await fetch('/api/kimi/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${modelSettings.value.apiKeys.kimi}`
      },
      body: JSON.stringify({
        model: 'moonshot-v1-8k',
        messages: [
          {
            role: 'system',
            content: '你是一个对话标题生成助手。请根据用户的对话内容，生成一个10字以内的简短标题，直接返回标题文本，不要包含任何其他内容。'
          },
          {
            role: 'user',
            content: `请为以下对话生成一个10字以内的标题：\n${messages.map(m => `${m.role}: ${m.content}`).join('\n')}`
          }
        ],
        temperature: 0.3,
        stream: false
      })
    });

    const result = await response.json();
    return result.choices[0].message.content.trim();
  } catch (error) {
    console.error('生成标题失败:', error);
    return null;
  }
}

// 修改sendMessage函数
const sendMessage = async () => {
  if (!userInput.value.trim() || loading.value) return

  const message = userInput.value
  userInput.value = ''
  
  const isNewChat = !currentChat.value.id
  if (isNewChat) {
    currentChat.value = {
      id: Date.now(),
      title: message.length <= 10 ? message : '新对话',
      time: new Date(),
      messages: [],
      currentModel: currentModel.value  // 记录初始模型
    }
    chatHistory.value.unshift(JSON.parse(JSON.stringify(currentChat.value)))
    // 保存新建的对话
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory.value))
    currentChatId.value = currentChat.value.id
  }

  // 检查是否切换了模型
  if (currentChat.value.currentModel !== currentModel.value) {
    // 添加模型切换标记
    currentChat.value.messages.push({
      modelSwitch: currentModel.value,
      role: 'system'  // 使用role标记系统消息
    })
    // 更新当前模型
    currentChat.value.currentModel = currentModel.value
    // 保存模型切换
    saveChat()
  }

  // 添加用户消息
  currentChat.value.messages.push({
    role: 'user',
    content: message,
    model: currentModel.value  // 记录消息使用的模型
  })
  // 保存用户消息
  saveChat()

  loading.value = true
  try {
    const currentModelConfig = modelOptions.value.find(m => m.value === currentModel.value)
    const assistantMessage = {
      role: 'assistant',
      content: ''
    }
    currentChat.value.messages.push(assistantMessage)
    // 保存空的AI消息
    saveChat()

    // 定义发送给API的消息数组（不包含空的assistant消息）
    const apiMessages = [
      {
        role: 'system',
        content: currentModelConfig.systemPrompt
      },
      ...currentChat.value.messages.filter(msg => msg.role !== 'assistant' || msg.content !== '')
    ];

    let response;
    if (currentModelConfig.type === 'kimi') {
      // Moonshot API
      response = await fetch('/api/kimi/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${modelSettings.value.apiKeys.kimi}`
        },
        body: JSON.stringify({
          model: 'moonshot-v1-8k',
          messages: apiMessages,
          temperature: 0.3,
          stream: true
        })
      });
    } else if (currentModelConfig.type === 'qwen') {
      // 通义千问 API
      response = await fetch('/api/qwen/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${modelSettings.value.apiKeys.qwen}`
        },
        body: JSON.stringify({
          model: currentModelConfig.model,
          messages: apiMessages,
          stream: true
        })
      });
    } else if (currentModelConfig.type === 'deepseek') {
      // SiliconFlow API
      response = await fetch('/api/deepseek/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${modelSettings.value.apiKeys.deepseek}`
        },
        body: JSON.stringify({
          model: currentModelConfig.model,
          messages: apiMessages,
          stream: true,
          max_tokens: 512,
          temperature: 0.7,
          top_p: 0.7,
          top_k: 50,
          frequency_penalty: 0.5
        })
      });
    }

    // 确保滚动到最新消息
    await nextTick()
    if (messagesContainer.value) {
      const lastMessage = messagesContainer.value.lastElementChild
      if (lastMessage) {
        lastMessage.scrollIntoView({ behavior: 'smooth', block: 'end' })
      }
    }

    // 处理流式响应
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let isDone = false;
    while (!isDone) {
      const { done, value } = await reader.read();
      isDone = done;
      
      if (!value) continue;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const jsonData = JSON.parse(line.slice(6));
            if (jsonData.choices?.[0]?.delta?.content) {
              assistantMessage.content += jsonData.choices[0].delta.content;
              // 每收到一块内容就保存一次
              saveChat()
            }
          } catch (e) {
            console.warn('Failed to parse streaming data:', e);
          }
        }
      }
    }

    // 如果是新对话且开启了自动总结，且初始消息超过10个字才需要生成标题
    if (isNewChat && modelSettings.value.autoSummarize && message.length > 10) {
      const title = await generateTitle(currentChat.value.messages)
      if (title) {
        currentChat.value.title = title
        const chatIndex = chatHistory.value.findIndex(chat => chat.id === currentChat.value.id)
        if (chatIndex !== -1) {
          chatHistory.value[chatIndex].title = title
          // 保存更新后的标题
          saveChat()
        }
      }
    }
  } catch (error) {
    console.error('Error:', error);
    currentChat.value.messages = currentChat.value.messages.filter(msg => msg.content !== '');
    currentChat.value.messages.push({
      role: 'assistant',
      content: '抱歉，发生了错误，请稍后重试。'
    });
    // 保存错误消息
    saveChat()
  } finally {
    loading.value = false;
  }
};

// 添加保存聊天记录的辅助函数
const saveChat = () => {
  // 更新历史记录中的当前聊天
  const index = chatHistory.value.findIndex(chat => chat.id === currentChat.value.id)
  if (index !== -1) {
    chatHistory.value[index] = JSON.parse(JSON.stringify(currentChat.value))
    // 保存到本地存储
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory.value))
  }
}

// 删除聊天记录
const deleteChat = (index) => {
  const chatId = chatHistory.value[index].id
  chatHistory.value.splice(index, 1)
  // 保存更改
  localStorage.setItem('chatHistory', JSON.stringify(chatHistory.value))
  if (currentChatId.value === chatId) {
    currentChat.value = { id: null, title: '', time: new Date(), messages: [], currentModel: null }
    currentChatId.value = null
  }
}

// 组件挂载时从本地存储加载历史记录和设置
onMounted(() => {
  const savedHistory = localStorage.getItem('chatHistory')
  if (savedHistory) {
    chatHistory.value = JSON.parse(savedHistory)
    // 如果有当前聊天ID，加载对应的聊天记录
    if (currentChatId.value) {
      const chat = chatHistory.value.find(c => c.id === currentChatId.value)
      if (chat) {
        currentChat.value = JSON.parse(JSON.stringify(chat))
      }
    }
  }
  
  // 加载已保存的设置或使用环境变量
  const savedSettings = localStorage.getItem('modelSettings')
  if (savedSettings) {
    modelSettings.value = JSON.parse(savedSettings)
  } else {
    // 如果没有保存的设置，使用环境变量
    if (process.env.VUE_APP_KIMI_API_KEY) {
      modelSettings.value.apiKeys.kimi = process.env.VUE_APP_KIMI_API_KEY
    }
  }

  // 监听点击事件关闭菜单
  document.addEventListener('click', () => {
    contextMenu.value.visible = false
  })
})

// 创建新对话
const createNewChat = () => {
  currentChat.value = {
    id: Date.now(),
    title: '新对话',
    time: new Date(),
    messages: [],
    currentModel: currentModel.value  // 记录初始模型
  }
  chatHistory.value.unshift(JSON.parse(JSON.stringify(currentChat.value)))
  currentChatId.value = currentChat.value.id
}

// 使用 marked 格式化消息
const formatMessage = (content) => {
  if (!content) return ''
  
  // 预处理原始内容，处理连续的换行
  content = content
    // 移除开头的空行
    .replace(/^\s+/, '')
    // 移除结尾的空行
    .replace(/\s+$/, '')
    // 将连续3个以上换行替换为2个换行
    .replace(/\n{3,}/g, '\n\n')
    // 移除每行开头和结尾的空白字符
    .replace(/^[ \t]+|[ \t]+$/gm, '')

  // 使用marked处理markdown
  let formattedContent = marked(content)
  
  // 处理多余的空行和格式
  formattedContent = formattedContent
    // 替换连续的多个空行为单个空行
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    // 移除段落标签之间的多余空行
    .replace(/<\/p>\s*\n+\s*<p>/g, '</p><p>')
    // 移除代码块前后的多余空行
    .replace(/\n+<pre>/g, '\n<pre>')
    .replace(/<\/pre>\n+/g, '</pre>\n')
    // 移除列表项之间的多余空行
    .replace(/<\/li>\s*\n+\s*<li>/g, '</li><li>')
    // 移除段落内部的多余空格
    .replace(/>(\s|&nbsp;)+</g, '><')
    // 处理代码块内的格式
    .replace(/<pre><code>([\s\S]*?)<\/code><\/pre>/g, (match, p1) => {
      // 移除代码块中多余的空行，但保留缩进
      const code = p1
        .replace(/\n{3,}/g, '\n\n')
        .replace(/^\s+|\s+$/g, '')
      return `<pre><code>${code}</code></pre>`
    })
  
  return formattedContent
}

// 输入框提示
const inputPlaceholder = computed(() => {
  const model = modelOptions.value.find(m => m.value === currentModel.value)
  return model ? `使用 ${model.label} 提问...` : '请选择模型并输入问题...'
})

// 添加复制功能
const copyMessage = (content) => {
  navigator.clipboard.writeText(content).then(() => {
    ElMessage({
      message: '复制成功',
      type: 'success',
      duration: 2000
    })
  }).catch(() => {
    ElMessage({
      message: '复制失败，请手动复制',
      type: 'error',
      duration: 2000
    })
  })
}

// 多选相关状态
const isSelectMode = ref(false)
const selectedMessages = ref([])

// 切换选择模式
const toggleSelectMode = () => {
  isSelectMode.value = !isSelectMode.value
  if (!isSelectMode.value) {
    selectedMessages.value = []
  }
}

// 切换消息选择状态
const toggleMessageSelection = (message) => {
  const index = selectedMessages.value.indexOf(message)
  if (index === -1) {
    selectedMessages.value.push(message)
  } else {
    selectedMessages.value.splice(index, 1)
  }
}

// 删除单条消息
const deleteMessage = (index) => {
  currentChat.value.messages.splice(index, 1)
  saveChat()  // 保存更改
}

// 下载选中消息为图片
const downloadAsImage = async () => {
  if (!selectedMessages.value.length) return
  
  // 创建临时容器
  const container = document.createElement('div')
  container.className = 'messages-container'
  
  // 添加选中的消息
  selectedMessages.value.forEach(message => {
    const messageDiv = document.createElement('div')
    messageDiv.className = `message ${message.role}`
    messageDiv.innerHTML = `
      <div class="message-header">
        <span class="message-role">${message.role === 'user' ? '用户' : 'AI'}</span>
      </div>
      <div class="message-content">${formatMessage(message.content)}</div>
    `
    container.appendChild(messageDiv)
  })
  
  // 添加到文档中
  document.body.appendChild(container)
  
  try {
    const canvas = await html2canvas(container, {
      backgroundColor: '#ffffff'
    })
    
    const link = document.createElement('a')
    link.download = `chat-${Date.now()}.png`
    link.href = canvas.toDataURL()
    link.click()
  } catch (error) {
    console.error('Failed to generate image:', error)
    ElMessage.error('生成图片失败')
  } finally {
    document.body.removeChild(container)
  }
}

// 右键菜单相关
const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  message: null,
  index: -1
})

const contextMenuStyle = computed(() => ({
  position: 'fixed',
  left: contextMenu.value.x + 'px',
  top: contextMenu.value.y + 'px',
  display: contextMenu.value.visible ? 'block' : 'none'
}))

const showContextMenu = (event, message, index) => {
  contextMenu.value = {
    visible: true,
    x: event.clientX,
    y: event.clientY,
    message,
    index
  }
}

// 获取模型显示名称
const getModelLabel = (modelValue) => {
  const model = modelOptions.value.find(m => m.value === modelValue) || modelOptions.value[0]
  return model ? model.label : modelValue
}

// 修改编辑标题相关的状态
const editingChatId = ref(null)
const editingTitle = ref('')

// 修改开始编辑标题的函数
const startEditTitle = (chat) => {
  editingChatId.value = chat.id
  editingTitle.value = chat.title
}

// 添加处理失焦事件的函数
const handleBlur = (chat) => {
  // 给一个小延时，确保点击事件能够正确处理
  setTimeout(() => {
    saveTitle(chat)
  }, 100)
}

// 保存编辑后的标题
const saveTitle = (chat) => {
  if (editingTitle.value.trim()) {
    // 更新历史记录中的标题
    const chatToUpdate = chatHistory.value.find(c => c.id === chat.id)
    if (chatToUpdate) {
      chatToUpdate.title = editingTitle.value.trim()
      // 如果是当前聊天，也更新当前聊天的标题
      if (currentChat.value.id === chat.id) {
        currentChat.value.title = editingTitle.value.trim()
      }
      // 保存更改
      saveChat()
    }
  }
  // 退出编辑模式
  editingChatId.value = null
  editingTitle.value = ''
}
</script>

<style scoped>
.ai-chat-container {
  display: flex;
  height: 100vh;
  background-color: var(--el-bg-color);
}

.sidebar {
  width: 260px;
  border-right: 1px solid var(--el-border-color-lighter);
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color-page);
}

.new-chat-btn {
  margin: 16px;
}

.model-selector {
  padding: 0 16px 16px;
}

.model-select {
  width: 100%;
}

.model-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.model-info {
  flex: 1;
}

.model-name {
  font-weight: 500;
  margin-bottom: 4px;
}

.model-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.chat-history {
  flex: 1;
  overflow-y: auto;
  padding: 0 8px;
}

.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  margin: 4px 0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.history-item:hover {
  background-color: var(--el-fill-color-light);
}

.history-item.active {
  background-color: var(--el-color-primary-light-9);
}

.history-content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.chat-title-wrapper {
  flex: 1;
  min-width: 0;
  padding: 2px 0;
}

.chat-title {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-actions {
  opacity: 0;
  transition: opacity 0.3s;
  display: flex;
  gap: 4px;
}

.history-item:hover .history-actions {
  opacity: 1;
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color);
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  height: 0;
  align-items: flex-start;
  scroll-behavior: smooth;
}

.messages-wrapper {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.message {
  display: flex;
  gap: 16px;
  padding: 12px 20px;
  transition: background-color 0.3s;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  border-bottom: 1px solid var(--el-border-color-lighter);
  cursor: default;
}

.message:hover {
  background-color: var(--el-fill-color-light);
}

.message.assistant {
  background-color: var(--el-fill-color);
}

.message.selected {
  background-color: var(--el-color-primary-light-9);
}

.message-body {
  flex: 1;
  width: 100%;
  position: relative;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.message-role {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.message-content {
  line-height: 1.5;
  white-space: pre-wrap;
  text-align: left;
  font-size: 14px;
  overflow-wrap: break-word;
  word-break: break-all;
}

.message-content :deep(p) {
  margin: 2px 0;  /* 进一步减小段落间距 */
  min-height: 1.5em;  /* 确保空段落有最小高度 */
}

.message-content :deep(pre) {
  background-color: var(--el-fill-color-darker);
  padding: 12px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 4px 0;
}

.message-content :deep(code) {
  font-family: monospace;
  background-color: var(--el-fill-color-darker);
  padding: 2px 4px;
  border-radius: 4px;
  line-height: 1.4;  /* 调整代码行高 */
}

.message-content :deep(ul), 
.message-content :deep(ol) {
  margin: 4px 0;
  padding-left: 20px;
}

.message-content :deep(li) {
  margin: 2px 0;
}

.message-content :deep(br) {
  display: block;
  content: '';
  margin: 1px 0;  /* 进一步减小换行间距 */
}

/* 处理表格样式 */
.message-content :deep(table) {
  margin: 4px 0;
  border-collapse: collapse;
}

.message-content :deep(th),
.message-content :deep(td) {
  padding: 6px 10px;
  border: 1px solid var(--el-border-color);
}

.empty-chat {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  margin: auto;
  justify-content: center;
  color: var(--el-text-color-secondary);
}

.empty-icon {
  margin-bottom: 16px;
}

.empty-chat h2 {
  margin: 16px 0 8px;
  font-size: 24px;
  font-weight: 500;
}

.empty-chat p {
  margin: 0;
  color: var(--el-text-color-secondary);
}

.input-area {
  padding: 20px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.input-container {
  display: flex;
  gap: 12px;
}

.input-container .el-input {
  flex: 1;
}

.input-tip {
  text-align: right;
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

:deep(.el-dialog__body) {
  padding-top: 16px;
}

.messages-container {
  position: fixed;
  left: -9999px;
  background: white;
  padding: 20px;
  max-width: 800px;
}

/* Apple风格右键菜单样式 */
.context-menu {
  position: fixed;
  background-color: #f9f9f9;
  border-radius: 6px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  width: 140px;
  min-width: 140px;
  border: 1px solid #d1d1d6;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 13px;
  backdrop-filter: blur(10px);
  background-color: rgba(249, 249, 249, 0.95);
}

.context-menu ul {
  margin: 0;
  padding: 4px 0;
  list-style: none;
}

.context-menu li {
  padding: 8px 16px;
  cursor: pointer;
  color: #333;
  transition: background-color 0.2s ease, color 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.context-menu li:hover {
  background-color: #f0f0f5;
  color: #007aff;
}

.context-menu li.danger {
  color: #ff3b30;
}

.context-menu li.danger:hover {
  background-color: #fff1f0;
  color: #ff3b30;
}

.context-menu .el-icon {
  font-size: 14px;
}

.el-divider {
  margin: 16px 0;
}

:deep(.el-form-item__label) {
  font-weight: normal;
}

/* 模型标记样式 */
.model-indicator {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  justify-content: center;
  padding: 8px 0;
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

/* 模型切换分隔线样式 */
.model-switch-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 16px 0;
  width: 100%;
  padding: 0 20px;  /* 添加左右内边距 */
}

.divider-line {
  flex: 1;
  height: 1px;
  background-color: var(--el-border-color-lighter);
}

/* 系统消息样式 */
.message.system {
  justify-content: center;
  background-color: transparent;
  border-bottom: none;
  padding: 8px 0;
}

/* 编辑输入框样式 */
.chat-title-wrapper :deep(.el-input__wrapper) {
  padding: 0 8px;
  background-color: var(--el-bg-color-overlay);
  box-shadow: none;
  transition: box-shadow 0.2s;
}

.chat-title-wrapper :deep(.el-input__inner) {
  height: 24px;
  font-size: 14px;
  color: var(--el-text-color-primary);
  padding: 0;
}

.chat-title-wrapper :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--el-color-primary) inset;
}
</style> 