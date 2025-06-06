'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Download, Upload, Copy, RotateCcw, Image as ImageIcon, FileImage, AlertCircle, CheckCircle, ZoomIn, ZoomOut, RotateCw } from 'lucide-react'

interface PlantUMLEditorProps {
  initialValue?: string
}

interface PlantUMLEncoder {
  encode: (source: string) => string
  decode: (encoded: string) => string
}

export default function PlantUMLEditor({ initialValue = '' }: PlantUMLEditorProps) {
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const previewContainerRef = useRef<HTMLDivElement>(null)
  const [code, setCode] = useState(initialValue)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [encoderInstance, setEncoderInstance] = useState<PlantUMLEncoder | null>(null)

  // 缩放相关状态
  const [zoom, setZoom] = useState(1)
  const minZoom = 0.1
  const maxZoom = 5
  const zoomStep = 0.1

  // 防抖渲染的 ref
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 初始化 PlantUML Encoder
  useEffect(() => {
    const initEncoder = async () => {
      try {
        setIsLoading(true)
        // 动态导入 plantuml-encoder
        const encoder = await import('plantuml-encoder')
        setEncoderInstance(encoder)
      } catch (error) {
        console.error('Failed to load PlantUML encoder:', error)
        setError('加载 PlantUML 编码器失败，请刷新页面重试')
      } finally {
        setIsLoading(false)
      }
    }

    initEncoder()
  }, [])

  // 渲染 PlantUML 图表
  const renderPlantUML = useCallback(async (plantUMLCode: string) => {
    if (!encoderInstance || !previewRef.current || !plantUMLCode.trim()) {
      if (previewRef.current && !plantUMLCode.trim()) {
        previewRef.current.innerHTML = '<div class="text-gray-500 text-center py-8">请输入 PlantUML 代码</div>'
      }
      return
    }

    try {
      setError(null)
      setIsLoading(true)

      // 编码 PlantUML 代码
      const encoded = encoderInstance.encode(plantUMLCode)

      // 构建 PlantUML 服务器 URL (使用 SVG 格式)
      // 可以使用官方服务器或备用服务器
      const svgUrl = `https://www.plantuml.com/plantuml/svg/${encoded}`

      // 先尝试直接获取 SVG 内容来检查是否有错误
      try {
        // 添加超时控制
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10秒超时

        const response = await fetch(svgUrl, {
          signal: controller.signal,
          headers: {
            'Accept': 'image/svg+xml,*/*'
          }
        })
        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const svgContent = await response.text()

        // 检查是否是错误响应（PlantUML 错误通常包含特定的错误信息）
        if (svgContent.includes('Syntax Error') || svgContent.includes('Error line') || svgContent.includes('Unknown')) {
          // 尝试解析错误信息
          const parser = new DOMParser()
          const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml')
          const textElements = svgDoc.querySelectorAll('text')
          let errorMessage = 'PlantUML 语法错误'

          // 提取错误信息
          for (const textEl of textElements) {
            const text = textEl.textContent || ''
            if (text.includes('Syntax Error') || text.includes('Error line') || text.includes('Unknown')) {
              errorMessage = text
              break
            }
          }

          setError(errorMessage)
          setIsLoading(false)
          if (previewRef.current) {
            previewRef.current.innerHTML = `
              <div class="text-red-500 text-center py-8">
                <div class="mb-2">图表渲染失败</div>
                <div class="text-sm text-gray-600">${errorMessage}</div>
              </div>
            `
          }
          return
        }

        // 如果没有错误，显示图表
        if (previewRef.current) {
          // 创建 SVG 容器
          const svgContainer = document.createElement('div')
          svgContainer.className = 'plantuml-container'
          svgContainer.style.cssText = `
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 200px;
            padding: 20px;
          `

          // 直接插入 SVG 内容
          svgContainer.innerHTML = svgContent

          // 为 SVG 添加样式
          const svgElement = svgContainer.querySelector('svg')
          if (svgElement) {
            svgElement.style.cssText = `
              max-width: 100%;
              height: auto;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              background: white;
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            `
          }

          previewRef.current.innerHTML = ''
          previewRef.current.appendChild(svgContainer)
        }
        setIsLoading(false)

      } catch (fetchError) {
        console.error('Fetch error:', fetchError)

        let errorMessage = '网络连接失败'
        let errorDetail = '请检查网络连接或稍后重试'

        if (fetchError instanceof Error) {
          if (fetchError.name === 'AbortError') {
            errorMessage = '请求超时'
            errorDetail = 'PlantUML 服务器响应超时，请稍后重试'
          } else if (fetchError.message.includes('Failed to fetch')) {
            errorMessage = '无法连接到 PlantUML 服务器'
            errorDetail = '请检查网络连接或使用代理'
          } else {
            errorDetail = fetchError.message
          }
        }

        setError(`${errorMessage}: ${errorDetail}`)
        setIsLoading(false)
        if (previewRef.current) {
          previewRef.current.innerHTML = `
            <div class="text-red-500 text-center py-8">
              <div class="mb-2">${errorMessage}</div>
              <div class="text-sm text-gray-600">${errorDetail}</div>
            </div>
          `
        }
      }

    } catch (error) {
      console.error('PlantUML rendering error:', error)
      setError('PlantUML 渲染出错: ' + (error as Error).message)
      setIsLoading(false)
      if (previewRef.current) {
        previewRef.current.innerHTML = `
          <div class="text-red-500 text-center py-8">
            <div class="mb-2">渲染出错</div>
            <div class="text-sm text-gray-600">${(error as Error).message}</div>
          </div>
        `
      }
    }
  }, [encoderInstance])

  // 处理代码变化
  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode)

    // 清除之前的防抖定时器
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    // 设置新的防抖定时器
    debounceTimeoutRef.current = setTimeout(() => {
      renderPlantUML(newCode)
    }, 500) // 500ms 防抖延迟
  }, [renderPlantUML])

  // 初始渲染
  useEffect(() => {
    if (encoderInstance && code) {
      renderPlantUML(code)
    }
  }, [encoderInstance, code, renderPlantUML])

  // 清理防抖定时器
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [])

  // 缩放功能
  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + zoomStep, maxZoom))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - zoomStep, minZoom))
  }, [])

  const handleZoomReset = useCallback(() => {
    setZoom(1)
  }, [])

  // 鼠标滚轮缩放
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -zoomStep : zoomStep
      setZoom(prev => Math.max(minZoom, Math.min(maxZoom, prev + delta)))
    }
  }, [])

  // 导出 SVG
  const exportSVG = useCallback(async () => {
    if (!encoderInstance || !code.trim()) {
      alert('没有可导出的图表')
      return
    }

    try {
      const encoded = encoderInstance.encode(code)
      const svgUrl = `https://www.plantuml.com/plantuml/svg/${encoded}`

      // 获取 SVG 内容
      const response = await fetch(svgUrl)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const svgContent = await response.text()

      // 检查是否是错误响应
      if (svgContent.includes('Syntax Error') || svgContent.includes('Error line')) {
        alert('导出失败：PlantUML 代码存在语法错误，请先修复代码')
        return
      }

      // 创建下载链接
      const blob = new Blob([svgContent], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `plantuml-chart-${new Date().toISOString().slice(0, 10)}.svg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('SVG export failed:', error)
      alert(`SVG 导出失败: ${(error as Error).message}`)
    }
  }, [encoderInstance, code])

  // 导出 PNG
  const exportPNG = useCallback(async () => {
    if (!encoderInstance || !code.trim()) {
      alert('没有可导出的图表')
      return
    }

    try {
      const encoded = encoderInstance.encode(code)

      // 先检查 SVG 是否有错误
      const svgUrl = `https://www.plantuml.com/plantuml/svg/${encoded}`
      const svgResponse = await fetch(svgUrl)
      if (!svgResponse.ok) {
        throw new Error(`HTTP ${svgResponse.status}: ${svgResponse.statusText}`)
      }

      const svgContent = await svgResponse.text()
      if (svgContent.includes('Syntax Error') || svgContent.includes('Error line')) {
        alert('导出失败：PlantUML 代码存在语法错误，请先修复代码')
        return
      }

      // 如果没有错误，导出 PNG
      const pngUrl = `https://www.plantuml.com/plantuml/png/${encoded}`

      // 创建下载链接
      const link = document.createElement('a')
      link.href = pngUrl
      link.download = `plantuml-chart-${new Date().toISOString().slice(0, 10)}.png`
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('PNG export failed:', error)
      alert(`PNG 导出失败: ${(error as Error).message}`)
    }
  }, [encoderInstance, code])

  // 复制代码到剪贴板
  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code)
      alert('代码已复制到剪贴板')
    } catch (error) {
      console.error('Copy failed:', error)
      alert('复制失败')
    }
  }, [code])

  // 清空代码
  const clearCode = useCallback(() => {
    if (confirm('确定要清空所有代码吗？')) {
      setCode('')
      handleCodeChange('')
    }
  }, [handleCodeChange])

  // 文件导入
  const handleFileImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setCode(content)
        handleCodeChange(content)
      }
      reader.readAsText(file)
    }
    // 重置 input 值，允许重复选择同一文件
    event.target.value = ''
  }, [handleCodeChange])

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* 工具栏 */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* 左侧按钮组 */}
          <div className="flex flex-wrap items-center gap-2">
            {/* 文件操作 */}
            <div className="flex items-center gap-1 border-r border-gray-200 pr-2">
              <label className="flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                <Upload size={14} className="mr-1" />
                <span className="hidden sm:inline">导入</span>
                <input
                  type="file"
                  accept=".puml,.plantuml,.txt"
                  onChange={handleFileImport}
                  className="hidden"
                />
              </label>

              <button
                onClick={() => {
                  const blob = new Blob([code], { type: 'text/plain' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `plantuml-${new Date().toISOString().slice(0, 10)}.puml`
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
            </div>

            {/* 编辑操作 */}
            <div className="flex items-center gap-1 border-r border-gray-200 pr-2">
              <button
                onClick={copyToClipboard}
                className="flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Copy size={14} className="mr-1" />
                <span className="hidden sm:inline">复制</span>
              </button>

              <button
                onClick={clearCode}
                className="flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <RotateCcw size={14} className="mr-1" />
                <span className="hidden sm:inline">清空</span>
              </button>
            </div>

            {/* 导出图片 */}
            <div className="flex items-center gap-1">
              <button
                onClick={exportSVG}
                className="flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <ImageIcon size={14} className="mr-1" />
                <span className="hidden sm:inline">导出 SVG</span>
                <span className="sm:hidden">SVG</span>
              </button>

              <button
                onClick={exportPNG}
                className="flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <FileImage size={14} className="mr-1" />
                <span className="hidden sm:inline">导出 PNG</span>
                <span className="sm:hidden">PNG</span>
              </button>
            </div>
          </div>

          {/* 右侧状态和缩放控制 */}
          <div className="flex items-center gap-2">
            {/* 状态指示器 */}
            <div className="flex items-center gap-1">
              {isLoading ? (
                <div className="flex items-center text-xs text-blue-600">
                  <div className="animate-spin rounded-full h-3 w-3 border border-blue-600 border-t-transparent mr-1"></div>
                  渲染中...
                </div>
              ) : error ? (
                <div className="flex items-center text-xs text-red-600">
                  <AlertCircle size={12} className="mr-1" />
                  渲染失败
                </div>
              ) : (
                <div className="flex items-center text-xs text-green-600">
                  <CheckCircle size={12} className="mr-1" />
                  就绪
                </div>
              )}
            </div>

            {/* 缩放控制 */}
            <div className="flex items-center gap-1 border-l border-gray-200 pl-2">
              <button
                onClick={handleZoomOut}
                disabled={zoom <= minZoom}
                className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                title="缩小"
              >
                <ZoomOut size={14} />
              </button>

              <button
                onClick={handleZoomReset}
                className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded min-w-[3rem] text-center"
                title="重置缩放"
              >
                {Math.round(zoom * 100)}%
              </button>

              <button
                onClick={handleZoomIn}
                disabled={zoom >= maxZoom}
                className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                title="放大"
              >
                <ZoomIn size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertCircle size={16} className="text-red-500 mr-2" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
              <button
                onClick={() => renderPlantUML(code)}
                className="px-3 py-1 text-xs bg-red-100 text-red-700 border border-red-300 rounded hover:bg-red-200 transition-colors"
              >
                重试
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 编辑器主体 */}
      <div className="flex flex-col lg:flex-row h-[600px] lg:h-[600px]">
        {/* 代码编辑器 */}
        <div className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r border-gray-200 h-[300px] lg:h-full">
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-700">PlantUML 代码</h3>
          </div>
          <div className="flex-1 relative">
            <textarea
              ref={editorRef}
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              className="w-full h-full p-4 font-mono text-sm border-0 resize-none focus:outline-none focus:ring-0"
              placeholder="请输入 PlantUML 代码..."
              spellCheck={false}
            />
          </div>
        </div>

        {/* 预览区域 */}
        <div className="flex-1 flex flex-col h-[300px] lg:h-full">
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">预览</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleZoomOut}
                disabled={zoom <= minZoom}
                className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                title="缩小"
              >
                <ZoomOut size={14} />
              </button>

              <span className="text-xs text-gray-600 min-w-[3rem] text-center">
                {Math.round(zoom * 100)}%
              </span>

              <button
                onClick={handleZoomIn}
                disabled={zoom >= maxZoom}
                className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                title="放大"
              >
                <ZoomIn size={14} />
              </button>

              <button
                onClick={handleZoomReset}
                className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                title="重置缩放"
              >
                <RotateCw size={14} />
              </button>
            </div>
          </div>
          <div
            ref={previewContainerRef}
            className="flex-1 overflow-auto bg-gray-50"
            onWheel={handleWheel}
          >
            <div
              ref={previewRef}
              className="min-h-full"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
                width: `${100 / zoom}%`,
                height: `${100 / zoom}%`
              }}
            >
              <div className="text-gray-500 text-center py-8">
                请输入 PlantUML 代码
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 模板和帮助 */}
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <h4 className="text-sm font-medium text-gray-700 mb-3">快速开始模板</h4>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
          <button
            onClick={() => {
              const template = `@startuml
Alice -> Bob: Authentication Request
Bob --> Alice: Authentication Response

Alice -> Bob: Another authentication Request
Alice <-- Bob: Another authentication Response
@enduml`
              setCode(template)
              handleCodeChange(template)
            }}
            className="px-3 py-2 text-xs text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            序列图
          </button>

          <button
            onClick={() => {
              const template = `@startuml
class Car {
  -String brand
  -String model
  -int year
  +start()
  +stop()
  +accelerate()
}

class Engine {
  -int horsepower
  -String type
  +start()
  +stop()
}

Car *-- Engine : contains
@enduml`
              setCode(template)
              handleCodeChange(template)
            }}
            className="px-3 py-2 text-xs text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            类图
          </button>

          <button
            onClick={() => {
              const template = `@startuml
start
:用户登录;
if (验证成功?) then (是)
  :显示主页;
else (否)
  :显示错误信息;
  :返回登录页;
endif
stop
@enduml`
              setCode(template)
              handleCodeChange(template)
            }}
            className="px-3 py-2 text-xs text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            活动图
          </button>

          <button
            onClick={() => {
              const template = `@startuml
left to right direction
actor 用户 as user
actor 管理员 as admin

rectangle 系统 {
  usecase 登录 as login
  usecase 查看数据 as view
  usecase 管理用户 as manage
  usecase 生成报告 as report
}

user --> login
user --> view
admin --> login
admin --> manage
admin --> report
@enduml`
              setCode(template)
              handleCodeChange(template)
            }}
            className="px-3 py-2 text-xs text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            用例图
          </button>

          <button
            onClick={() => {
              const template = `@startuml
object 用户1 {
  姓名 = "张三"
  年龄 = 25
  邮箱 = "zhangsan@example.com"
}

object 订单1 {
  订单号 = "ORD001"
  金额 = 299.99
  状态 = "已支付"
}

object 商品1 {
  名称 = "笔记本电脑"
  价格 = 299.99
  库存 = 50
}

用户1 --> 订单1 : 下单
订单1 --> 商品1 : 包含
@enduml`
              setCode(template)
              handleCodeChange(template)
            }}
            className="px-3 py-2 text-xs text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            对象图
          </button>

          <button
            onClick={() => {
              const template = `@startuml
participant 用户 as U
participant 前端 as F
participant 后端 as B
participant 数据库 as D

U -> F: 提交表单
F -> B: 发送请求
B -> D: 查询数据
D --> B: 返回结果
B --> F: 响应数据
F --> U: 显示结果
@enduml`
              setCode(template)
              handleCodeChange(template)
            }}
            className="px-3 py-2 text-xs text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            时序图
          </button>
        </div>

        <div className="mt-3 text-xs text-gray-500">
          💡 提示：点击模板按钮快速开始，或在左侧编辑器中输入自定义 PlantUML 代码
          <br />
          🔍 缩放：使用预览区域右上角的 +/- 按钮，或按住 Ctrl 键并滚动鼠标滚轮进行缩放
          <br />
          📖 语法参考：<a href="https://plantuml.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">PlantUML 官方文档</a>
        </div>
      </div>
    </div>
  )
}
