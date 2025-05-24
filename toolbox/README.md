# 前端工具箱

基于 Next.js + React + Tailwind CSS 构建的前端开发工具集合，提供多种实用的开发工具。

## 🚀 功能特性

### ✅ 已实现功能
- **Markdown 编辑器**: 基于 Vditor 的强大 Markdown 编辑和预览工具
  - 实时预览
  - 语法高亮
  - 文件导入导出
  - 内容复制
  - 多种编辑模式

### 🚧 计划中功能
- **HTML 预览器**: 在线编辑 HTML 代码并实时预览
- **Mermaid 图表**: 创建流程图、时序图、甘特图等
- **Graphviz 图表**: 使用 DOT 语言创建复杂图形

## 🛠️ 技术栈

- **框架**: Next.js 15.1.8
- **UI 库**: React 19
- **样式**: Tailwind CSS
- **编辑器**: Vditor
- **图标**: Lucide React
- **语言**: TypeScript
- **包管理**: pnpm

## 📦 安装和运行

### 环境要求
- Node.js 18+
- pnpm

### 安装依赖
```bash
pnpm install
```

### 启动开发服务器
```bash
pnpm dev
```

应用将在 http://localhost:3000 启动

## 🎯 使用指南

### Markdown 编辑器
1. 访问首页，点击 "Markdown 预览" 卡片
2. 在左侧编辑区域输入 Markdown 内容
3. 右侧会实时显示预览效果
4. 使用工具栏功能：
   - **导入**: 从本地文件导入 Markdown
   - **导出**: 将内容导出为 .md 文件
   - **复制**: 复制内容到剪贴板
   - **清空**: 清空编辑器内容

### 响应式设计
- 桌面端：侧边栏固定显示
- 移动端：点击左上角菜单按钮显示/隐藏侧边栏
