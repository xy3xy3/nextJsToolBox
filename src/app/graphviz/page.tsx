'use client'

import GraphvizEditor from '@/components/tools/GraphvizEditor'

const defaultGraphvizCode = `digraph G {
    rankdir=TB;
    node [shape=box, style=filled, fillcolor=lightblue];
    
    A [label="开始"];
    B [label="处理数据"];
    C [label="验证结果"];
    D [label="成功"];
    E [label="失败"];
    F [label="结束"];
    
    A -> B;
    B -> C;
    C -> D [label="通过"];
    C -> E [label="不通过"];
    D -> F;
    E -> B [label="重试"];
    
    // 样式设置
    A [fillcolor=lightgreen];
    F [fillcolor=lightcoral];
    C [shape=diamond, fillcolor=lightyellow];
}`

export default function GraphvizPage() {
  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Graphviz 图表编辑器
        </h1>
        <p className="text-gray-600 mt-2">
          使用 DOT 语言创建有向图、无向图、流程图等各种图表，支持实时预览和导出功能
        </p>
      </div>

      {/* 编辑器 */}
      <GraphvizEditor initialValue={defaultGraphvizCode} />
    </div>
  )
}
