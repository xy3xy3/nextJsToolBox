'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Download, Upload, Copy, RotateCcw, Zap, ZapOff } from 'lucide-react'

// 防抖函数 - 专门用于字符串输入
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

interface MarkdownEditorProps {
  initialValue?: string
}

export default function MarkdownEditor({ initialValue = '' }: MarkdownEditorProps) {
  const vditorRef = useRef<HTMLDivElement>(null)
  const vditorInstance = useRef<unknown>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [content, setContent] = useState(initialValue)
  const [isMounted, setIsMounted] = useState(false)

  // 性能监控状态
  const [performanceMode, setPerformanceMode] = useState<'normal' | 'high'>(
    initialValue.length > 10000 ? 'high' : 'normal'
  )

  // 确保组件已挂载
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // 优化的内容更新函数
  const updateContent = useCallback((value: string) => {
    const debouncedUpdate = debounceString((val: string) => {
      setContent(val)
      // 根据内容长度动态调整性能模式
      const newMode = val.length > 10000 ? 'high' : 'normal'
      if (newMode !== performanceMode) {
        setPerformanceMode(newMode)
      }
    }, performanceMode === 'high' ? 300 : 150)

    debouncedUpdate(value)
  }, [performanceMode])

  useEffect(() => {
    if (!isMounted) return

    const initVditor = async () => {
      try {
        // 动态导入 Vditor
        const VditorModule = await import('vditor')
        const Vditor = VditorModule.default

        if (vditorRef.current && !vditorInstance.current) {
          // 清空容器内容
          vditorRef.current.innerHTML = ''

          vditorInstance.current = new Vditor(vditorRef.current, {
            height: 'calc(100vh - 200px)',
            mode: 'sv', // 使用分屏模式，性能更好
            theme: 'classic',
            // 性能优化配置
            typewriterMode: false, // 关闭打字机模式，减少滚动计算
            preview: {
              theme: {
                current: 'light',
                path: 'https://cdn.jsdelivr.net/npm/vditor@3.11.0/dist/css/content-theme'
              },
              hljs: {
                style: 'github',
                lineNumber: false // 关闭行号显示，提升性能
              },
              // 延迟渲染预览，减少实时计算
              delay: 300, // 300ms 延迟渲染
              maxWidth: 800,
              // 数学公式渲染优化
              math: {
                inlineDigit: false,
                macros: {}
              }
            },
            // 编辑器性能优化
            tab: '\t',
            counter: {
              enable: false // 关闭字符计数，减少计算
            },
            // 简化工具栏，减少DOM元素
            toolbar: [
              'headings',
              'bold',
              'italic',
              'strike',
              '|',
              'list',
              'ordered-list',
              'check',
              '|',
              'quote',
              'line',
              'code',
              'inline-code',
              '|',
              'table',
              'link',
              '|',
              'undo',
              'redo',
              '|',
              'edit-mode',
              'fullscreen',
              {
                name: 'more',
                toolbar: [
                  'both',
                  'preview',
                  'outline',
                  'export'
                ]
              }
            ],
            // 缓存配置
            cache: {
              enable: true, // 启用缓存
              id: 'vditor-cache'
            },
            // 上传配置（禁用以提升性能）
            upload: {
              accept: 'image/*',
              max: 10 * 1024 * 1024, // 10MB
              url: '', // 禁用上传
            },
            value: content,
            // 使用优化的输入处理
            input: updateContent,
            after: () => {
              setIsLoading(false)
              // 编辑器加载完成后的性能优化
              if (vditorInstance.current && typeof vditorInstance.current === 'object') {
                const editor = vditorInstance.current as { vditor?: { element?: HTMLElement } }
                // 禁用一些可能影响性能的功能
                if (editor.vditor?.element) {
                  const element = editor.vditor.element
                  // 优化滚动性能
                  element.style.willChange = 'scroll-position'
                }
              }
            }
          })
        }
      } catch (error) {
        console.error('Failed to load Vditor:', error)
        setIsLoading(false)
      }
    }

    initVditor()

    return () => {
      if (vditorInstance.current && typeof vditorInstance.current === 'object' && 'destroy' in vditorInstance.current) {
        (vditorInstance.current as { destroy: () => void }).destroy()
        vditorInstance.current = null
      }
    }
  }, [isMounted, updateContent, content])

  // 导出 Markdown 文件
  const exportMarkdown = () => {
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `markdown-${new Date().toISOString().slice(0, 10)}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // 导入 Markdown 文件
  const importMarkdown = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.md,.markdown,.txt'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const content = e.target?.result as string
          if (vditorInstance.current && typeof vditorInstance.current === 'object' && 'setValue' in vditorInstance.current) {
            (vditorInstance.current as { setValue: (value: string) => void }).setValue(content)
          }
          setContent(content)
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
      alert('内容已复制到剪贴板')
    } catch (error) {
      console.error('复制失败:', error)
      alert('复制失败，请手动复制')
    }
  }

  // 清空内容
  const clearContent = () => {
    if (confirm('确定要清空所有内容吗？')) {
      if (vditorInstance.current && typeof vditorInstance.current === 'object' && 'setValue' in vditorInstance.current) {
        (vditorInstance.current as { setValue: (value: string) => void }).setValue('')
      }
      setContent('')
    }
  }

  // 切换性能模式
  const togglePerformanceMode = () => {
    const newMode = performanceMode === 'normal' ? 'high' : 'normal'
    setPerformanceMode(newMode)
  }

  // 如果组件还没有挂载，显示加载状态
  if (!isMounted) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Markdown 编辑器
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
          Markdown 编辑器
        </h2>
        <div className="flex items-center space-x-2">
          {/* 性能模式指示器 */}
          <button
            onClick={togglePerformanceMode}
            className={`flex items-center px-3 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 ${
              performanceMode === 'high'
                ? 'text-orange-700 bg-orange-50 border border-orange-300 hover:bg-orange-100 focus:ring-orange-500'
                : 'text-green-700 bg-green-50 border border-green-300 hover:bg-green-100 focus:ring-green-500'
            }`}
            title={`当前: ${performanceMode === 'high' ? '高性能模式' : '普通模式'} (点击切换)`}
          >
            {performanceMode === 'high' ? <Zap size={16} className="mr-2" /> : <ZapOff size={16} className="mr-2" />}
            {performanceMode === 'high' ? '高性能' : '普通'}
          </button>

          <div className="h-6 w-px bg-gray-300" />

          <button
            onClick={importMarkdown}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Upload size={16} className="mr-2" />
            导入
          </button>
          <button
            onClick={exportMarkdown}
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

      {/* 编辑器容器 */}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">加载编辑器中...</p>
            </div>
          </div>
        )}
        <div ref={vditorRef} className="vditor-container" />
      </div>
    </div>
  )
}
