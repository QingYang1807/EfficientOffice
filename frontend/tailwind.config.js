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