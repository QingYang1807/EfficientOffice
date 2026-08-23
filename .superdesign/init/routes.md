# Routes

## Route map

| URL | Component | Layout | Summary |
|---|---|---|---|
| `/` | `redirect → /dashboard` | `MainLayout.vue` | Root shell redirect. |
| `/dashboard` | `frontend/src/views/Dashboard.vue` | `MainLayout.vue` | Overview dashboard with statistics, charts, quick actions, recent activity, goals, knowledge, and review summaries. |
| `/todos` | `frontend/src/views/TodoList.vue` | `MainLayout.vue` | Task management page backed by the full TodoItems workspace. |
| `/password-generator` | `frontend/src/components/PasswordGenerator.vue` | `MainLayout.vue` | Password generation utility. |
| `/report-summary` | `frontend/src/components/ReportSummary.vue` | `MainLayout.vue` | Daily/weekly report summary utility. |
| `/pomodoro-timer` | `frontend/src/components/PomodoroTimer.vue` | `MainLayout.vue` | Pomodoro focus timer. |
| `/goals` | `frontend/src/views/GoalManagement.vue` | `MainLayout.vue` | Goal planning and management workspace. |
| `/profile` | `frontend/src/views/ProfileView.vue` | `MainLayout.vue` | User profile and avatar editing. |
| `/settings` | `frontend/src/views/SettingsView.vue` | `MainLayout.vue` | System, AI, appearance, data, and menu settings. |
| `/notes` | `frontend/src/views/NotesView.vue` | `MainLayout.vue` | Notes editor with searchable note list. |
| `/knowledge` | `frontend/src/views/KnowledgeBaseView.vue` | `MainLayout.vue` | Knowledge-base document and category management. |
| `/mindmap` | `frontend/src/views/MindMapView.vue` | `MainLayout.vue` | Mind-map editor with import/export. |
| `/reviews` | `frontend/src/views/ReviewsView.vue` | `MainLayout.vue` | Retrospective/review records. |
| `/calendar` | `frontend/src/views/CalendarView.vue` | `MainLayout.vue` | Calendar with lunar dates and todo integration. |
| `/password` | `frontend/src/components/PasswordGenerator.vue` | `MainLayout.vue` | Authenticated alias for the password generator. |
| `/ai-chat` | `frontend/src/views/AIChatView.vue` | `MainLayout.vue` | AI conversation workspace. |
| `/gratitude-diary` | `frontend/src/views/GratitudeDiaryView.vue` | `MainLayout.vue` | Gratitude diary timeline and entry management. |
| `/iframe-view` | `frontend/src/views/IframeView.vue` | `MainLayout.vue` | Embedded external page. |
| `/web-view` | `frontend/src/views/WebView.vue` | `MainLayout.vue` | In-app web page viewer. |
| `/web-nav` | `frontend/src/views/WebNav.vue` | `MainLayout.vue` | Customizable visual website navigation board. |
| `/workflow` | `frontend/src/views/WorkflowView.vue` | `MainLayout.vue` | Visual workflow editor. |
| `/login` | `frontend/src/views/LoginView.vue` | `App.vue only` | Standalone login form. |

## Full router configuration

```js
import { createRouter, createWebHistory } from 'vue-router';
import MainLayout from '../layouts/MainLayout.vue';
import Dashboard from '../views/Dashboard.vue';
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
// import WebNavigationView from '../views/WebNavigationView.vue'
import WebNav from '../views/WebNav.vue'
import WorkflowView from '@/views/WorkflowView.vue';

// 路由配置
export const routes = [
  {
    path: '/',
    component: MainLayout,
    children: [
      { path: '', redirect: '/dashboard' },
      { path: 'dashboard', name: 'Dashboard', component: Dashboard, description: '首页概览', meta: { title: '首页 - 高效办公' } },
      { path: 'todos', name: 'TodoList', component: TodoList, description: '待办事项管理', meta: { title: '待办事项管理 - 高效办公' } },
      { path: 'password-generator', name: 'PasswordGenerator', component: PasswordGenerator, description: '安全的密码生成器', meta: { title: '安全的密码生成器 - 高效办公' } },
      { path: 'report-summary', name: 'ReportSummary', component: ReportSummary, description: '日报/周报总结', meta: { title: '日报/周报总结 - 高效办公' } },
      { path: 'pomodoro-timer', name: 'PomodoroTimer', component: PomodoroTimer, description: '一个番茄钟', meta: { title: '一个番茄钟 - 高效办公' } },
      {
        path: 'goals',
        name: 'GoalManagement',
        component: () => import('@/views/GoalManagement.vue'),
        meta: {
          title: '目标管理',
          icon: 'target'
        }
      },
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
      },
      {
        path: '/workflow',
        name: 'workflow',
        component: WorkflowView,
        meta: {
          requiresAuth: true,
          title: '工作流'
        }
      }
    ]
  },
  // 保留原来的欢迎和开始页面作为独立路由
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

router.beforeEach((to, from, next) => {
  document.title = to.meta.title || '高效办公'
  next()
})

export default router;
```
