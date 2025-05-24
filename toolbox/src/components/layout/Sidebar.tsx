'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  FileText, 
  Code, 
  Eye, 
  GitBranch,
  Home,
  Menu,
  X
} from 'lucide-react'
import { useState } from 'react'

const tools = [
  {
    name: '首页',
    href: '/',
    icon: Home,
    description: '工具箱首页'
  },
  {
    name: 'Markdown 预览',
    href: '/markdown',
    icon: FileText,
    description: 'Markdown 编辑和预览'
  },
  {
    name: 'HTML 预览',
    href: '/html',
    icon: Code,
    description: 'HTML 代码预览',
    disabled: true
  },
  {
    name: 'Mermaid 图表',
    href: '/mermaid',
    icon: GitBranch,
    description: 'Mermaid 流程图编辑',
    disabled: true
  },
  {
    name: 'Graphviz 图表',
    href: '/graphviz',
    icon: Eye,
    description: 'Graphviz 图表编辑',
    disabled: true
  }
]

export default function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* 移动端菜单按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-md border"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* 遮罩层 */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 侧边栏 */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-64 bg-white border-r border-gray-200
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* 标题 */}
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">
              前端工具箱
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              开发者实用工具集合
            </p>
          </div>

          {/* 导航菜单 */}
          <nav className="flex-1 p-4 space-y-2">
            {tools.map((tool) => {
              const Icon = tool.icon
              const isActive = pathname === tool.href
              const isDisabled = tool.disabled

              return (
                <Link
                  key={tool.name}
                  href={isDisabled ? '#' : tool.href}
                  onClick={() => setIsOpen(false)}
                  className={`
                    flex items-center px-3 py-2 rounded-lg text-sm font-medium
                    transition-colors duration-200
                    ${isDisabled 
                      ? 'text-gray-400 cursor-not-allowed bg-gray-50' 
                      : isActive
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon size={18} className="mr-3" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span>{tool.name}</span>
                      {isDisabled && (
                        <span className="text-xs text-gray-400 bg-gray-200 px-2 py-1 rounded">
                          即将推出
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {tool.description}
                    </p>
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* 底部信息 */}
          <div className="p-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              基于 Next.js + React + Tailwind CSS
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
