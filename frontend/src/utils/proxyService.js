import axios from 'axios'

// 创建代理服务
export async function createProxyIframe(targetUrl) {
  try {
    // 通过后端代理服务器请求目标网站内容
    const response = await axios.get(`/api/proxy?url=${encodeURIComponent(targetUrl)}`, {
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    })
    return response.data
  } catch (error) {
    console.error('Proxy request failed:', error)
    throw error
  }
} 