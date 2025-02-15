import { createRouter, createWebHistory } from 'vue-router';
import MainLayout from '../layouts/MainLayout.vue';
import Dashboard from '../views/Dashboard.vue';
import HelloWorld from '../components/HelloWorld.vue';
import GetStart from '../components/GetStart.vue';
import PasswordGenerator from '../components/PasswordGenerator.vue';
import ReportSummary from '../components/ReportSummary.vue';
import PomodoroTimer from '../components/PomodoroTimer.vue';
import TodoList from '../views/TodoList.vue';
import GoalManager from '../views/GoalManager.vue';
import LoginView from '@/views/LoginView.vue'
import ProfileView from '@/views/ProfileView.vue'
import SettingsView from '@/views/SettingsView.vue'
import NotesView from '../views/NotesView.vue'
import KnowledgeBaseView from '../views/KnowledgeBaseView.vue'
import MindMapView from '../views/MindMapView.vue'
import ReviewsView from '../views/ReviewsView.vue'
import CalendarView from '../views/CalendarView.vue'
import AIChatView from '../views/AIChatView.vue'
import GratitudeDiaryView from '../views/GratitudeDiaryView.vue'
import IframeView from '../views/IframeView.vue'
import WebView from '../views/WebView.vue'
import WebNavigationView from '../views/WebNavigationView.vue'
import WebNav from '../views/WebNav.vue'

// 路由配置
export const routes = [
  {
    path: '/',
    component: MainLayout,
    children: [
      { path: '', redirect: '/dashboard' },
      { path: 'dashboard', name: 'Dashboard', component: Dashboard, description: '首页概览' },
      { path: 'todos', name: 'TodoList', component: TodoList, description: '待办事项管理' },
      { path: 'password-generator', name: 'PasswordGenerator', component: PasswordGenerator, description: '安全的密码生成器' },
      { path: 'report-summary', name: 'ReportSummary', component: ReportSummary, description: '日报/周报总结' },
      { path: 'pomodoro-timer', name: 'PomodoroTimer', component: PomodoroTimer, description: '一个番茄钟' },
      { path: 'goals', name: 'GoalManager', component: GoalManager, description: '目标管理' },
      { 
        path: 'profile', 
        name: 'Profile', 
        component: ProfileView, 
        meta: { 
          title: '个人信息',
          requiresAuth: true 
        }
      },
      { 
        path: 'settings', 
        name: 'Settings', 
        component: SettingsView, 
        meta: { 
          title: '系统设置',
          requiresAuth: true 
        }
      },
      { 
        path: 'notes', 
        name: 'Notes', 
        component: NotesView, 
        meta: { 
          title: '便签记录',
          icon: 'Memo',
          requiresAuth: true 
        }
      },
      { 
        path: 'knowledge', 
        name: 'KnowledgeBase', 
        component: KnowledgeBaseView, 
        meta: { 
          title: '知识库',
          icon: 'Collection',
          requiresAuth: true 
        }
      },
      { 
        path: 'mindmap', 
        name: 'MindMap', 
        component: MindMapView,
        meta: { 
          title: '思维导图',
          icon: 'Share',
          requiresAuth: true 
        }
      },
      { 
        path: 'reviews', 
        name: 'Reviews', 
        component: ReviewsView,
        meta: { 
          title: '复盘记录',
          icon: 'DocumentChecked',
          requiresAuth: true 
        }
      },
      { 
        path: 'calendar', 
        name: 'Calendar', 
        component: CalendarView, 
        meta: { 
          title: '日历',
          icon: 'Calendar',
          requiresAuth: true 
        }
      },
      {
        path: 'password',
        name: 'Password',
        component: PasswordGenerator,
        meta: {
          title: '密码生成器',
          icon: 'Key',
          requiresAuth: true
        }
      },
      { 
        path: 'ai-chat', 
        name: 'AIChat', 
        component: AIChatView, 
        meta: { 
          title: 'AI问答',
          icon: 'ChatDotRound',
          requiresAuth: true 
        }
      },
      {
        path: 'gratitude-diary',
        name: 'GratitudeDiary',
        component: GratitudeDiaryView,
        meta: {
          title: '感恩日记',
          icon: 'EditPen',
          requiresAuth: true
        }
      },
      {
        path: 'iframe-view',
        name: 'IframeView',
        component: IframeView,
        meta: { 
          title: '外部页面',
          requiresAuth: true 
        }
      },
      {
        path: 'web-view',
        name: 'WebView',
        component: WebView,
        meta: { 
          title: '网页浏览',
          requiresAuth: true 
        }
      },
      {
        path: 'web-nav',
        name: 'WebNav',
        component: WebNav
      }
    ]
  },
  // 保留原来的欢迎和开始页面作为独立路由
  { path: '/welcome', name: 'WelcomePage', component: HelloWorld, description: '欢迎来到高效办公' },
  { path: '/get-start', name: 'GetStart', component: GetStart, description: '开始使用' },
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: {
      title: '登录',
      requiresAuth: false
    }
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

export default router;
