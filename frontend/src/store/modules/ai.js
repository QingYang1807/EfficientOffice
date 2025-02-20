import { aiAPI } from '@/api/ai'

export default {
  namespaced: true,
  
  state: {
    isAnalyzing: false,
    lastAnalysis: null,
    currentGoal: null,
    chatHistory: []
  },

  mutations: {
    SET_ANALYZING(state, status) {
      state.isAnalyzing = status
    },
    SET_LAST_ANALYSIS(state, analysis) {
      state.lastAnalysis = analysis
    },
    ADD_CHAT_HISTORY(state, { role, content }) {
      state.chatHistory.push({ role, content })
    },
    CLEAR_CHAT_HISTORY(state) {
      state.chatHistory = []
    }
  },

  actions: {
    async analyzeGoal({ commit }, goal) {
      commit('SET_ANALYZING', true)
      try {
        const prompt = `
请帮我分析这个目标并给出专业建议：

目标标题：${goal.title}
目标描述：${goal.description}
截止日期：${goal.deadline}
当前进度：${goal.progress}%

请从以下几个方面详细分析：

1. SMART原则评估
- 这个目标的具体性如何？
- 如何量化成果？
- 难度是否合适？
- 与个人发展的相关性？
- 时间规划是否合理？

2. 任务分解（请给出3-5个关键阶段）
- 每个阶段的具体目标
- 预计耗时
- 重要程度排序
- 可能遇到的困难

3. 执行建议
- 每周应投入的时间
- 如何安排任务优先级
- 如何监控进度
- 如何保持动力

4. 潜在风险分析
- 可能遇到的障碍
- 具体的应对策略
- 需要提前准备的资源

请给出非常具体、可操作的建议。`

        const response = await aiAPI.chat(prompt)
        commit('ADD_CHAT_HISTORY', { 
          role: 'assistant', 
          content: response 
        })
        commit('SET_LAST_ANALYSIS', response)
        return response
        
      } catch (error) {
        console.error('AI分析失败:', error)
        throw error
      } finally {
        commit('SET_ANALYZING', false)
      }
    },
    
    async generateTasks({ commit }, goal) {
      commit('SET_ANALYZING', true)
      try {
        const prompt = `作为一个专业的任务分解助手，请帮我将以下目标分解为具体的子任务列表。

目标信息：
标题：${goal.title}
描述：${goal.description}
截止日期：${goal.deadline}

请严格按照以下 JSON 格式生成 5 个子任务，每个任务包含以下属性：
{
  "tasks": [
    {
      "name": "任务名称（限10字以内）",
      "estimatedTime": "预计耗时（如：4小时、2天）",
      "priority": "优先级（只能是：高、中、低）",
      "steps": [
        "步骤1（具体可执行的动作）",
        "步骤2（具体可执行的动作）",
        "步骤3（具体可执行的动作）"
      ],
      "completionCriteria": "完成标准（一句话描述）",
      "resources": ["所需资源1", "所需资源2"]
    }
  ]
}

注意事项：
1. 必须严格按照上述 JSON 格式返回
2. 任务名称必须简短明确，不超过10个字
3. 优先级只能是：高、中、低 三个值之一
4. 每个任务必须包含3个具体的执行步骤
5. 任务之间应该循序渐进，由易到难
6. 时间估算要实际可行
7. 完成标准要具体且可衡量
8. 资源清单要切实可用

请确保生成的是合法的 JSON 格式，不要包含任何其他说明文字。直接返回 JSON 对象。`

        const response = await aiAPI.chat(prompt)
        
        try {
          // 首先尝试清理响应文本，移除可能的多余内容
          const jsonStr = response.replace(/```json\s*|\s*```/g, '').trim()
          const parsedResponse = JSON.parse(jsonStr)
          
          // 验证数据结构
          if (!parsedResponse.tasks || !Array.isArray(parsedResponse.tasks)) {
            throw new Error('返回数据结构无效')
          }
          
          // 验证每个任务的数据完整性
          parsedResponse.tasks = parsedResponse.tasks.map((task, index) => {
            if (!task.name || !task.estimatedTime || !task.priority || 
                !Array.isArray(task.steps) || !task.completionCriteria || 
                !Array.isArray(task.resources)) {
              throw new Error(`第 ${index + 1} 个任务数据不完整`)
            }
            
            // 规范化数据
            return {
              ...task,
              name: task.name.slice(0, 10), // 限制名称长度
              priority: ['高', '中', '低'].includes(task.priority) ? task.priority : '中',
              steps: task.steps.slice(0, 3), // 限制步骤数量
              resources: task.resources.filter(r => r && typeof r === 'string')
            }
          })
          
          if (parsedResponse.tasks.length === 0) {
            throw new Error('没有生成有效的任务')
          }
          
          return parsedResponse
          
        } catch (error) {
          console.error('解析AI返回数据失败:', error, '\n原始响应:', response)
          // 如果解析失败，重试一次
          commit('SET_ANALYZING', true)
          const retryPrompt = `之前的响应格式有误，请重新生成，必须是合法的JSON格式，且严格按照示例结构。不要包含任何其他文字，直接返回JSON对象：
{
  "tasks": [
    {
      "name": "示例任务",
      "estimatedTime": "2小时",
      "priority": "高",
      "steps": ["步骤1", "步骤2", "步骤3"],
      "completionCriteria": "完成标准",
      "resources": ["资源1", "资源2"]
    }
  ]
}`
          const retryResponse = await aiAPI.chat(retryPrompt)
          const retryJson = JSON.parse(retryResponse.replace(/```json\s*|\s*```/g, '').trim())
          return retryJson
        }
        
      } catch (error) {
        console.error('生成任务失败:', error)
        throw new Error('无法生成任务列表，请重试')
      } finally {
        commit('SET_ANALYZING', false)
      }
    },

    async suggestImprovements({ commit }, goal) {
      commit('SET_ANALYZING', true)
      try {
        const prompt = `
基于当前目标的进度(${goal.progress}%)，请提供改进建议：

目标信息：
- 标题：${goal.title}
- 描述：${goal.description}
- 已完成任务：${goal.completedTasks}/${goal.totalTasks}

请从以下方面提供建议：
1. 进度评估
2. 时间利用效率
3. 遇到的主要困难
4. 改进措施
5. 激励建议

请给出具体的、可立即执行的建议。同时，用鼓励的语气，帮助用户建立信心。`

        const response = await aiAPI.chat(prompt)
        commit('ADD_CHAT_HISTORY', {
          role: 'assistant',
          content: response
        })
        return response
        
      } catch (error) {
        console.error('生成改进建议失败:', error)
        throw error
      } finally {
        commit('SET_ANALYZING', false)
      }
    },

    async analyzeProgress({ commit }, goal) {
      commit('SET_ANALYZING', true)
      try {
        const prompt = `
请分析这个目标的当前进度：

目标：${goal.title}
描述：${goal.description}
当前进度：${goal.progress}%
已完成任务：${goal.completedTasks}/${goal.totalTasks}

请从以下方面进行分析：
1. 进度是否符合预期
2. 当前阶段的主要成就
3. 存在的问题和风险
4. 下一步工作重点
5. 时间进度评估

请给出详细的分析和具体的建议。`

        const response = await aiAPI.chat(prompt)
        return response
      } catch (error) {
        console.error('进度分析失败:', error)
        throw error
      } finally {
        commit('SET_ANALYZING', false)
      }
    }
  }
} 