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
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useState } from 'react'
import { useSidebar } from './MainLayout'

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
    disabled: false
  },
  {
    name: 'Mermaid 图表',
    href: '/mermaid',
    icon: GitBranch,
    description: 'Mermaid 流程图编辑',
    disabled: false
  },
  {
    name: 'Graphviz 图表',
    href: '/graphviz',
    icon: Eye,
    description: 'Graphviz 图表编辑',
    disabled: false
  }
]

export default function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false) // 移动端展开状态
  const { isCollapsed, setIsCollapsed } = useSidebar() // 大屏幕收缩状态

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
        fixed lg:relative inset-y-0 left-0 z-40
        bg-white border-r border-gray-200
        transform transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isCollapsed ? 'lg:w-16' : 'lg:w-64'}
        w-64
      `}>
        <div className="flex flex-col h-full">
          {/* 标题 */}
          <div className={`border-b border-gray-200 relative ${isCollapsed ? 'lg:p-3' : 'p-6'}`}>
            {/* 大屏幕收缩按钮 */}
            {!isCollapsed && (
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden lg:block absolute top-4 right-4 z-10 p-1.5 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200"
                title="收缩侧边栏"
              >
                <ChevronLeft size={16} />
              </button>
            )}
            {!isCollapsed ? (
              <>
                <h1 className="text-xl font-bold text-gray-900">
                  前端工具箱
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  开发者实用工具集合
                </p>
              </>
            ) : (
              <div className="hidden lg:flex justify-center">
                <Home size={24} className="text-gray-700" />
              </div>
            )}
          </div>

          {/* 导航菜单 */}
          <nav className={`flex-1 space-y-2 ${isCollapsed ? 'lg:p-2' : 'p-4'}`}>
            {/* 收缩状态下的展开按钮 */}
            {isCollapsed && (
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden lg:flex w-full justify-center p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors duration-200"
                title="展开侧边栏"
              >
                <ChevronRight size={18} />
              </button>
            )}
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
                    flex items-center rounded-lg text-sm font-medium
                    transition-colors duration-200
                    ${isCollapsed ? 'lg:px-2 lg:py-3 lg:justify-center' : 'px-3 py-2'}
                    ${isDisabled
                      ? 'text-gray-400 cursor-not-allowed bg-gray-50'
                      : isActive
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                  title={isCollapsed ? tool.name : undefined}
                >
                  <Icon size={18} className={isCollapsed ? 'lg:mr-0' : 'mr-3'} />
                  {!isCollapsed && (
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
                  )}
                </Link>
              )
            })}
          </nav>

          {/* 底部信息 */}
          <div className={`border-t border-gray-200 ${isCollapsed ? 'lg:p-2' : 'p-4'}`}>
            {!isCollapsed ? (
              <p className="text-xs text-gray-500 text-center">
                基于 Next.js + React + Tailwind CSS
              </p>
            ) : (
              <div className="hidden lg:flex justify-center">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
