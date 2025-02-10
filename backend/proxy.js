const express = require('express')
const axios = require('axios')
const router = express.Router()

router.get('/api/proxy', async (req, res) => {
  try {
    const { url } = req.query
    
    // 获取目标网站内容
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 ...',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': url,
        'Origin': new URL(url).origin
      }
    })

    // 修改响应头
    res.setHeader('Content-Security-Policy', "frame-ancestors 'self'")
    res.setHeader('X-Frame-Options', 'SAMEORIGIN')
    
    // 返回修改后的内容
    res.send(response.data)
  } catch (error) {
    console.error('Proxy error:', error)
    res.status(500).send('Proxy request failed')
  }
})

module.exports = router 