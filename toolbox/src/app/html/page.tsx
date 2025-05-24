'use client'

import HtmlEditor from '@/components/tools/HtmlEditor'

const defaultHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HTML 预览示例</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        
        h1 {
            color: #2c3e50;
            text-align: center;
            margin-bottom: 30px;
            font-size: 2.5em;
        }
        
        .feature-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        
        .feature-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #3498db;
            transition: transform 0.3s ease;
        }
        
        .feature-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        
        .feature-card h3 {
            color: #2980b9;
            margin-top: 0;
        }
        
        .demo-button {
            background: linear-gradient(45deg, #3498db, #2980b9);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 25px;
            cursor: pointer;
            font-size: 16px;
            transition: all 0.3s ease;
            margin: 10px 5px;
        }
        
        .demo-button:hover {
            transform: scale(1.05);
            box-shadow: 0 5px 15px rgba(52, 152, 219, 0.4);
        }
        
        .code-block {
            background: #2c3e50;
            color: #ecf0f1;
            padding: 15px;
            border-radius: 5px;
            font-family: 'Courier New', monospace;
            margin: 15px 0;
            overflow-x: auto;
        }
        
        .highlight {
            background: linear-gradient(120deg, #a8edea 0%, #fed6e3 100%);
            padding: 2px 6px;
            border-radius: 3px;
            font-weight: bold;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .fade-in {
            animation: fadeIn 0.6s ease-out;
        }
    </style>
</head>
<body>
    <div class="container fade-in">
        <h1>🎨 HTML 编辑器演示</h1>
        
        <p>欢迎使用 <span class="highlight">HTML 编辑器</span>！这是一个功能强大的在线 HTML 编辑和预览工具。</p>
        
        <div class="feature-grid">
            <div class="feature-card">
                <h3>🚀 实时预览</h3>
                <p>编辑代码时立即看到效果，支持 HTML、CSS 和 JavaScript。</p>
            </div>
            
            <div class="feature-card">
                <h3>📱 响应式设计</h3>
                <p>支持多种视图模式：分屏、纯编辑、纯预览。</p>
            </div>
            
            <div class="feature-card">
                <h3>💾 文件操作</h3>
                <p>支持导入导出 HTML 文件，方便保存和分享。</p>
            </div>
            
            <div class="feature-card">
                <h3>🎯 代码高亮</h3>
                <p>清晰的代码显示，提升编程体验。</p>
            </div>
        </div>
        
        <h2>🛠️ 功能演示</h2>
        
        <p>点击下面的按钮体验交互功能：</p>
        
        <button class="demo-button" onclick="showAlert()">显示提示</button>
        <button class="demo-button" onclick="changeColor()">改变颜色</button>
        <button class="demo-button" onclick="addElement()">添加元素</button>
        
        <div id="dynamic-content"></div>
        
        <h2>📝 代码示例</h2>
        
        <p>这是一个简单的 JavaScript 代码示例：</p>
        
        <div class="code-block">
function showAlert() {
    alert('Hello from HTML Editor! 👋');
}

function changeColor() {
    document.body.style.background = 
        \`hsl(\${Math.random() * 360}, 70%, 80%)\`;
}
        </div>
        
        <h2>✨ 开始编辑</h2>
        
        <p>现在你可以：</p>
        <ul>
            <li>修改这个 HTML 代码</li>
            <li>添加新的 CSS 样式</li>
            <li>编写 JavaScript 交互</li>
            <li>实时查看预览效果</li>
        </ul>
        
        <p style="text-align: center; margin-top: 40px; color: #7f8c8d;">
            <strong>Happy Coding! 🎉</strong>
        </p>
    </div>
    
    <script>
        function showAlert() {
            alert('Hello from HTML Editor! 👋');
        }
        
        function changeColor() {
            const colors = [
                'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
            ];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            document.body.style.background = randomColor;
        }
        
        function addElement() {
            const container = document.getElementById('dynamic-content');
            const newElement = document.createElement('div');
            newElement.className = 'feature-card fade-in';
            newElement.innerHTML = \`
                <h3>🎉 动态元素</h3>
                <p>这是通过 JavaScript 动态添加的元素！时间：\${new Date().toLocaleTimeString()}</p>
            \`;
            container.appendChild(newElement);
        }
        
        // 页面加载完成后的初始化
        document.addEventListener('DOMContentLoaded', function() {
            console.log('HTML Editor Demo loaded successfully! 🚀');
        });
    </script>
</body>
</html>`

export default function HtmlPage() {
  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          HTML 编辑器
        </h1>
        <p className="text-gray-600 mt-2">
          在线 HTML 编辑和预览工具，支持实时预览、多种视图模式、文件导入导出等功能
        </p>
      </div>

      {/* 编辑器 */}
      <HtmlEditor initialValue={defaultHtml} />
    </div>
  )
}
