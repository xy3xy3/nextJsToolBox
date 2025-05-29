'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { Upload, FileText, Image, Package, AlertCircle, CheckCircle } from 'lucide-react'
import mammoth from 'mammoth'
import JSZip from 'jszip'
import TurndownService from 'turndown'

interface ConversionResult {
  markdown: string
  images: { [key: string]: Blob }
  imageUrls: { [key: string]: string } // 用于预览的临时URL
  warnings: string[]
}

interface WordToMarkdownEditorProps {
  initialValue?: string
}

export default function WordToMarkdownEditor({ initialValue = '' }: WordToMarkdownEditorProps) {
  const [markdown, setMarkdown] = useState(initialValue)
  const [isConverting, setIsConverting] = useState(false)
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 清理临时URL，避免内存泄漏
  useEffect(() => {
    return () => {
      if (conversionResult?.imageUrls) {
        Object.values(conversionResult.imageUrls).forEach(url => {
          URL.revokeObjectURL(url)
        })
      }
    }
  }, [conversionResult])

  // 配置Turndown服务，用于HTML到Markdown的转换
  const turndownService = useMemo(() => new TurndownService({
    headingStyle: 'atx',
    hr: '---',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    fence: '```',
    emDelimiter: '*',
    strongDelimiter: '**',
    linkStyle: 'inlined',
    linkReferenceStyle: 'full'
  }), [])

  // 添加自定义规则来处理图片和段落的格式
  turndownService.addRule('cleanImages', {
    filter: 'img',
    replacement: function (_content, node) {
      const element = node as HTMLImageElement
      const alt = element.getAttribute('alt') || ''
      const src = element.getAttribute('src') || ''
      return '\n\n![' + alt + '](' + src + ')\n\n'
    }
  })

  // 处理段落，确保图片前后有适当的换行
  turndownService.addRule('cleanParagraphs', {
    filter: 'p',
    replacement: function (content, node) {
      const element = node as HTMLElement
      // 如果段落只包含图片，则不添加额外的段落标记
      if (element.querySelector('img') && (element.textContent || '').trim() === '') {
        return content
      }
      return '\n\n' + content + '\n\n'
    }
  })

  // 清理Markdown格式的辅助函数
  const cleanMarkdownFormat = useCallback((markdown: string): string => {
    return markdown
      // 移除多余的空行（超过2个连续换行符的情况）
      .replace(/\n{3,}/g, '\n\n')
      // 修复标题格式问题（如 ") CNN步幅stride和填充padding" -> "## CNN步幅stride和填充padding"）
      .replace(/^\)\s*([^#\n]+)$/gm, '## $1')
      .replace(/^(\d+)\)\s*([^#\n]+)$/gm, '## $1) $2')
      // 确保标题前后有适当的空行
      .replace(/([^\n])\n(#{1,6}\s)/g, '$1\n\n$2')
      .replace(/(#{1,6}[^\n]+)\n([^\n#])/g, '$1\n\n$2')
      // 确保图片前后有适当的空行
      .replace(/([^\n])\n(!\[[^\]]*\]\([^)]+\))/g, '$1\n\n$2')
      .replace(/(!\[[^\]]*\]\([^)]+\))\n([^\n!])/g, '$1\n\n$2')
      // 移除图片描述中的多余文本（如"描述已自动生成"）
      .replace(/!\[([^\]]*描述已自动生成[^\]]*)\]/g, '![]')
      .replace(/!\[([^\]]*自动生成[^\]]*)\]/g, '![]')
      .replace(/!\[图示[^\]]*\]/g, '![图示]')
      .replace(/!\[文本[^\]]*\]/g, '![文本]')
      // 修复图片前的格式问题
      .replace(/^!\[图示\s*$/gm, '')
      .replace(/^描述已自动生成\]\(img\//gm, '![图示](img/')
      // 清理开头和结尾的空白
      .trim()
  }, [])

  // 处理Word文件上传和转换
  const handleFileUpload = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.docx')) {
      setError('请选择.docx格式的Word文档')
      return
    }

    setIsConverting(true)
    setError(null)
    setConversionResult(null)

    try {
      // 读取文件为ArrayBuffer
      const arrayBuffer = await file.arrayBuffer()

      // 存储图片数据的Map
      const imageMap = new Map<string, { blob: Blob; filename: string; tempUrl: string }>()

      // 尝试转换Word文档
      const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer }, {
        convertImage: mammoth.images.imgElement(async function(image) {
          try {
            const imageBuffer = await image.read()
            // 为每个图片生成唯一的文件名
            const extension = image.contentType?.split('/')[1] || 'png'
            const filename = `image_${Date.now()}_${Math.random().toString(36).substring(2, 11)}.${extension}`

            // 创建Blob并生成临时URL
            const blob = new Blob([imageBuffer], { type: image.contentType })
            const tempUrl = URL.createObjectURL(blob)
            const imagePath = `img/${filename}`

            imageMap.set(imagePath, { blob, filename, tempUrl })

            // 在HTML中使用临时URL，这样预览就能正常显示
            return {
              src: tempUrl
            }
          } catch (error) {
            console.warn('Failed to process image:', error)
            // 如果图片处理失败，返回占位符
            return {
              src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIEVycm9yPC90ZXh0Pjwvc3ZnPg=='
            }
          }
        })
      })

      // 将HTML转换为Markdown
      let markdownContent = turndownService.turndown(result.value)

      // 后处理：清理格式问题
      markdownContent = cleanMarkdownFormat(markdownContent)

      // 将imageMap转换为普通对象，并替换临时URL为相对路径
      const images: { [key: string]: Blob } = {}
      const imageUrls: { [key: string]: string } = {}

      imageMap.forEach(({ blob, filename, tempUrl }, imagePath) => {
        images[filename] = blob
        imageUrls[filename] = tempUrl

        // 在Markdown中将临时URL替换为相对路径
        const tempUrlRegex = new RegExp(tempUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
        markdownContent = markdownContent.replace(tempUrlRegex, imagePath)
      })

      // 处理可能存在的base64图片（备用方案）
      markdownContent = markdownContent.replace(
        /!\[([^\]]*)\]\(data:image\/([^;]+);base64,([^)]+)\)/g,
        (match, alt, mimeType, base64) => {
          const extension = mimeType.split('/')[1] || 'png'
          const filename = `image_${Date.now()}_${Math.random().toString(36).substring(2, 11)}.${extension}`

          try {
            // 将base64转换为Blob
            const binaryString = atob(base64)
            const bytes = new Uint8Array(binaryString.length)
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i)
            }
            const blob = new Blob([bytes], { type: `image/${mimeType}` })
            const tempUrl = URL.createObjectURL(blob)

            images[filename] = blob
            imageUrls[filename] = tempUrl

            return `![${alt}](img/${filename})`
          } catch (e) {
            console.warn('Failed to process base64 image:', e)
            return match // 保持原样
          }
        }
      )

      const conversionResult: ConversionResult = {
        markdown: markdownContent,
        images: images,
        imageUrls: imageUrls,
        warnings: result.messages.map(msg => msg.message)
      }

      setMarkdown(markdownContent)
      setConversionResult(conversionResult)

    } catch (err) {
      console.error('转换失败:', err)
      setError(err instanceof Error ? err.message : '转换过程中发生未知错误')
    } finally {
      setIsConverting(false)
    }
  }, [turndownService, cleanMarkdownFormat])

  // 处理文件选择
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }, [handleFileUpload])

  // 触发文件选择
  const triggerFileSelect = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  // 生成并下载压缩包
  const downloadZip = useCallback(async () => {
    if (!conversionResult) return

    try {
      const zip = new JSZip()

      // 添加Markdown文件
      zip.file('document.md', conversionResult.markdown)

      // 如果有图片，创建img文件夹并添加图片
      if (Object.keys(conversionResult.images).length > 0) {
        const imgFolder = zip.folder('img')
        if (imgFolder) {
          for (const [filename, blob] of Object.entries(conversionResult.images)) {
            imgFolder.file(filename, blob)
          }
        }
      }

      // 生成压缩包
      const content = await zip.generateAsync({ type: 'blob' })

      // 创建下载链接
      const url = URL.createObjectURL(content)
      const link = document.createElement('a')
      link.href = url
      link.download = `markdown-export-${new Date().toISOString().slice(0, 10)}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

    } catch (err) {
      console.error('生成压缩包失败:', err)
      setError('生成压缩包失败')
    }
  }, [conversionResult])

  // 复制Markdown到剪贴板
  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(markdown)
      alert('Markdown内容已复制到剪贴板')
    } catch (err) {
      console.error('复制失败:', err)
      alert('复制失败，请手动复制')
    }
  }, [markdown])

  return (
    <div className="h-full flex flex-col">
      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".docx"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* 顶部工具栏 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border-b border-gray-200 bg-white gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <h2 className="text-lg font-semibold text-gray-900">Word 转 Markdown</h2>

          {conversionResult && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <CheckCircle size={14} className="text-green-500" />
              <span className="hidden sm:inline">转换完成</span>
              <span className="sm:hidden">完成</span>
              {Object.keys(conversionResult.images).length > 0 && (
                <>
                  <span>•</span>
                  <Image size={14} />
                  <span>{Object.keys(conversionResult.images).length} 张图片</span>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={triggerFileSelect}
            disabled={isConverting}
            className="flex items-center px-3 py-2 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload size={14} className="mr-1" />
            <span className="hidden sm:inline">{isConverting ? '转换中...' : '上传Word文档'}</span>
            <span className="sm:hidden">{isConverting ? '转换中' : '上传'}</span>
          </button>

          {conversionResult && (
            <>
              <button
                onClick={copyToClipboard}
                className="flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <FileText size={14} className="mr-1" />
                <span className="hidden sm:inline">复制Markdown</span>
                <span className="sm:hidden">复制</span>
              </button>

              <button
                onClick={downloadZip}
                className="flex items-center px-2 py-1 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <Package size={14} className="mr-1" />
                <span className="hidden sm:inline">下载压缩包</span>
                <span className="sm:hidden">下载</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mx-4 mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <AlertCircle size={16} className="text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* 警告信息 */}
      {conversionResult && conversionResult.warnings.length > 0 && (
        <div className="mx-4 mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex items-start">
            <AlertCircle size={16} className="text-yellow-500 mr-2 mt-0.5" />
            <div>
              <p className="text-yellow-700 font-medium mb-2">转换警告：</p>
              <ul className="text-yellow-600 text-sm space-y-1">
                {conversionResult.warnings.map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 主要内容区域 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 转换状态或Markdown预览 */}
        {isConverting ? (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-lg font-medium text-gray-900 mb-2">正在转换Word文档...</p>
              <p className="text-sm text-gray-600">请稍候，这可能需要几秒钟</p>
            </div>
          </div>
        ) : markdown ? (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
            {/* Markdown源码 */}
            <div className="flex flex-col">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Markdown 源码</h3>
              <textarea
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                className="flex-1 p-4 border border-gray-300 rounded-md font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="转换后的Markdown内容将显示在这里..."
              />
            </div>

            {/* Markdown预览 */}
            <div className="flex flex-col">
              <h3 className="text-sm font-medium text-gray-700 mb-2">预览</h3>
              <div className="flex-1 p-4 border border-gray-300 rounded-md bg-white overflow-auto">
                <div className="prose prose-sm max-w-none">
                  {markdown.split('\n').map((line, index) => {
                    // 处理标题
                    if (line.startsWith('# ')) {
                      return <h1 key={index} className="text-2xl font-bold mt-6 mb-4">{line.slice(2)}</h1>
                    }
                    if (line.startsWith('## ')) {
                      return <h2 key={index} className="text-xl font-bold mt-5 mb-3">{line.slice(3)}</h2>
                    }
                    if (line.startsWith('### ')) {
                      return <h3 key={index} className="text-lg font-bold mt-4 mb-2">{line.slice(4)}</h3>
                    }

                    // 处理图片
                    const imgMatch = line.match(/!\[([^\]]*)\]\(([^)]+)\)/)
                    if (imgMatch) {
                      const [, alt, src] = imgMatch
                      // 如果是img/开头的路径，尝试使用临时URL
                      let actualSrc = src
                      if (src.startsWith('img/') && conversionResult) {
                        const filename = src.replace('img/', '')
                        if (conversionResult.imageUrls[filename]) {
                          actualSrc = conversionResult.imageUrls[filename]
                        }
                      }
                      return (
                        <div key={index} className="my-4">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={actualSrc} alt={alt || ''} className="max-w-full h-auto border rounded" />
                          {alt && <p className="text-sm text-gray-600 mt-1 italic">{alt}</p>}
                        </div>
                      )
                    }

                    // 处理空行
                    if (line.trim() === '') {
                      return <br key={index} />
                    }

                    // 处理普通段落（包含粗体、斜体、代码等）
                    const processedLine = line
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em>$1</em>')
                      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>')
                      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:underline">$1</a>')

                    return (
                      <p
                        key={index}
                        className="mb-2"
                        dangerouslySetInnerHTML={{ __html: processedLine }}
                      />
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center max-w-md">
              <Upload size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">上传Word文档开始转换</h3>
              <p className="text-gray-600 mb-6">
                支持.docx格式的Word文档，转换后将生成Markdown文件和图片文件夹
              </p>
              <div className="text-sm text-gray-500 mb-4">
                <p>• 支持文本格式：标题、段落、粗体、斜体等</p>
                <p>• 支持图片：自动提取并转换为相对路径引用</p>
                <p>• 支持表格：转换为Markdown表格格式</p>
                <p>• 支持列表：有序和无序列表</p>
              </div>
              <button
                onClick={triggerFileSelect}
                className="inline-flex items-center px-6 py-3 text-base font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Upload size={20} className="mr-2" />
                选择Word文档
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
