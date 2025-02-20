import { createStore } from 'vuex'
import ai from './modules/ai'

const store = createStore({
  modules: {
    ai
  },
  state: {
    version: '1.0.0'
  },
  mutations: {
    // 基础mutations
  },
  actions: {
    // 基础actions
  }
})

// 添加热重载支持
if (module.hot) {
  module.hot.accept(['./modules/ai'], () => {
    const newAi = require('./modules/ai').default
    store.hotUpdate({
      modules: {
        ai: newAi
      }
    })
  })
}

export default store 