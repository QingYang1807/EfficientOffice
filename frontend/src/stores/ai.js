import { defineStore } from 'pinia'

export const useAIStore = defineStore('ai', {
  state: () => ({
    apiKey: '',
    apiUrl: 'https://api.moonshot.cn/v1/chat/completions',
    model: 'moonshot-v1-8k',
    temperature: 0.7,
    maxTokens: 2000,
    chatHistory: [],
    isLoading: false,
    isConfigured: false
  }),

  actions: {
    setApiKey(key) {
      this.apiKey = key
      this.isConfigured = !!key
    },
    
    setApiUrl(url) {
      this.apiUrl = url
    },
    
    addChatHistory(message) {
      this.chatHistory.push(message)
    },
    
    clearChatHistory() {
      this.chatHistory = []
    },
    
    setLoading(status) {
      this.isLoading = status
    }
  },

  persist: {
    key: 'ai-store',
    storage: localStorage,
    paths: ['apiKey', 'apiUrl', 'isConfigured']
  }
}) 