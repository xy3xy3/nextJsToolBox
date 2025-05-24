'use client'

import MarkdownEditor from '@/components/tools/MarkdownEditor'

const defaultMarkdown = `# 欢迎使用 Markdown 编辑器

这是一个功能强大的 Markdown 编辑器，基于 Vditor 构建。

## 主要功能

### ✨ 实时预览
- 支持分屏模式，左侧编辑，右侧实时预览
- 语法高亮显示
- 所见即所得编辑模式

### 📝 丰富的编辑功能
- **粗体文本**
- *斜体文本*
- ~~删除线~~
- \`行内代码\`
- [链接](https://example.com)

### 📋 代码块支持
\`\`\`javascript
function hello() {
  console.log('Hello, World!');
}
\`\`\`

### 📊 表格支持
| 功能 | 状态 | 描述 |
|------|------|------|
| Markdown 预览 | ✅ | 已完成 |
| HTML 预览 | 🚧 | 开发中 |
| Mermaid 图表 | 📋 | 计划中 |

### 📝 列表支持
1. 有序列表项 1
2. 有序列表项 2
   - 无序子项
   - 另一个子项

### 💡 提示
> 这是一个引用块，可以用来突出显示重要信息。

### 🔗 更多功能
- 支持 Emoji 表情 😊
- 支持数学公式（LaTeX）
- 支持流程图和时序图
- 文件导入导出
- 内容复制到剪贴板

---

开始编辑你的 Markdown 文档吧！`

export default function MarkdownPage() {
  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Markdown 编辑器
        </h1>
        <p className="text-gray-600 mt-2">
          功能强大的 Markdown 编辑和预览工具，支持实时预览、语法高亮、文件导入导出等功能
        </p>
      </div>

      {/* 编辑器 */}
      <MarkdownEditor initialValue={defaultMarkdown} />
    </div>
  )
}
