'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Download, Upload, Copy, RotateCcw, Image, FileImage, AlertCircle, CheckCircle } from 'lucide-react'

interface GraphvizEditorProps {
  initialValue?: string
}

interface GraphvizInstance {
  dot: (code: string) => string
}

export default function GraphvizEditor({ initialValue = '' }: GraphvizEditorProps) {
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const [code, setCode] = useState(initialValue)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [vizInstance, setVizInstance] = useState<GraphvizInstance | null>(null)

  // 防抖渲染的 ref
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 初始化 Graphviz
  useEffect(() => {
    const initGraphviz = async () => {
      try {
        setIsLoading(true)
        // 动态导入 @hpcc-js/wasm
        const { Graphviz } = await import('@hpcc-js/wasm')

        // 初始化 Graphviz 实例
        const viz = await Graphviz.load()
        setVizInstance(viz)
      } catch (error) {
        console.error('Failed to load Graphviz:', error)
        setError('加载 Graphviz 失败，请刷新页面重试')
      } finally {
        setIsLoading(false)
      }
    }

    initGraphviz()
  }, [])

  // 渲染 Graphviz 图表
  const renderGraphviz = useCallback(async (dotCode: string) => {
    if (!vizInstance || !previewRef.current || !dotCode.trim()) {
      if (previewRef.current && !dotCode.trim()) {
        previewRef.current.innerHTML = '<div class="text-gray-500 text-center py-8">请输入 Graphviz DOT 代码</div>'
      }
      return
    }

    try {
      setError(null)
      setIsLoading(true)

      // 清空预览区域
      previewRef.current.innerHTML = ''

      // 渲染 DOT 代码为 SVG
      const svgString = vizInstance.dot(dotCode)

      if (previewRef.current && svgString) {
        // 直接插入 SVG 内容
        previewRef.current.innerHTML = svgString

        // 添加样式优化
        const svgElement = previewRef.current.querySelector('svg')
        if (svgElement) {
          svgElement.style.maxWidth = '100%'
          svgElement.style.height = 'auto'
          svgElement.style.display = 'block'
          svgElement.style.margin = '0 auto'

          // 确保 SVG 可见
          svgElement.style.visibility = 'visible'
          svgElement.style.opacity = '1'

          // 如果没有尺寸，设置默认尺寸
          if (!svgElement.getAttribute('width')) {
            svgElement.setAttribute('width', '100%')
          }
          if (!svgElement.getAttribute('height')) {
            // 获取实际高度或设置默认值
            try {
              const actualHeight = svgElement.getBBox().height || 400
              svgElement.setAttribute('height', actualHeight.toString())
            } catch {
              svgElement.setAttribute('height', '400')
            }
          }
        }
      } else {
        throw new Error('渲染结果为空')
      }
    } catch (error: unknown) {
      console.error('Graphviz render error:', error)
      setError((error as Error).message || '图表渲染失败')

      if (previewRef.current) {
        // 更详细的错误信息显示
        const errorMessage = (error as Error).message || '未知错误'
        const errorDetails = (error as Error).stack || (error as Error).toString()

        previewRef.current.innerHTML = `
          <div class="text-red-600 p-4 bg-red-50 border border-red-200 rounded-lg max-w-full">
            <div class="flex items-start mb-3">
              <svg class="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
              <div class="flex-1 min-w-0">
                <span class="font-medium block">图表渲染错误</span>
                <div class="mt-2 text-sm">
                  <div class="font-medium mb-1">错误信息：</div>
                  <pre class="whitespace-pre-wrap break-words bg-white p-2 rounded border text-xs">${errorMessage}</pre>
                </div>
                <details class="mt-3">
                  <summary class="cursor-pointer text-sm font-medium hover:text-red-700">查看详细错误信息</summary>
                  <pre class="mt-2 text-xs bg-white p-2 rounded border whitespace-pre-wrap break-words">${errorDetails}</pre>
                </details>
                <div class="mt-3 text-sm">
                  <div class="font-medium mb-1">常见解决方案：</div>
                  <ul class="list-disc list-inside space-y-1 text-xs">
                    <li>检查 DOT 语法是否正确</li>
                    <li>确保图表类型声明正确（如 digraph、graph 等）</li>
                    <li>检查节点名称和边的语法</li>
                    <li>尝试使用快速模板重新开始</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        `
      }
    } finally {
      setIsLoading(false)
    }
  }, [vizInstance])

  // 初始渲染 - 当 vizInstance 和 code 都准备好时
  useEffect(() => {
    if (vizInstance && code.trim()) {
      // 延迟一点确保组件完全挂载
      const timer = setTimeout(() => {
        renderGraphviz(code)
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [vizInstance, renderGraphviz, code])

  // 处理代码变化
  const handleCodeChange = useCallback((value: string) => {
    setCode(value)

    // 防抖渲染
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    debounceTimeoutRef.current = setTimeout(() => {
      if (vizInstance && value.trim()) {
        renderGraphviz(value)
      }
    }, 500)
  }, [vizInstance, renderGraphviz])

  // 导出 PNG
  const exportPNG = useCallback(async () => {
    if (!previewRef.current) return

    const svgElement = previewRef.current.querySelector('svg')
    if (!svgElement) {
      alert('没有可导出的图表')
      return
    }

    try {
      // 克隆 SVG 元素以避免修改原始元素
      const clonedSvg = svgElement.cloneNode(true) as SVGElement

      // 获取 SVG 的实际尺寸
      const bbox = svgElement.getBBox()
      const svgRect = svgElement.getBoundingClientRect()

      // 使用更保守的尺寸计算，添加一些边距以确保完整性
      const padding = 20 // 添加边距
      const width = Math.max(
        bbox.width + padding * 2,
        svgRect.width + padding * 2,
        svgElement.clientWidth + padding * 2,
        800
      )

      const height = Math.max(
        bbox.height + padding * 2,
        svgRect.height + padding * 2,
        svgElement.clientHeight + padding * 2,
        600
      )

      // 设置 SVG 的 viewBox 和尺寸属性
      clonedSvg.setAttribute('width', width.toString())
      clonedSvg.setAttribute('height', height.toString())
      clonedSvg.setAttribute('viewBox', `0 0 ${width} ${height}`)
      clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')

      // 添加白色背景
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
      rect.setAttribute('width', '100%')
      rect.setAttribute('height', '100%')
      rect.setAttribute('fill', 'white')
      clonedSvg.insertBefore(rect, clonedSvg.firstChild)

      // 序列化 SVG
      const svgData = new XMLSerializer().serializeToString(clonedSvg)

      // 使用 data URL 而不是 blob URL 来避免跨域问题
      const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgData)}`

      // 创建 canvas
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        return
      }

      // 设置高分辨率
      const scale = 2
      canvas.width = width * scale
      canvas.height = height * scale
      ctx.scale(scale, scale)

      // 创建图片
      const img = new window.Image()

      // 设置 crossOrigin 以避免污染 canvas
      img.crossOrigin = 'anonymous'

      img.onload = async () => {
        try {
          // 先填充白色背景
          ctx.fillStyle = 'white'
          ctx.fillRect(0, 0, width, height)

          // 绘制 SVG
          ctx.drawImage(img, 0, 0, width, height)

          // 使用 toDataURL 而不是 toBlob 来避免安全限制
          const dataURL = canvas.toDataURL('image/png', 0.95)

          // 创建下载链接
          const link = document.createElement('a')
          link.href = dataURL
          link.download = `graphviz-chart-${new Date().toISOString().slice(0, 10)}.png`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)

        } catch (error) {
          console.error('Canvas drawing failed:', error)
          // 如果还是失败，尝试使用 html2canvas 库的方法
          try {
            const html2canvas = await import('html2canvas')
            const canvas = await html2canvas.default(previewRef.current!, {
              backgroundColor: 'white',
              scale: 2,
              useCORS: true,
              allowTaint: false
            })

            const dataURL = canvas.toDataURL('image/png', 0.95)
            const link = document.createElement('a')
            link.href = dataURL
            link.download = `graphviz-chart-${new Date().toISOString().slice(0, 10)}.png`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
          } catch (html2canvasError) {
            console.error('html2canvas also failed:', html2canvasError)
            alert('PNG 导出失败，建议使用 SVG 导出功能')
          }
        }
      }

      img.onerror = () => {
        console.error('Image loading failed')
        alert('图片加载失败，建议使用 SVG 导出功能')
      }

      img.src = dataUrl

    } catch (error) {
      console.error('Export PNG failed:', error)
      alert('导出 PNG 失败：' + (error as Error).message + '，建议使用 SVG 导出功能')
    }
  }, [])

  // 导出 SVG
  const exportSVG = useCallback(() => {
    if (!previewRef.current) return

    const svgElement = previewRef.current.querySelector('svg')
    if (!svgElement) {
      alert('没有可导出的图表')
      return
    }

    try {
      // 克隆 SVG 元素
      const clonedSvg = svgElement.cloneNode(true) as SVGElement

      // 获取 SVG 的实际尺寸
      const bbox = svgElement.getBBox()
      const svgRect = svgElement.getBoundingClientRect()

      // 使用更保守的尺寸计算，添加一些边距以确保完整性
      const padding = 20 // 添加边距
      const width = Math.max(
        bbox.width + padding * 2,
        svgRect.width + padding * 2,
        svgElement.clientWidth + padding * 2,
        800
      )

      const height = Math.max(
        bbox.height + padding * 2,
        svgRect.height + padding * 2,
        svgElement.clientHeight + padding * 2,
        600
      )

      // 设置 SVG 的属性以确保独立性
      clonedSvg.setAttribute('width', width.toString())
      clonedSvg.setAttribute('height', height.toString())
      clonedSvg.setAttribute('viewBox', `0 0 ${width} ${height}`)
      clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
      clonedSvg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink')

      // 添加白色背景
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
      rect.setAttribute('width', '100%')
      rect.setAttribute('height', '100%')
      rect.setAttribute('fill', 'white')
      clonedSvg.insertBefore(rect, clonedSvg.firstChild)

      // 序列化 SVG
      const svgData = new XMLSerializer().serializeToString(clonedSvg)

      // 添加 XML 声明
      const fullSvgData = `<?xml version="1.0" encoding="UTF-8"?>\n${svgData}`

      const blob = new Blob([fullSvgData], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.download = `graphviz-chart-${new Date().toISOString().slice(0, 10)}.svg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export SVG failed:', error)
      alert('导出 SVG 失败：' + (error as Error).message)
    }
  }, [])

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* 工具栏 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          Graphviz 图表编辑器
        </h2>
        <div className="flex items-center space-x-2">
          {/* 状态指示器 */}
          <div className="flex items-center space-x-2">
            {isLoading && (
              <div className="flex items-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-md">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                渲染中...
              </div>
            )}
            {error && (
              <div className="flex items-center px-3 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-300 rounded-md">
                <AlertCircle size={16} className="mr-2" />
                有错误
              </div>
            )}
            {!isLoading && !error && code.trim() && (
              <div className="flex items-center px-3 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-300 rounded-md">
                <CheckCircle size={16} className="mr-2" />
                渲染成功
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-gray-300" />

          {/* 导出按钮 */}
          <button
            onClick={exportPNG}
            disabled={!code.trim() || !!error || isLoading}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Image size={16} className="mr-2" aria-label="导出PNG图标" />
            导出 PNG
          </button>
          <button
            onClick={exportSVG}
            disabled={!code.trim() || !!error || isLoading}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileImage size={16} className="mr-2" />
            导出 SVG
          </button>
        </div>
      </div>

      {/* 编辑器主体 */}
      <div className="flex h-[600px]">
        {/* 左侧代码编辑器 */}
        <div className="flex-1 flex flex-col border-r border-gray-200">
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-700">Graphviz DOT 代码</h3>
          </div>
          <div className="flex-1 relative">
            <textarea
              ref={editorRef}
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              className="w-full h-full p-4 font-mono text-sm border-0 resize-none focus:outline-none focus:ring-0"
              placeholder="请输入 Graphviz DOT 代码..."
              spellCheck={false}
            />
          </div>
        </div>

        {/* 右侧预览区域 */}
        <div className="flex-1 flex flex-col">
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-700">图表预览</h3>
          </div>
          <div className="flex-1 p-4 overflow-auto bg-white">
            {isLoading && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">渲染图表中...</p>
                </div>
              </div>
            )}
            <div ref={previewRef} className="min-h-full" />
          </div>
        </div>
      </div>

      {/* 底部工具栏 */}
      <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => {
              const input = document.createElement('input')
              input.type = 'file'
              input.accept = '.dot,.gv,.txt'
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0]
                if (file) {
                  const reader = new FileReader()
                  reader.onload = (e) => {
                    const content = e.target?.result as string
                    setCode(content)
                    handleCodeChange(content)
                  }
                  reader.readAsText(file)
                }
              }
              input.click()
            }}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Upload size={16} className="mr-2" />
            导入文件
          </button>

          <button
            onClick={() => {
              const blob = new Blob([code], { type: 'text/plain' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `graphviz-${new Date().toISOString().slice(0, 10)}.dot`
              document.body.appendChild(a)
              a.click()
              document.body.removeChild(a)
              URL.revokeObjectURL(url)
            }}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Download size={16} className="mr-2" />
            导出代码
          </button>

          <button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(code)
                alert('代码已复制到剪贴板')
              } catch (error) {
                console.error('复制失败:', error)
                alert('复制失败，请手动复制')
              }
            }}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Copy size={16} className="mr-2" />
            复制代码
          </button>

          <button
            onClick={() => {
              if (confirm('确定要清空所有内容吗？')) {
                setCode('')
                setError(null)
                if (previewRef.current) {
                  previewRef.current.innerHTML = '<div class="text-gray-500 text-center py-8">请输入 Graphviz DOT 代码</div>'
                }
              }
            }}
            className="flex items-center px-3 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <RotateCcw size={16} className="mr-2" />
            清空
          </button>
        </div>

        <div className="text-sm text-gray-500">
          字符数: {code.length} | 行数: {code.split('\n').length}
        </div>
      </div>

      {/* 示例模板 */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <h3 className="text-sm font-medium text-gray-700 mb-3">快速模板</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          <button
            onClick={() => {
              const template = `digraph G {
    rankdir=TB;
    node [shape=box, style=filled, fillcolor=lightblue];

    A [label="开始"];
    B [label="处理"];
    C [label="判断"];
    D [label="结果1"];
    E [label="结果2"];
    F [label="结束"];

    A -> B;
    B -> C;
    C -> D [label="是"];
    C -> E [label="否"];
    D -> F;
    E -> F;
}`
              setCode(template)
              handleCodeChange(template)
            }}
            className="px-3 py-2 text-xs text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            有向图
          </button>

          <button
            onClick={() => {
              const template = `graph G {
    layout=neato;
    node [shape=circle, style=filled, fillcolor=lightgreen];

    A -- B;
    B -- C;
    C -- D;
    D -- A;
    A -- C;
    B -- D;

    A [label="节点A"];
    B [label="节点B"];
    C [label="节点C"];
    D [label="节点D"];
}`
              setCode(template)
              handleCodeChange(template)
            }}
            className="px-3 py-2 text-xs text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            无向图
          </button>

          <button
            onClick={() => {
              const template = `digraph hierarchy {
    rankdir=TB;
    node [shape=box, style=filled];

    CEO [fillcolor=gold, label="CEO"];
    CTO [fillcolor=lightblue, label="CTO"];
    CFO [fillcolor=lightblue, label="CFO"];

    Dev1 [fillcolor=lightgreen, label="开发1"];
    Dev2 [fillcolor=lightgreen, label="开发2"];
    QA [fillcolor=lightgreen, label="测试"];

    Acc1 [fillcolor=lightyellow, label="会计1"];
    Acc2 [fillcolor=lightyellow, label="会计2"];

    CEO -> CTO;
    CEO -> CFO;
    CTO -> Dev1;
    CTO -> Dev2;
    CTO -> QA;
    CFO -> Acc1;
    CFO -> Acc2;
}`
              setCode(template)
              handleCodeChange(template)
            }}
            className="px-3 py-2 text-xs text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            组织架构
          </button>

          <button
            onClick={() => {
              const template = `digraph process {
    rankdir=LR;
    node [shape=box, style=rounded];

    start [shape=ellipse, fillcolor=lightgreen, style=filled, label="开始"];
    input [fillcolor=lightblue, style=filled, label="输入数据"];
    process [fillcolor=lightyellow, style=filled, label="处理数据"];
    decision [shape=diamond, fillcolor=orange, style=filled, label="验证通过?"];
    output [fillcolor=lightblue, style=filled, label="输出结果"];
    error [fillcolor=lightcoral, style=filled, label="错误处理"];
    end [shape=ellipse, fillcolor=lightgreen, style=filled, label="结束"];

    start -> input;
    input -> process;
    process -> decision;
    decision -> output [label="是"];
    decision -> error [label="否"];
    output -> end;
    error -> input;
}`
              setCode(template)
              handleCodeChange(template)
            }}
            className="px-3 py-2 text-xs text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            流程图
          </button>

          <button
            onClick={() => {
              const template = `digraph network {
    layout=circo;
    node [shape=circle, style=filled];

    Server [fillcolor=red, label="服务器"];
    DB [fillcolor=blue, label="数据库"];
    Cache [fillcolor=green, label="缓存"];

    Client1 [fillcolor=lightblue, label="客户端1"];
    Client2 [fillcolor=lightblue, label="客户端2"];
    Client3 [fillcolor=lightblue, label="客户端3"];

    Client1 -> Server;
    Client2 -> Server;
    Client3 -> Server;
    Server -> DB;
    Server -> Cache;
    Cache -> DB;
}`
              setCode(template)
              handleCodeChange(template)
            }}
            className="px-3 py-2 text-xs text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            网络图
          </button>

          <button
            onClick={() => {
              const template = `digraph state {
    rankdir=LR;
    node [shape=circle, style=filled, fillcolor=lightblue];

    start [shape=doublecircle, fillcolor=lightgreen, label="开始"];
    idle [label="空闲"];
    running [label="运行"];
    paused [label="暂停"];
    stopped [shape=doublecircle, fillcolor=lightcoral, label="停止"];

    start -> idle;
    idle -> running [label="启动"];
    running -> paused [label="暂停"];
    running -> stopped [label="停止"];
    paused -> running [label="继续"];
    paused -> stopped [label="停止"];
    stopped -> idle [label="重置"];
}`
              setCode(template)
              handleCodeChange(template)
            }}
            className="px-3 py-2 text-xs text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            状态图
          </button>
        </div>

        <div className="mt-3 text-xs text-gray-500">
          💡 提示：点击模板按钮快速开始，或在左侧编辑器中输入自定义 Graphviz DOT 代码
        </div>
      </div>
    </div>
  )
}
