# Theme and Design Tokens

## Part 1 — Compact token summary

### Framework and cascade

- Global CSS load order: Ant Design Vue reset → Tailwind → Element Plus → Bootstrap → MdEditor → project global CSS → Font Awesome.
- Tailwind preflight: disabled to avoid Element Plus reset conflicts.
- Dark mode selector: `.dark`; no project-owned dark token block is currently defined.
- Component CSS: mostly scoped, with extensive direct hex values in individual pages.

### Colors

| Token/source | Value |
|---|---|
| `todo-blue` / `--el-color-primary` | `#2564cf` |
| `todo-hover` | `#eff6fc` |
| `todo-dark` | `#1f1f1f` |
| `todo-dark-hover` | `#2d2d2d` |
| Global scrollbar thumb | `#c1c1c1` |
| Global scrollbar hover | `#a8a8a8` |
| App text | `#2c3e50` |
| Shell surface | `white` |

Element Plus CSS variables such as `--el-border-color-light`, `--el-menu-bg-color`, `--el-text-color-primary`, and `--el-fill-color-light` are consumed directly; their default values come from the external Element Plus stylesheet.

### Typography

- App font family: `Avenir, Helvetica, Arial, sans-serif`.
- Shared shell username: `14px`.
- No project-owned type-scale tokens; Tailwind and UI-library defaults supply remaining sizes and weights.

### Spacing and sizing

- Tailwind default spacing scale (4px base) is available; no custom spacing extension.
- Header height: Element Plus default `60px`; main content uses `calc(100vh - 60px)`.
- Sidebar widths: expanded `200px`, collapsed `64px`; sidebar bottom control `40px` high.
- Main content padding: `20px`.
- Global scrollbar: `8px` track, `3px` transparent border, `4px` vertical margin.

### Radius and shadows

- Global scrollbar radius: `10px`.
- User avatar control radius: `20px`.
- No project-owned radius or shadow scale; Tailwind and Element Plus defaults are used.

### Breakpoints

- No custom breakpoints. Tailwind defaults apply: `sm 640px`, `md 768px`, `lg 1024px`, `xl 1280px`, `2xl 1536px`.

## Part 2 — Raw source dumps

### `frontend/tailwind.config.js`

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'todo-blue': '#2564cf',
        'todo-hover': '#eff6fc',
        'todo-dark': '#1f1f1f',
        'todo-dark-hover': '#2d2d2d'
      }
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false, // 禁用 Tailwind 的基础样式重置，避免与 Element Plus 冲突
  }
}
```

### `frontend/src/assets/tailwind.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* 处理与其他框架的样式冲突 */
@layer base {
  :root {
    --el-color-primary: theme('colors.todo-blue');
  }
}

/* 确保 Tailwind 的工具类优先级更高 */
@layer utilities {
  .tw-* {
    @apply !important;
  }
}
```

### `frontend/src/styles/index.css`

```css
/* 全局滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
  background-color: transparent;
  padding: 4px 0;
}

::-webkit-scrollbar-thumb {
  background-color: #c1c1c1;
  border: 3px solid transparent;
  background-clip: padding-box;
  border-radius: 10px;
  transition: background-color 0.2s;
  min-height: 50px;
}

::-webkit-scrollbar-thumb:hover {
  background-color: #a8a8a8;
  border: 3px solid transparent;
}

::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 10px;
  margin: 4px 0;
  padding: 1px;
}

/* Firefox 滚动条样式 */
* {
  scrollbar-width: thin;
  scrollbar-color: #c1c1c1 transparent;
}

/* 默认隐藏滚动条，悬浮时显示 */
::-webkit-scrollbar-thumb {
  background-color: transparent;
}

*:hover::-webkit-scrollbar-thumb {
  background-color: #c1c1c1;
  border: 3px solid transparent;
  background-clip: padding-box;
}
```

### Theme providers / token files

No local theme provider or standalone token file exists. Element Plus, Ant Design Vue, Bootstrap, and MdEditor themes are imported in `frontend/src/main.js`; the project-owned tokens are fully represented above.
