import { createApp } from 'vue'
import router from './router'
import App from './App.vue'
import { createPinia } from 'pinia'
import { initMenuConfig } from './utils/initMenuConfig'
import store from './store'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

// 引入 Ant Design Vue
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'

// 首先引入 Tailwind CSS
import './assets/tailwind.css'

// 然后是 Element Plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIcons from '@element-plus/icons-vue'

// 最后是 Bootstrap
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-vue/dist/bootstrap-vue.min.css'

// 引入 md-editor-v3
import MdEditor from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'

import './styles/index.css'  // 引入全局样式

const app = createApp(App)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIcons)) {
  app.component(key, component)
}

// 注册插件
app.use(Antd)
app.use(ElementPlus)
app.use(pinia)
app.component('MdEditor', MdEditor)
app.use(router)
app.use(store)

// 初始化菜单配置
initMenuConfig()

app.mount('#app')
