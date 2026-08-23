# EfficientOffice Goal Workspace Design System

## Product and job

EfficientOffice is a Chinese desktop productivity application. The goal workspace helps users decompose outcomes into nested goals and executable task trees, understand inherited context, and act without leaving the page.

## Information architecture

- Persistent application shell: 60px white header, 200px/64px collapsible left navigation, 20px content inset.
- Goal workspace desktop: 280px goal-tree rail, flexible goal-detail canvas, 360px task-tree rail.
- Below 1024px: goal tree moves to a drawer; detail and tasks become tabs.
- Full goal breadcrumb is always visible above the selected goal.
- The detail canvas prioritizes title, derived status/progress, deadline, description, child goals, and progress composition.
- The task rail defaults to tasks directly owned by the selected goal; descendant-goal aggregation is an explicit switch.

## Visual language

- Keep the existing product's Element Plus language and restrained enterprise tone.
- Font: Avenir, Helvetica, Arial, sans-serif.
- Primary: #2564cf. Primary hover surface: #eff6fc.
- Text: #1f2937 primary, #4b5563 secondary, #6b7280 tertiary.
- Surfaces: #ffffff primary, #f8fafc page, #f3f4f6 muted.
- Borders: #e5e7eb; selected border #2564cf.
- Status: completed #059669, overdue #dc2626, in-progress #2564cf, not-started #6b7280.
- Radius: 8px controls, 10px cards, 12px primary panels. Avoid decorative glassmorphism and gradients.
- Shadow: subtle only, 0 1px 3px rgba(15,23,42,.08); selected/hover 0 4px 12px rgba(37,100,207,.12).
- Spacing follows a 4px base: 4/8/12/16/20/24/32.
- Dense but calm: use dividers, indentation, compact badges, and whitespace hierarchy instead of oversized cards.

## Component rules

- Use Element Plus controls and @element-plus/icons-vue; do not invent a second control language.
- Goal-tree nodes show disclosure, title, compact status, percentage, and keyboard-accessible actions.
- Primary actions: “新增子目标” and “新增任务”; secondary action: “编辑目标”.
- Progress composition uses compact horizontal rows/bars, never large decorative charts.
- Empty states explain the next action and include one clear button.
- Destructive and move actions live in overflow menus with confirmation.
- All icon-only actions require accessible labels and visible focus states.

## Motion and responsiveness

- 150–200ms ease for hover, focus, drawer, tab, and tree expansion.
- No celebratory or continuous animation in the core workspace.
- Keep selection and breadcrumb stable during edits; update progress in place.
- Mobile/touch targets are at least 40px; desktop compact actions at least 32px.

## Hard requirements

- Render nested goals and tasks to arbitrary data depth while enforcing a 20-level product limit.
- Search retains ancestors of matching goals; missing-parent items appear under “待修复”.
- Invalid route IDs show “目标不存在或已删除” and a recovery action to `/goals`.
- Persist expanded and selected UI IDs separately from domain records.
- Use only these fonts, colors, spacing, and component styles; do not introduce new visual styles.
