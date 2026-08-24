# 终审修复报告

## 基线与方法

- 基线：`d9c90c07d2132c177dcf6597ba3cc127ad88d303`。
- 完整复核设计 spec、implementation plan、Task 10 报告、当前实现与 `writing-good-tests.md`。
- 逐项验证终审反馈；有效项均先形成失败测试或复现，再完成最小修复并回归。

## 九项交付

1. 日历按日批量删除
   - 删除前展示日期、当日任务，以及其他日期/无日期后代的名称、日期和数量。
   - 默认“提升并保留”，显式选择才级联；两种模式都只调用一次 Store 原子命令并持久化一次。
   - 跨日期/无日期后代在提升路径中重挂到最近保留父级，级联路径才删除。

2. 思维导图协议
   - 所有节点改为 simple-mind-map 真实结构 `{ data: { id, text, progress }, children: [...] }`。
   - 根节点 `children` 不再放入 `data`；点击优先使用 `node.getData('id')`。
   - 组件构造契约与浏览器工作台/看板/思维导图切换均已覆盖。

3. V2 仓储统一校验
   - load/save/migrate/restore 共用数组、ID、重复、引用、环、任务同目标父级、最大 20 层校验。
   - 缺失引用作为可修复孤儿在内存中断开并返回诊断；环、跨目标父任务、21 层等致命损坏在派生前拒绝。
   - 保留旧迁移兼容、乐观并发、写入原子性和失败回滚。

4. 损坏数据导出
   - 当前 V2 JSON/结构损坏时导出包含原始字节的诊断信封，不修改 storage。
   - GoalManagement 捕获下载失败并反馈。
   - 测试验证真实 JSON Blob、下载名/href、点击及异常路径 URL 释放。

5. 手动进度
   - GoalEditorDialog 支持可空的 0–100 `manualProgress`，创建/编辑均写回 Store 并持久化。
   - 有直属子目标或根任务时禁用，并解释派生进度优先。

6. 状态与截止筛选
   - 状态、截止时间和搜索采用 AND 组合；命中项保留祖先，节点展示可访问的派生状态标识。
   - 100 目标/1000 任务场景可操作；复用预计算任务视图并减少补丁写入的重复解析。
   - 最终性能样本：`114.2 / 114.2 / 100.1ms`，全部低于 `200ms`。

7. 目标侧任务编辑/移动
   - GoalTaskTree 递归只上报任务 ID。
   - GoalManagement 打开编辑/移动对话框，并统一调用 Task Store 的 `updateTask`/`moveTask`。
   - 移动排除自身和后代；父任务决定目标；跨目标移动后更新目标路由；无直接 storage 写入。

8. 响应式
   - 窄屏标题和操作区换行，筛选改单列。
   - 触控/中窄断点目标树操作按钮约 40×40，桌面继续保持 24×24 密度和悬停呈现。

9. Superdesign 恢复上下文
   - 移除失效行范围，contextFiles 与 fingerprints 键集合完全一致。
   - 所有上下文文件 SHA256 已按最终源码重算；schema/path/fingerprint 校验通过。
   - 未调用任何额度生成。

## TDD 证据

- 日历影响对话、默认提升/显式级联、mind-map 数据协议、V2 环/跨目标/21 层、损坏导出、manualProgress、筛选祖先保留、任务 ID 事件/移动、触控断点均先得到失败断言再修复。
- 性能全量复现曾失败于 `247.6ms`；定位到重复全量任务视图派生与补丁重复读取后，增加父级 Map 复用契约并修复，最终稳定通过。

## 最终验证

- `npm run test:run`：17 个文件、132/132 测试通过。
- `npm run test:e2e`：Chromium 10/10 场景通过，4.0 分钟。
- `npm run lint`：退出码 0，0 error；87 条均为未改旧文件既有 warning。
- `npm run build`：退出码 0；仅既有依赖导出、bundle size 与 Browserslist 数据告警。
- `git diff --check`：通过。
- resume schema/path/SHA256：通过。
- `frontend/src` 旧 `goals`/`todos` localStorage 直读：0；废弃 Goal 组件和旧 tasks module 引用：0。
- `frontend/dist` 已恢复到版本内容；`frontend/test-results`、Playwright report 和 report 生成目录已清理。

## 剩余风险

- 项目原有 87 条 lint warning、14 类构建告警与 6.2MiB 入口包仍存在，不属于本次终审范围。
- 数据仍依赖浏览器 localStorage 容量；配额错误已有回滚、可恢复提示和导出路径。
