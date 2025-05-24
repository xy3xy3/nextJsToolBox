import Link from 'next/link'
import {
  FileText,
  Code,
  Eye,
  GitBranch,
  Zap,
  Palette,
  Settings
} from 'lucide-react'

const tools = [
  {
    name: 'Markdown 预览',
    description: '实时编辑和预览 Markdown 文档，支持语法高亮和导出功能',
    href: '/markdown',
    icon: FileText,
    color: 'bg-blue-500',
    available: true
  },
  {
    name: 'HTML 预览',
    description: '在线编辑 HTML 代码并实时预览效果',
    href: '/html',
    icon: Code,
    color: 'bg-orange-500',
    available: true
  },
  {
    name: 'Mermaid 图表',
    description: '创建流程图、时序图、甘特图等各种图表',
    href: '/mermaid',
    icon: GitBranch,
    color: 'bg-green-500',
    available: true
  },
  {
    name: 'Graphviz 图表',
    description: '使用 DOT 语言创建复杂的图形和网络图',
    href: '/graphviz',
    icon: Eye,
    color: 'bg-purple-500',
    available: false
  }
]

const features = [
  {
    icon: Zap,
    title: '快速高效',
    description: '基于 Next.js 构建，提供极速的加载和响应体验'
  },
  {
    icon: Palette,
    title: '美观易用',
    description: '采用 Tailwind CSS 设计，界面简洁美观，操作直观'
  },
  {
    icon: Settings,
    title: '功能丰富',
    description: '集成多种前端开发常用工具，满足日常开发需求'
  }
]

export default function Home() {
  return (
    <div className="space-y-8">
      {/* 头部介绍 */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          前端工具箱
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          基于 Next.js + React + Tailwind CSS 构建的前端开发工具集合，
          提供 Markdown 预览、HTML 预览、图表生成等实用功能
        </p>
      </div>

      {/* 工具卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {tools.map((tool) => {
          const Icon = tool.icon
          return (
            <div
              key={tool.name}
              className={`
                relative bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200
                ${!tool.available ? 'opacity-60' : ''}
              `}
            >
              {!tool.available && (
                <div className="absolute top-4 right-4 bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                  即将推出
                </div>
              )}

              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className={`p-3 rounded-lg ${tool.color} text-white mr-4`}>
                    <Icon size={24} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {tool.name}
                  </h3>
                </div>

                <p className="text-gray-600 mb-4">
                  {tool.description}
                </p>

                {tool.available ? (
                  <Link
                    href={tool.href}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors duration-200"
                  >
                    开始使用
                  </Link>
                ) : (
                  <button
                    disabled
                    className="inline-flex items-center px-4 py-2 bg-gray-300 text-gray-500 text-sm font-medium rounded-md cursor-not-allowed"
                  >
                    敬请期待
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* 特性介绍 */}
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
          为什么选择我们的工具箱？
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div key={feature.title} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-lg mb-4">
                  <Icon size={24} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* 技术栈 */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
          技术栈
        </h3>
        <div className="flex flex-wrap justify-center gap-4">
          {['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Vditor', 'Lucide Icons'].map((tech) => (
            <span
              key={tech}
              className="px-3 py-1 bg-white text-gray-700 text-sm rounded-full border border-gray-200"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
