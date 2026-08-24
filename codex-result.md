# 目标与任务层级改造交付结果

## 分支

- `feature/goal-task-hierarchy`
- 基线：`main`

## 修改文件

- 领域与持久化：`frontend/src/domain/`、`frontend/src/repositories/workspaceRepository.js`
- 状态与事务命令：`frontend/src/stores/`、`frontend/src/services/workspaceCommands.js`、`frontend/src/services/workspaceEvents.js`
- 目标工作台：`frontend/src/views/GoalManagement.vue`、`frontend/src/components/goals/`
- 任务层级界面：`frontend/src/components/TodoItems.vue`、`frontend/src/components/tasks/`
- 业务集成：`frontend/src/views/CalendarView.vue`、`frontend/src/views/Dashboard.vue`、`frontend/src/components/PomodoroTimer.vue`、`frontend/src/store/modules/ai.js`
- 路由与入口：`frontend/src/router/index.js`、`frontend/src/main.js`
- 测试与工程配置：`frontend/tests/`、`frontend/vitest.config.js`、`frontend/playwright.config.js`、`frontend/package*.json`
- 方案与恢复文档：`docs/superpowers/`、`.superdesign/`、`README.md`

共修改 72 个文件；完整清单可通过 `git diff --name-status main...feature/goal-task-hierarchy` 查看。

## 实现内容

- 支持最多 20 层的多层目标、多层子任务，校验父级存在性、循环引用和层级上限。
- 目标详情重构为三栏工作台，提供目标树、详情、关联任务树，以及筛选、截止期、看板和思维导图。
- 可在指定目标下新建、编辑、移动任务；任务侧展示完整上层目标面包屑并支持双向跳转。
- 自动汇总子目标和任务的加权进度；同时支持手动进度及父任务派生完成规则。
- 工作区数据统一迁移至 V2，提供原子写入、版本冲突检测、失败回滚、损坏数据恢复与导出。
- 日历、仪表盘、番茄钟和 AI 任务入口统一消费 V2 数据源；日历批量删除避免误删同日其他任务。
- 增加键盘导航、响应式布局、触控目标尺寸和存储过期提示。

## 测试结果

- 单元/组件/集成测试：`npm run test:run`，17 个测试文件、132/132 通过。
- 端到端测试：`npm run test:e2e`，10/10 通过；层级性能样本 120.5 / 137.5 / 132.3 ms。
- 静态检查：`npm run lint -- --quiet`，0 错误、87 条既有警告。
- 生产构建：`npm run build`，成功，构建耗时约 121 秒。
- 差异检查：`git diff --check` 通过；旧存储访问和废弃目标/任务模块引用扫描无结果。

## 剩余风险

- `GoalMindMap` 的合成根节点 `__goals__` 被点击时会导航到无效路由 `/goals/__goals__`；真实目标节点导航正常，影响较低。
- 项目仍有 87 条 ESLint 基线警告；生产构建另有旧模块导出警告。
- 生产入口约 6.2 MiB，超过构建工具建议值，后续应按路由拆包并清理大依赖。
- 依赖审计基线仍有 89 项发现（13 低、36 中、33 高、7 严重），本次未进行跨范围依赖升级。
- Browserslist 数据已过期，后续维护窗口应更新兼容性数据库并重新回归。

## 关键实施裁定

- 锁文件仅随 Vitest 测试依赖变更重建，以保证测试环境可复现。
- `goalStore.viewFor(id, tasks, now)` 显式接收任务，避免 Goal/Task Store 循环依赖。
- 保留 `GoalManagement` 路由兼容入口，规范详情路由为 `/goals/:goalId?`。
- 既有 lint、构建和依赖审计告警作为基线技术债记录，不混入本次功能重构。
