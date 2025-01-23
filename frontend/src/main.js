import { createApp } from 'vue'
import router from './router'
import App from './App.vue'

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

const app = createApp(App)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIcons)) {
  app.component(key, component)
}

// 注册插件
app.use(Antd)
app.use(ElementPlus)
app.use(router)

app.mount('#app')
