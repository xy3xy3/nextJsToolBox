'use client'

import MermaidEditor from '@/components/tools/MermaidEditor'

const defaultMermaidCode = `graph TD
    A[开始] --> B{是否有数据?}
    B -->|是| C[处理数据]
    B -->|否| D[获取数据]
    C --> E[显示结果]
    D --> C
    E --> F[结束]
    
    style A fill:#e1f5fe
    style F fill:#f3e5f5
    style B fill:#fff3e0
    style C fill:#e8f5e8
    style D fill:#fff8e1`

export default function MermaidPage() {
  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Mermaid 图表编辑器
        </h1>
        <p className="text-gray-600 mt-2">
          创建流程图、时序图、甘特图等各种图表，支持实时预览和导出功能
        </p>
      </div>

      {/* 编辑器 */}
      <MermaidEditor initialValue={defaultMermaidCode} />
    </div>
  )
}
