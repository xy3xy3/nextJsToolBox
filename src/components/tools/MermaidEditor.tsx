'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Download, Upload, Copy, RotateCcw, Image, FileImage, AlertCircle, CheckCircle, ZoomIn, ZoomOut, RotateCw } from 'lucide-react'

interface MermaidEditorProps {
  initialValue?: string
}

interface MermaidInstance {
  render: (id: string, code: string) => Promise<{ svg: string; innerHTML?: string }>
}

export default function MermaidEditor({ initialValue = '' }: MermaidEditorProps) {
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const previewContainerRef = useRef<HTMLDivElement>(null)
  const [code, setCode] = useState(initialValue)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [mermaidInstance, setMermaidInstance] = useState<MermaidInstance | null>(null)

  // 缩放相关状态
  const [zoom, setZoom] = useState(1)
  const minZoom = 0.1
  const maxZoom = 5
  const zoomStep = 0.1

  // 防抖渲染的 ref
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 初始化 Mermaid
  useEffect(() => {
    const initMermaid = async () => {
      try {
        setIsLoading(true)
        // 动态导入 Mermaid
        const mermaidModule = await import('mermaid')
        const mermaid = mermaidModule.default

        // 配置 Mermaid
        mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'loose',
          fontFamily: 'Arial, sans-serif',
          flowchart: {
            htmlLabels: true,
            useMaxWidth: true,
            curve: 'basis'
          },
          sequence: {
            useMaxWidth: true,
            diagramMarginX: 8,
            diagramMarginY: 8,
            boxMargin: 8,
            showSequenceNumbers: true
          },
          gantt: {
            leftPadding: 75,
            rightPadding: 20
          },
          pie: {
            useMaxWidth: true
          },
          journey: {
            useMaxWidth: true
          }
        })

        setMermaidInstance(mermaid)
      } catch (error) {
        console.error('Failed to load Mermaid:', error)
        setError('加载 Mermaid 失败，请刷新页面重试')
      } finally {
        setIsLoading(false)
      }
    }

    initMermaid()
  }, [])

  // 渲染 Mermaid 图表
  const renderMermaid = useCallback(async (mermaidCode: string) => {
    if (!mermaidInstance || !previewRef.current || !mermaidCode.trim()) {
      if (previewRef.current && !mermaidCode.trim()) {
        previewRef.current.innerHTML = '<div class="text-gray-500 text-center py-8">请输入 Mermaid 代码</div>'
      }
      return
    }

    try {
      setError(null)
      setIsLoading(true)

      // 清空预览区域
      previewRef.current.innerHTML = ''

      // 生成唯一 ID
      const id = `mermaid-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`

      // 验证和渲染图表
      const renderResult = await mermaidInstance.render(id, mermaidCode)

      if (previewRef.current && renderResult) {
        // 检查不同的可能属性
        const svgContent = renderResult.svg || renderResult.innerHTML || renderResult

        if (typeof svgContent === 'string' && svgContent.includes('<svg')) {
          // 直接插入 SVG 内容
          previewRef.current.innerHTML = svgContent

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
              const actualHeight = svgElement.getBBox().height || 400
              svgElement.setAttribute('height', actualHeight.toString())
            }
          }
        } else {
          throw new Error('渲染结果不包含有效的 SVG 内容')
        }
      } else {
        throw new Error('渲染结果为空或预览区域不存在')
      }
    } catch (error: unknown) {
      console.error('Mermaid render error:', error)
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
                    <li>检查 Mermaid 语法是否正确</li>
                    <li>确保图表类型声明正确（如 graph、sequenceDiagram 等）</li>
                    <li>检查节点名称和连接语法</li>
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
  }, [mermaidInstance])

  // 初始渲染 - 当 mermaidInstance 和 code 都准备好时
  useEffect(() => {
    if (mermaidInstance && code.trim()) {
      // 延迟一点确保组件完全挂载
      const timer = setTimeout(() => {
        renderMermaid(code)
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [mermaidInstance, renderMermaid, code]) // 添加 code 依赖

  // 处理代码变化
  const handleCodeChange = useCallback((value: string) => {
    setCode(value)

    // 防抖渲染
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    debounceTimeoutRef.current = setTimeout(() => {
      if (mermaidInstance && value.trim()) {
        renderMermaid(value)
      }
    }, 500)
  }, [mermaidInstance, renderMermaid])

  // 缩放功能
  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + zoomStep, maxZoom))
  }, [zoomStep, maxZoom])

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - zoomStep, minZoom))
  }, [zoomStep, minZoom])

  const handleZoomReset = useCallback(() => {
    setZoom(1)
  }, [])

  // 鼠标滚轮缩放
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        const delta = e.deltaY > 0 ? -zoomStep : zoomStep
        setZoom(prev => Math.max(minZoom, Math.min(maxZoom, prev + delta)))
      }
    }

    const previewContainer = previewContainerRef.current
    if (previewContainer) {
      previewContainer.addEventListener('wheel', handleWheel, { passive: false })
      return () => {
        previewContainer.removeEventListener('wheel', handleWheel)
      }
    }
  }, [zoomStep, minZoom, maxZoom])

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

      // 内联所有样式以避免跨域问题
      const styleElements = clonedSvg.querySelectorAll('style')
      styleElements.forEach(style => {
        if (style.textContent) {
          // 确保样式内联
          style.textContent = style.textContent.replace(/@import[^;]+;/g, '')
        }
      })

      // 移除可能导致跨域问题的属性
      const allElements = clonedSvg.querySelectorAll('*')
      allElements.forEach(el => {
        // 移除可能的外部引用
        el.removeAttribute('href')
        el.removeAttribute('xlink:href')
      })

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
          link.download = `mermaid-chart-${new Date().toISOString().slice(0, 10)}.png`
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
            link.download = `mermaid-chart-${new Date().toISOString().slice(0, 10)}.png`
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
      link.download = `mermaid-chart-${new Date().toISOString().slice(0, 10)}.svg`
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border-b border-gray-200 gap-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Mermaid 图表编辑器
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {/* 状态指示器 */}
          <div className="flex flex-wrap items-center gap-2">
            {isLoading && (
              <div className="flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-md">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-1"></div>
                <span className="hidden sm:inline">渲染中...</span>
                <span className="sm:hidden">渲染</span>
              </div>
            )}
            {error && (
              <div className="flex items-center px-2 py-1 text-xs font-medium text-red-700 bg-red-50 border border-red-300 rounded-md">
                <AlertCircle size={12} className="mr-1" />
                <span className="hidden sm:inline">有错误</span>
                <span className="sm:hidden">错误</span>
              </div>
            )}
            {!isLoading && !error && code.trim() && (
              <div className="flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-50 border border-green-300 rounded-md">
                <CheckCircle size={12} className="mr-1" />
                <span className="hidden sm:inline">渲染成功</span>
                <span className="sm:hidden">成功</span>
              </div>
            )}
          </div>

          <div className="hidden sm:block h-6 w-px bg-gray-300" />

          {/* 导出按钮 */}
          <button
            onClick={exportPNG}
            disabled={!code.trim() || !!error || isLoading}
            className="flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Image size={14} className="mr-1" />
            <span className="hidden sm:inline">导出 PNG</span>
            <span className="sm:hidden">PNG</span>
          </button>
          <button
            onClick={exportSVG}
            disabled={!code.trim() || !!error || isLoading}
            className="flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileImage size={14} className="mr-1" />
            <span className="hidden sm:inline">导出 SVG</span>
            <span className="sm:hidden">SVG</span>
          </button>
        </div>
      </div>

      {/* 编辑器主体 */}
      <div className="flex flex-col lg:flex-row h-[600px] lg:h-[600px]">
        {/* 代码编辑器 */}
        <div className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r border-gray-200 h-[300px] lg:h-full">
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-700">Mermaid 代码</h3>
          </div>
          <div className="flex-1 relative">
            <textarea
              ref={editorRef}
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              className="w-full h-full p-4 font-mono text-sm border-0 resize-none focus:outline-none focus:ring-0"
              placeholder="请输入 Mermaid 代码..."
              spellCheck={false}
            />
          </div>
        </div>

        {/* 预览区域 */}
        <div className="flex-1 flex flex-col h-[300px] lg:h-full">
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">图表预览</h3>
            <div className="flex items-center space-x-2">
              {/* 缩放控制 */}
              <div className="flex items-center space-x-1 bg-white border border-gray-300 rounded-md">
                <button
                  onClick={handleZoomOut}
                  disabled={zoom <= minZoom}
                  className="p-1 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="缩小 (Ctrl + 鼠标滚轮)"
                >
                  <ZoomOut size={14} />
                </button>
                <span className="px-2 py-1 text-xs font-mono text-gray-600 border-x border-gray-300 min-w-[50px] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  disabled={zoom >= maxZoom}
                  className="p-1 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="放大 (Ctrl + 鼠标滚轮)"
                >
                  <ZoomIn size={14} />
                </button>
              </div>
              <button
                onClick={handleZoomReset}
                disabled={zoom === 1}
                className="p-1 text-gray-600 hover:bg-gray-100 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                title="重置缩放"
              >
                <RotateCw size={14} />
              </button>
            </div>
          </div>
          <div
            ref={previewContainerRef}
            className="flex-1 p-4 overflow-auto bg-white"
            style={{ cursor: 'grab' }}
          >
            {isLoading && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">渲染图表中...</p>
                </div>
              </div>
            )}
            <div
              ref={previewRef}
              className="min-h-full transition-transform duration-200 ease-in-out"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'center center',
                minHeight: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            />
          </div>
        </div>
      </div>

      {/* 底部工具栏 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border-t border-gray-200 bg-gray-50 gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              const input = document.createElement('input')
              input.type = 'file'
              input.accept = '.mmd,.txt'
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
            className="flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Upload size={14} className="mr-1" />
            <span className="hidden sm:inline">导入文件</span>
            <span className="sm:hidden">导入</span>
          </button>

          <button
            onClick={() => {
              const blob = new Blob([code], { type: 'text/plain' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `mermaid-${new Date().toISOString().slice(0, 10)}.mmd`
              document.body.appendChild(a)
              a.click()
              document.body.removeChild(a)
              URL.revokeObjectURL(url)
            }}
            className="flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Download size={14} className="mr-1" />
            <span className="hidden sm:inline">导出代码</span>
            <span className="sm:hidden">导出</span>
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
            className="flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Copy size={14} className="mr-1" />
            <span className="hidden sm:inline">复制代码</span>
            <span className="sm:hidden">复制</span>
          </button>

          <button
            onClick={() => {
              if (confirm('确定要清空所有内容吗？')) {
                setCode('')
                setError(null)
                if (previewRef.current) {
                  previewRef.current.innerHTML = '<div class="text-gray-500 text-center py-8">请输入 Mermaid 代码</div>'
                }
              }
            }}
            className="flex items-center px-2 py-1 text-xs font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <RotateCcw size={14} className="mr-1" />
            <span className="hidden sm:inline">清空</span>
            <span className="sm:hidden">清空</span>
          </button>
        </div>

        <div className="text-xs text-gray-500 text-center sm:text-left">
          <span className="hidden sm:inline">字符数: {code.length} | 行数: {code.split('\n').length}</span>
          <span className="sm:hidden">{code.length}字符 | {code.split('\n').length}行</span>
        </div>
      </div>

      {/* 示例模板 */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <h3 className="text-sm font-medium text-gray-700 mb-3">快速模板</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          <button
            onClick={() => {
              const template = `graph TD
    A[开始] --> B{条件判断}
    B -->|是| C[执行操作]
    B -->|否| D[其他操作]
    C --> E[结束]
    D --> E

    style A fill:#e1f5fe
    style E fill:#f3e5f5
    style B fill:#fff3e0`
              setCode(template)
              handleCodeChange(template)
            }}
            className="px-3 py-2 text-xs text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            流程图
          </button>

          <button
            onClick={() => {
              const template = `sequenceDiagram
    participant U as 用户
    participant S as 系统
    participant D as 数据库

    U->>S: 登录请求
    S->>D: 验证用户
    D-->>S: 返回结果
    S-->>U: 登录成功

    U->>S: 获取数据
    S->>D: 查询数据
    D-->>S: 返回数据
    S-->>U: 显示数据`
              setCode(template)
              handleCodeChange(template)
            }}
            className="px-3 py-2 text-xs text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            时序图
          </button>

          <button
            onClick={() => {
              const template = `gantt
    title 项目开发进度
    dateFormat  YYYY-MM-DD
    section 需求阶段
    需求分析    :done, req1, 2024-01-01, 2024-01-05
    原型设计    :done, req2, 2024-01-06, 2024-01-10
    section 设计阶段
    UI设计      :active, des1, 2024-01-11, 2024-01-20
    架构设计    :des2, 2024-01-15, 2024-01-25
    section 开发阶段
    前端开发    :dev1, after des1, 15d
    后端开发    :dev2, after des2, 20d
    测试        :test1, after dev1, 5d`
              setCode(template)
              handleCodeChange(template)
            }}
            className="px-3 py-2 text-xs text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            甘特图
          </button>

          <button
            onClick={() => {
              const template = `pie title 技术栈分布
    "React" : 35
    "Vue" : 25
    "Angular" : 15
    "Svelte" : 10
    "其他" : 15`
              setCode(template)
              handleCodeChange(template)
            }}
            className="px-3 py-2 text-xs text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            饼图
          </button>

          <button
            onClick={() => {
              const template = `classDiagram
    class User {
        +String name
        +String email
        +login()
        +logout()
    }

    class Order {
        +String id
        +Date date
        +calculate()
    }

    class Product {
        +String name
        +Float price
        +getInfo()
    }

    User "1" --> "0..*" Order : places
    Order "1" --> "1..*" Product : contains`
              setCode(template)
              handleCodeChange(template)
            }}
            className="px-3 py-2 text-xs text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            类图
          </button>

          <button
            onClick={() => {
              const template = `journey
    title 用户购物体验
    section 浏览商品
      访问网站: 5: 用户
      搜索商品: 4: 用户
      查看详情: 3: 用户
    section 下单购买
      添加购物车: 4: 用户
      填写信息: 2: 用户
      支付订单: 3: 用户
    section 收货评价
      等待发货: 2: 用户
      收到商品: 5: 用户
      评价商品: 4: 用户`
              setCode(template)
              handleCodeChange(template)
            }}
            className="px-3 py-2 text-xs text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            用户旅程
          </button>
        </div>

        <div className="mt-3 text-xs text-gray-500">
          💡 提示：点击模板按钮快速开始，或在左侧编辑器中输入自定义 Mermaid 代码
          <br />
          🔍 缩放：使用预览区域右上角的 +/- 按钮，或按住 Ctrl 键并滚动鼠标滚轮进行缩放
        </div>
      </div>
    </div>
  )
}
