const defaultMenus = [
  {
    id: 1,
    title: '仪表盘',
    path: '/dashboard',
    icon: 'HomeFilled',
    visible: true,
    children: []
  },
  {
    "id": 1739182210844,
    "title": "浏览器",
    "path": "/web-view?url=http://linqingyang.com/",
    "icon": "Menu",
    "visible": true,
    "children": [],
    "editing": false
  },
  {
    id: 2,
    title: '任务管理',
    path: '/tasks',
    icon: 'List',
    visible: true,
    children: [
      {
        id: 21,
        title: '待办事项',
        path: '/todos',
        icon: 'List',
        visible: true,
        children: []
      },
      {
        id: 22,
        title: '目标管理',
        path: '/goals',
        icon: 'Aim',
        visible: true,
        children: []
      }
    ]
  },
  {
    id: 3,
    title: '工具箱',
    path: '/tools',
    icon: 'Tools',
    visible: true,
    children: [
      {
        id: 31,
        title: '番茄钟',
        path: '/pomodoro-timer',
        icon: 'Timer',
        visible: true,
        children: []
      },
      {
        id: 32,
        title: '密码生成器',
        path: '/password',
        icon: 'Key',
        visible: true,
        children: []
      }
    ]
  },
  {
    id: 4,
    title: '知识管理',
    path: '/knowledge',
    icon: 'Collection',
    visible: true,
    children: [
      {
        id: 41,
        title: '知识库',
        path: '/knowledge',
        icon: 'Collection',
        visible: true,
        children: []
      },
      {
        id: 42,
        title: '思维导图',
        path: '/mindmap',
        icon: 'Share',
        visible: true,
        children: []
      },
      {
        id: 43,
        title: '便签记录',
        path: '/notes',
        icon: 'Memo',
        visible: true,
        children: []
      }
    ]
  },
  {
    id: 5,
    title: '日程管理',
    path: '/schedule',
    icon: 'Calendar',
    visible: true,
    children: [
      {
        id: 51,
        title: '日历',
        path: '/calendar',
        icon: 'Calendar',
        visible: true,
        children: []
      },
      {
        id: 52,
        title: '复盘记录',
        path: '/reviews',
        icon: 'DocumentChecked',
        visible: true,
        children: []
      },
      {
        id: 53,
        title: '感恩日记',
        path: '/gratitude-diary',
        icon: 'EditPen',
        visible: true,
        children: []
      }
    ]
  },
  {
    id: 6,
    title: 'AI助手',
    path: '/ai-tools',
    icon: 'ChatDotRound',
    visible: true,
    "children": [
      {
        "id": 61,
        "title": "系统AI助手",
        "path": "/ai-chat",
        "icon": "ChatDotRound",
        "visible": true,
        "children": []
      },
      {
        "id": 62,
        "title": "DeepSeek",
        "path": "@https://chat.deepseek.com",
        "icon": "Link",
        "visible": true,
        "children": []
      },
      {
        "id": 63,
        "title": "Claude",
        "path": "@https://claude.ai/",
        "icon": "Link",
        "visible": true,
        "children": []
      },
      {
        id: 64,
        title: 'Gemini',
        path: '@https://gemini.google.com',
        icon: 'Link',
        visible: true,
        children: []
      }
    ]
  },
  {
    id: 7,
    title: '系统设置',
    path: '/settings',
    icon: 'Setting',
    visible: true,
    children: []
  }
]

export function initMenuConfig() {
  // 检查是否已经初始化过菜单配置
  const existingConfig = localStorage.getItem('menu-config')
  if (!existingConfig) {
    // 如果没有,则保存默认配置
    localStorage.setItem('menu-config', JSON.stringify(defaultMenus))
  }
} 