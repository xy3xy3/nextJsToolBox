'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Download, Upload, Copy, RotateCcw, Palette } from 'lucide-react'

// 防抖函数
function debounceString(
  func: (value: string) => void,
  wait: number
): (value: string) => void {
  let timeout: NodeJS.Timeout | null = null
  return (value: string) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(value), wait)
  }
}

interface HtmlEditorProps {
  initialValue?: string
}

export default function HtmlEditor({ initialValue = '' }: HtmlEditorProps) {
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const previewRef = useRef<HTMLIFrameElement>(null)
  const highlightRef = useRef<HTMLPreElement>(null)
  const [content, setContent] = useState(initialValue)
  const [isMounted, setIsMounted] = useState(false)
  // 固定为分屏模式，不再支持切换
  // 删除全屏功能
  const [showLineNumbers, setShowLineNumbers] = useState(true)
  const [fontSize, setFontSize] = useState(14)

  // 确保组件已挂载
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // 代码高亮功能
  const highlightCode = useCallback((code: string) => {
    // 简单的 HTML 语法高亮
    return code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/(&lt;\/?)([\w-]+)/g, '<span style="color: #e74c3c;">$1$2</span>')
      .replace(/([\w-]+)(=)/g, '<span style="color: #3498db;">$1</span><span style="color: #95a5a6;">$2</span>')
      .replace(/(=)("[^"]*")/g, '$1<span style="color: #27ae60;">$2</span>')
      .replace(/(=)('[^']*')/g, '$1<span style="color: #27ae60;">$2</span>')
      .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span style="color: #95a5a6; font-style: italic;">$1</span>')
  }, [])

  // 更新代码高亮
  const updateHighlight = useCallback(() => {
    if (highlightRef.current) {
      const highlighted = highlightCode(content)
      highlightRef.current.innerHTML = highlighted
    }
  }, [content, highlightCode])

  // 监听内容变化，更新高亮
  useEffect(() => {
    if (isMounted) {
      updateHighlight()
    }
  }, [isMounted, updateHighlight])

  // 防抖更新预览
  const updatePreview = useCallback((htmlContent: string) => {
    const debouncedUpdate = debounceString((content: string) => {
      if (previewRef.current) {
        const iframe = previewRef.current
        const doc = iframe.contentDocument || iframe.contentWindow?.document
        if (doc) {
          doc.open()
          doc.write(content)
          doc.close()
        }
      }
    }, 300)

    debouncedUpdate(htmlContent)
  }, [])

  // 处理内容变化
  const handleContentChange = (value: string) => {
    setContent(value)
    updatePreview(value)
  }

  // 初始化预览
  useEffect(() => {
    if (isMounted && content) {
      updatePreview(content)
    }
  }, [isMounted, content, updatePreview])

  // 导出 HTML 文件
  const exportHtml = () => {
    const blob = new Blob([content], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `html-${new Date().toISOString().slice(0, 10)}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // 导入 HTML 文件
  const importHtml = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.html,.htm,.txt'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const content = e.target?.result as string
          setContent(content)
          if (editorRef.current) {
            editorRef.current.value = content
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  // 复制内容到剪贴板
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(content)
      alert('HTML 代码已复制到剪贴板')
    } catch (error) {
      console.error('复制失败:', error)
      alert('复制失败，请手动复制')
    }
  }

  // 清空内容
  const clearContent = () => {
    if (confirm('确定要清空所有内容吗？')) {
      setContent('')
      if (editorRef.current) {
        editorRef.current.value = ''
      }
    }
  }

  // 删除视图模式切换功能

  // 删除全屏模式切换功能

  // 切换行号显示
  const toggleLineNumbers = () => {
    setShowLineNumbers(!showLineNumbers)
  }

  // 调整字体大小
  const adjustFontSize = (delta: number) => {
    setFontSize(prev => Math.max(10, Math.min(24, prev + delta)))
  }

  // 格式化 HTML 代码
  const formatHtml = () => {
    try {
      // 简单的 HTML 格式化
      const formatted = content
        .replace(/></g, '>\n<')
        .replace(/^\s+|\s+$/gm, '')
        .split('\n')
        .map((line, index, array) => {
          let indent = 0
          for (let i = 0; i < index; i++) {
            const prevLine = array[i]
            if (prevLine.includes('<') && !prevLine.includes('</') && !prevLine.includes('/>')) {
              indent++
            }
            if (prevLine.includes('</')) {
              indent--
            }
          }
          if (line.includes('</')) {
            indent--
          }
          return '  '.repeat(Math.max(0, indent)) + line.trim()
        })
        .join('\n')

      setContent(formatted)
      if (editorRef.current) {
        editorRef.current.value = formatted
      }
    } catch (error) {
      console.error('格式化失败:', error)
      alert('格式化失败，请检查 HTML 语法')
    }
  }

  // 生成行号
  const generateLineNumbers = (text: string) => {
    const lines = text.split('\n')
    return lines.map((_, index) => index + 1).join('\n')
  }

  // 删除视图模式相关函数

  if (!isMounted) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            HTML 编辑器
          </h2>
        </div>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">初始化编辑器中...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* 工具栏 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          HTML 编辑器
        </h2>
        <div className="flex items-center space-x-2">
          {/* 格式化按钮 */}
          <button
            onClick={formatHtml}
            className="flex items-center px-3 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-300 rounded-md hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            title="格式化 HTML 代码"
          >
            <Palette size={16} />
          </button>

          <div className="h-6 w-px bg-gray-300" />

          <button
            onClick={importHtml}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Upload size={16} className="mr-2" />
            导入
          </button>
          <button
            onClick={exportHtml}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Download size={16} className="mr-2" />
            导出
          </button>
          <button
            onClick={copyToClipboard}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Copy size={16} className="mr-2" />
            复制
          </button>
          <button
            onClick={clearContent}
            className="flex items-center px-3 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <RotateCcw size={16} className="mr-2" />
            清空
          </button>
        </div>
      </div>

      {/* 编辑器和预览区域 */}
      <div className="flex h-[calc(100vh-200px)]">
        {/* 编辑器区域 */}
        <div className="w-1/2 border-r border-gray-200 relative">
            {/* 编辑器工具栏 */}
            <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-600">字体大小:</span>
                <button
                  onClick={() => adjustFontSize(-1)}
                  className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50"
                >
                  -
                </button>
                <span className="text-xs text-gray-600 min-w-[2rem] text-center">{fontSize}px</span>
                <button
                  onClick={() => adjustFontSize(1)}
                  className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50"
                >
                  +
                </button>
              </div>
              <button
                onClick={toggleLineNumbers}
                className={`px-2 py-1 text-xs rounded ${
                  showLineNumbers
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-white text-gray-600 border border-gray-300'
                } hover:bg-blue-50`}
              >
                行号
              </button>
            </div>

            {/* 编辑器容器 */}
            <div className="relative h-[calc(100%-40px)] overflow-hidden">
              {/* 行号 */}
              {showLineNumbers && (
                <div
                  className="absolute left-0 top-0 w-12 h-full bg-gray-100 border-r border-gray-200 overflow-hidden"
                  style={{ fontSize: `${fontSize}px` }}
                >
                  <pre className="p-4 font-mono text-gray-500 text-right leading-relaxed whitespace-pre">
                    {generateLineNumbers(content)}
                  </pre>
                </div>
              )}

              {/* 代码高亮背景 */}
              <pre
                ref={highlightRef}
                className={`absolute top-0 h-full p-4 font-mono leading-relaxed whitespace-pre-wrap pointer-events-none overflow-hidden text-transparent`}
                style={{
                  fontSize: `${fontSize}px`,
                  left: showLineNumbers ? '48px' : '0',
                  width: showLineNumbers ? 'calc(100% - 48px)' : '100%'
                }}
              />

              {/* 实际的文本编辑器 */}
              <textarea
                ref={editorRef}
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                className={`absolute top-0 h-full p-4 font-mono bg-transparent border-none outline-none resize-none leading-relaxed`}
                style={{
                  fontSize: `${fontSize}px`,
                  left: showLineNumbers ? '48px' : '0',
                  width: showLineNumbers ? 'calc(100% - 48px)' : '100%',
                  color: 'rgba(0,0,0,0.8)'
                }}
                placeholder="在这里输入 HTML 代码..."
                spellCheck={false}
              />
            </div>
          </div>

        {/* 预览区域 */}
        <div className="w-1/2 bg-white">
          <iframe
            ref={previewRef}
            className="w-full h-full border-none"
            title="HTML 预览"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </div>
    </div>
  )
}
