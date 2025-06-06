'use client'

import PlantUMLEditor from '@/components/tools/PlantUMLEditor'

const defaultPlantUMLCode = `@startuml
title 用户登录流程

actor 用户 as user
participant 前端 as frontend
participant 后端 as backend
participant 数据库 as database

user -> frontend: 输入用户名和密码
frontend -> backend: 发送登录请求
backend -> database: 验证用户信息
database --> backend: 返回验证结果

alt 验证成功
    backend --> frontend: 返回登录成功
    frontend --> user: 跳转到主页
else 验证失败
    backend --> frontend: 返回错误信息
    frontend --> user: 显示错误提示
end

@enduml`

export default function PlantUMLPage() {
  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          PlantUML 图表编辑器
        </h1>
        <p className="text-gray-600 mt-2">
          使用 PlantUML 语法创建序列图、类图、活动图、用例图等各种 UML 图表，支持实时预览和导出功能
        </p>
      </div>

      {/* 编辑器 */}
      <PlantUMLEditor initialValue={defaultPlantUMLCode} />
    </div>
  )
}
