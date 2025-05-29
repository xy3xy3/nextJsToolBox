'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Copy, RotateCcw, Upload, Download, BarChart3 } from 'lucide-react'

interface CharacterCounterProps {
  initialValue?: string
}

interface CharacterStats {
  totalChars: number
  totalCharsNoSpaces: number
  words: number
  lines: number
  paragraphs: number
  chineseChars: number
  englishChars: number
  numbers: number
  punctuation: number
  spaces: number
  tokens?: number // 可选的token数量
}

// 支持的GPT模型列表
const SUPPORTED_MODELS = [
  { value: 'gpt-4o', label: 'GPT-4o', encoding: 'o200k_base' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini', encoding: 'o200k_base' },
  { value: 'o1-preview', label: 'o1-preview', encoding: 'o200k_base' },
  { value: 'o1-mini', label: 'o1-mini', encoding: 'o200k_base' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', encoding: 'cl100k_base' },
  { value: 'gpt-4', label: 'GPT-4', encoding: 'cl100k_base' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', encoding: 'cl100k_base' },
  { value: 'text-davinci-003', label: 'Text Davinci 003', encoding: 'p50k_base' },
  { value: 'text-davinci-002', label: 'Text Davinci 002', encoding: 'p50k_base' },
  { value: 'text-davinci-001', label: 'Text Davinci 001', encoding: 'r50k_base' },
] as const

export default function CharacterCounter({ initialValue = '' }: CharacterCounterProps) {
  const [text, setText] = useState(initialValue)
  const [isCalculating, setIsCalculating] = useState(false)
  const [enableTokenCount, setEnableTokenCount] = useState(false)
  const [selectedModel, setSelectedModel] = useState<string>(SUPPORTED_MODELS[0].value)
  const [stats, setStats] = useState<CharacterStats>({
    totalChars: 0,
    totalCharsNoSpaces: 0,
    words: 0,
    lines: 0,
    paragraphs: 0,
    chineseChars: 0,
    englishChars: 0,
    numbers: 0,
    punctuation: 0,
    spaces: 0
  })

  // 防抖计算的 ref
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Token计算函数 - 使用异步处理避免阻塞主线程
  const calculateTokens = useCallback(async (inputText: string, modelValue: string): Promise<number> => {
    try {
      // 动态导入对应的tokenizer
      const model = SUPPORTED_MODELS.find(m => m.value === modelValue)
      if (!model) return 0

      let tokenizer

      // 根据编码类型导入对应的tokenizer
      switch (model.encoding) {
        case 'o200k_base':
          tokenizer = await import('gpt-tokenizer/encoding/o200k_base')
          break
        case 'cl100k_base':
          tokenizer = await import('gpt-tokenizer/encoding/cl100k_base')
          break
        case 'p50k_base':
          tokenizer = await import('gpt-tokenizer/encoding/p50k_base')
          break
        case 'r50k_base':
          tokenizer = await import('gpt-tokenizer/encoding/r50k_base')
          break
        default:
          tokenizer = await import('gpt-tokenizer/encoding/cl100k_base')
      }

      // 使用 MessageChannel 或 setTimeout 来异步处理，避免阻塞主线程
      return new Promise<number>((resolve) => {
        // 使用 setTimeout 将计算推迟到下一个事件循环
        // 这样可以让UI有机会更新，避免卡死
        setTimeout(() => {
          try {
            const tokens = tokenizer.encode(inputText).length
            resolve(tokens)
          } catch (error) {
            console.error('Token编码失败:', error)
            resolve(0)
          }
        }, 10) // 给UI一点时间更新
      })
    } catch (error) {
      console.error('Token计算失败:', error)
      return 0
    }
  }, [])

  // 高性能字符统计函数 - 优化大文本处理
  const calculateStats = useCallback(async (inputText: string, includeTokens: boolean = false, modelValue: string = 'gpt-3.5-turbo'): Promise<CharacterStats> => {
    const totalChars = inputText.length

    if (totalChars === 0) {
      return {
        totalChars: 0,
        totalCharsNoSpaces: 0,
        words: 0,
        lines: 0,
        paragraphs: 0,
        chineseChars: 0,
        englishChars: 0,
        numbers: 0,
        punctuation: 0,
        spaces: 0,
        tokens: includeTokens ? 0 : undefined
      }
    }

    let chineseChars = 0
    let englishChars = 0
    let numbers = 0
    let punctuation = 0
    let spaces = 0
    let lines = 1 // 至少有一行
    let paragraphs = 0
    let inParagraph = false

    // 使用单次遍历来计算所有统计信息，避免多次遍历
    for (let i = 0; i < totalChars; i++) {
      const char = inputText[i]
      const code = char.charCodeAt(0)

      // 统计行数和段落数
      if (char === '\n') {
        lines++
        if (inParagraph) {
          paragraphs++
          inParagraph = false
        }
      } else if (char !== ' ' && char !== '\t' && char !== '\r') {
        if (!inParagraph) {
          inParagraph = true
        }
      }

      // 统计字符类型
      if (char === ' ' || char === '\t') {
        spaces++
      } else if (char >= '0' && char <= '9') {
        numbers++
      } else if ((code >= 65 && code <= 90) || (code >= 97 && code <= 122)) {
        // A-Z, a-z
        englishChars++
      } else if (code >= 0x4e00 && code <= 0x9fff) {
        // 中文字符范围
        chineseChars++
      } else if (char !== '\n' && char !== '\r' && /[.,;:!?'"()[\]{}\-_+=<>/@#$%^&*~`|\\]/.test(char)) {
        punctuation++
      }
    }

    // 如果最后还在段落中，计入段落数
    if (inParagraph) {
      paragraphs++
    }

    const totalCharsNoSpaces = totalChars - spaces

    // 优化单词计算 - 避免split和filter的性能开销
    let words = 0
    let inWord = false
    for (let i = 0; i < totalChars; i++) {
      const char = inputText[i]
      const isWordChar = /[a-zA-Z0-9\u4e00-\u9fff]/.test(char)

      if (isWordChar && !inWord) {
        words++
        inWord = true
      } else if (!isWordChar) {
        inWord = false
      }
    }

    // 计算token数量（如果启用）
    let tokens: number | undefined = undefined
    if (includeTokens) {
      tokens = await calculateTokens(inputText, modelValue)
    }

    return {
      totalChars,
      totalCharsNoSpaces,
      words,
      lines,
      paragraphs,
      chineseChars,
      englishChars,
      numbers,
      punctuation,
      spaces,
      tokens
    }
  }, [calculateTokens])

  // 防抖更新统计 - 根据文本长度动态调整延迟
  const updateStats = useCallback((inputText: string) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    // 根据文本长度动态调整防抖延迟
    const textLength = inputText.length
    let delay = 300 // 默认300ms

    if (textLength > 100000) {
      delay = 2000 // 超过10万字符，延迟2秒
    } else if (textLength > 50000) {
      delay = 1000 // 超过5万字符，延迟1秒
    } else if (textLength > 10000) {
      delay = 600 // 超过1万字符，延迟600ms
    }

    // 显示计算状态
    if (textLength > 10000 || enableTokenCount) {
      setIsCalculating(true)
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        // 先计算基本统计（同步，快速）
        const basicStats = await calculateStats(inputText, false, selectedModel)
        setStats(basicStats)

        // 如果启用了token统计，则异步计算token
        if (enableTokenCount) {
          // 显示token计算中的状态
          setStats(prevStats => ({
            ...prevStats,
            tokens: -1 // 使用-1表示正在计算中
          }))

          try {
            const tokens = await calculateTokens(inputText, selectedModel)

            // 更新包含token的统计结果
            setStats(prevStats => ({
              ...prevStats,
              tokens
            }))
          } catch (error) {
            console.error('Token计算失败:', error)
            // 如果token计算失败，设置为0
            setStats(prevStats => ({
              ...prevStats,
              tokens: 0
            }))
          }
        }
      } catch (error) {
        console.error('统计计算失败:', error)
        // 如果基本统计也失败，至少显示空统计
        setStats({
          totalChars: 0,
          totalCharsNoSpaces: 0,
          words: 0,
          lines: 0,
          paragraphs: 0,
          chineseChars: 0,
          englishChars: 0,
          numbers: 0,
          punctuation: 0,
          spaces: 0,
          tokens: enableTokenCount ? 0 : undefined
        })
      } finally {
        setIsCalculating(false)
      }
    }, delay)
  }, [calculateStats, calculateTokens, enableTokenCount, selectedModel])

  // 处理文本变化
  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value
    setText(newText)
    updateStats(newText)
  }, [updateStats])

  // 初始化时计算统计
  useEffect(() => {
    updateStats(text)
  }, [text, updateStats])

  // 当token统计设置改变时重新计算
  useEffect(() => {
    if (text) {
      updateStats(text)
    }
  }, [enableTokenCount, selectedModel, text, updateStats])

  // 清理防抖定时器
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [])

  // 复制文本到剪贴板
  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text)
      alert('文本已复制到剪贴板')
    } catch (error) {
      console.error('复制失败:', error)
      alert('复制失败，请手动复制')
    }
  }, [text])

  // 清空文本
  const clearText = useCallback(() => {
    if (confirm('确定要清空所有内容吗？')) {
      setText('')
      setStats({
        totalChars: 0,
        totalCharsNoSpaces: 0,
        words: 0,
        lines: 0,
        paragraphs: 0,
        chineseChars: 0,
        englishChars: 0,
        numbers: 0,
        punctuation: 0,
        spaces: 0,
        tokens: enableTokenCount ? 0 : undefined
      })
    }
  }, [enableTokenCount])

  // 导入文件
  const importFile = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.txt,.md,.text'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const content = e.target?.result as string
          setText(content)
          updateStats(content)
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }, [updateStats])

  // 导出文件
  const exportFile = useCallback(() => {
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `text-${new Date().toISOString().slice(0, 10)}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [text])

  // 导出统计报告
  const exportStats = useCallback(() => {
    const selectedModelInfo = SUPPORTED_MODELS.find(m => m.value === selectedModel)
    const tokenSection = stats.tokens !== undefined ? `

=== Token统计 ===
模型: ${selectedModelInfo?.label || selectedModel}
编码: ${selectedModelInfo?.encoding || 'unknown'}
Token数量: ${stats.tokens.toLocaleString()}` : ''

    const report = `文本统计报告
生成时间: ${new Date().toLocaleString()}

=== 基本统计 ===
总字符数: ${stats.totalChars.toLocaleString()}
字符数(不含空格): ${stats.totalCharsNoSpaces.toLocaleString()}
单词数: ${stats.words.toLocaleString()}
行数: ${stats.lines.toLocaleString()}
段落数: ${stats.paragraphs.toLocaleString()}${tokenSection}

=== 字符类型统计 ===
中文字符: ${stats.chineseChars.toLocaleString()}
英文字符: ${stats.englishChars.toLocaleString()}
数字: ${stats.numbers.toLocaleString()}
标点符号: ${stats.punctuation.toLocaleString()}
空格: ${stats.spaces.toLocaleString()}

=== 原文内容 ===
${text}
`

    const blob = new Blob([report], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `character-stats-${new Date().toISOString().slice(0, 10)}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [stats, text, selectedModel])

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* 工具栏 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border-b border-gray-200 gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-900">
            字符统计工具
          </h2>

          {/* Token统计控制 */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={enableTokenCount}
                onChange={(e) => setEnableTokenCount(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-700">启用Token统计</span>
            </label>

            {enableTokenCount && (
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="text-xs border border-gray-300 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {SUPPORTED_MODELS.map((model) => (
                  <option key={model.value} value={model.value}>
                    {model.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={importFile}
            className="flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Upload size={14} className="mr-1" />
            <span className="hidden sm:inline">导入文件</span>
            <span className="sm:hidden">导入</span>
          </button>
          <button
            onClick={exportFile}
            className="flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Download size={14} className="mr-1" />
            <span className="hidden sm:inline">导出文本</span>
            <span className="sm:hidden">导出</span>
          </button>
          <button
            onClick={exportStats}
            className="flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <BarChart3 size={14} className="mr-1" />
            <span className="hidden sm:inline">导出报告</span>
            <span className="sm:hidden">报告</span>
          </button>
          <button
            onClick={copyToClipboard}
            className="flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Copy size={14} className="mr-1" />
            <span className="hidden sm:inline">复制文本</span>
            <span className="sm:hidden">复制</span>
          </button>
          <button
            onClick={clearText}
            className="flex items-center px-2 py-1 text-xs font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <RotateCcw size={14} className="mr-1" />
            <span className="hidden sm:inline">清空</span>
            <span className="sm:hidden">清空</span>
          </button>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="flex flex-col lg:flex-row h-[600px]">
        {/* 文本输入区域 */}
        <div className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r border-gray-200 h-[300px] lg:h-full">
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-700">文本输入</h3>
          </div>
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleTextChange}
              className="w-full h-full p-4 font-mono text-sm border-0 resize-none focus:outline-none focus:ring-0"
              placeholder="请输入或粘贴需要统计的文本内容..."
              spellCheck={false}
            />
          </div>
        </div>

        {/* 统计结果区域 */}
        <div className="flex-1 flex flex-col h-[300px] lg:h-full">
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">统计结果</h3>
            {isCalculating && (
              <div className="flex items-center text-xs text-blue-600">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-1"></div>
                计算中...
              </div>
            )}
          </div>
          <div className="flex-1 p-4 overflow-auto">
            {/* 基本统计 */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-800 mb-3">基本统计</h4>
              <div className={`grid gap-4 ${stats.tokens !== undefined ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-2'}`}>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalChars.toLocaleString()}</div>
                  <div className="text-xs text-blue-600">总字符数</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.totalCharsNoSpaces.toLocaleString()}</div>
                  <div className="text-xs text-green-600">字符数(不含空格)</div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{stats.words.toLocaleString()}</div>
                  <div className="text-xs text-purple-600">单词数</div>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{stats.lines.toLocaleString()}</div>
                  <div className="text-xs text-orange-600">行数</div>
                </div>
                {stats.tokens !== undefined && (
                  <div className="bg-indigo-50 p-3 rounded-lg col-span-2 lg:col-span-1">
                    <div className="text-2xl font-bold text-indigo-600">
                      {stats.tokens === -1 ? (
                        <span className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                          计算中...
                        </span>
                      ) : (
                        stats.tokens.toLocaleString()
                      )}
                    </div>
                    <div className="text-xs text-indigo-600">
                      Token数量
                      <br />
                      <span className="text-indigo-500">
                        {SUPPORTED_MODELS.find(m => m.value === selectedModel)?.label}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 详细统计 */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-800 mb-3">详细统计</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">段落数</span>
                  <span className="text-sm font-medium text-gray-900">{stats.paragraphs.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">中文字符</span>
                  <span className="text-sm font-medium text-gray-900">{stats.chineseChars.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">英文字符</span>
                  <span className="text-sm font-medium text-gray-900">{stats.englishChars.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">数字</span>
                  <span className="text-sm font-medium text-gray-900">{stats.numbers.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">标点符号</span>
                  <span className="text-sm font-medium text-gray-900">{stats.punctuation.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">空格</span>
                  <span className="text-sm font-medium text-gray-900">{stats.spaces.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* 字符类型占比 */}
            {stats.totalChars > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-3">字符类型占比</h4>
                <div className="space-y-2">
                  {[
                    { label: '中文字符', count: stats.chineseChars, color: 'bg-red-500' },
                    { label: '英文字符', count: stats.englishChars, color: 'bg-blue-500' },
                    { label: '数字', count: stats.numbers, color: 'bg-green-500' },
                    { label: '标点符号', count: stats.punctuation, color: 'bg-yellow-500' },
                    { label: '空格', count: stats.spaces, color: 'bg-gray-500' }
                  ].map(({ label, count, color }) => {
                    const percentage = ((count / stats.totalChars) * 100).toFixed(1)
                    return (
                      <div key={label} className="flex items-center space-x-2">
                        <div className="w-16 text-xs text-gray-600">{label}</div>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${color}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="w-12 text-xs text-gray-600 text-right">{percentage}%</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 底部提示 */}
      <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500 text-center sm:text-left">
          💡 提示：支持大文本实时统计（可处理几十万字符），使用智能防抖技术确保流畅体验
          {enableTokenCount && (
            <span className="ml-2 text-blue-600">
              • Token统计：支持多种GPT模型的精确token计算，大文本异步处理避免卡顿
            </span>
          )}
          {text.length > 50000 && (
            <span className="ml-2 text-orange-600">
              • 大文本模式：延迟计算以保持性能
            </span>
          )}
          {enableTokenCount && text.length > 100000 && (
            <span className="ml-2 text-purple-600">
              • 超大文本Token计算：请耐心等待，计算过程不会阻塞界面
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
