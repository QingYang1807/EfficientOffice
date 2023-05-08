import { createRouter, createWebHashHistory } from 'vue-router';
import HelloWorld from '../components/HelloWorld.vue';
import TodoItems from '../components/TodoItems.vue';
import PasswordGenerator from '../components/PasswordGenerator.vue';
import GetStart from '../components/GetStart.vue';

// 路由配置
export const routes = [
  { path: '/', name: 'WelcomePage', component: HelloWorld, description: '欢迎来到高效办公' },
  { path: '/todo', name: 'TodoItems', component: TodoItems, description: '待办事项管理' },
  { path: '/password-generator', name: 'PasswordGenerator', component: PasswordGenerator, description: '安全的密码生成器' },
  { path: '/get-start', name: 'GetStart', component: GetStart, description: '开始使用' }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

export default router;
