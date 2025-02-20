const KIMI_API_KEY = process.env.VUE_APP_KIMI_API_KEY
const KIMI_API_URL = 'https://api.kimi.ai/v1/chat/completions'

export const kimiAPI = {
  async chat(prompt) {
    try {
      const response = await fetch(KIMI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${KIMI_API_KEY}`
        },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: prompt
          }],
          model: 'moonshot-v1-8k',
          temperature: 0.7
        })
      })
      
      const data = await response.json()
      return data.choices[0].message.content
      
    } catch (error) {
      console.error('Kimi API 调用失败:', error)
      throw error
    }
  }
} 