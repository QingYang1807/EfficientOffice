import { useAIStore } from '@/stores/ai'
import { storeToRefs } from 'pinia'

export const aiAPI = {
  async chat(prompt) {
    const aiStore = useAIStore()
    const { apiKey, apiUrl, model, temperature, maxTokens } = storeToRefs(aiStore)
    
    try {
      const response = await fetch(apiUrl.value || 'https://api.moonshot.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.value}`
        },
        body: JSON.stringify({
          model: model.value,
          messages: [{
            role: 'system',
            content: `你是一个专业的目标管理助手，擅长帮助用户：
1. 制定符合SMART原则的目标
2. 分析目标优先级
3. 将大目标拆解为可执行的小任务
4. 制定详细的执行计划
5. 提供清晰具体的行动建议
6. 预见可能的困难并给出解决方案
7. 激励用户保持动力完成目标

请用专业、积极、富有激励性的语气与用户交流。`
          }, {
            role: 'user',
            content: prompt
          }],
          temperature: temperature.value,
          max_tokens: maxTokens.value
        })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return data.choices[0].message.content
      
    } catch (error) {
      console.error('AI API 调用失败:', error)
      throw new Error('AI服务暂时不可用，请稍后重试')
    }
  },

  // 添加模拟模式，用于开发测试
  async mockChat(prompt) {
    await new Promise(resolve => setTimeout(resolve, 1000)) // 模拟网络延迟
    
    return `
模拟AI分析结果：

1. SMART原则分析：
- 具体性：您的目标描述比较清晰
- 可衡量：已设定具体的完成指标
- 可实现：目标难度适中
- 相关性：与您的发展方向一致
- 时限性：已设定明确的截止日期

2. 任务分解建议：
- 第一阶段：准备工作
- 第二阶段：核心任务
- 第三阶段：完善和优化
- 第四阶段：总结复盘

3. 时间管理建议：
- 建议每周投入10-15小时
- 设置每日小目标
- 定期检查进度

4. 可能的障碍：
- 时间管理不当
- 执行力不足
- 外部干扰因素

5. 改进建议：
- 建立每日回顾机制
- 寻找同伴互相督促
- 适时调整计划
    `
  }
} 