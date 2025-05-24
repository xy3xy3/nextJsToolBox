// 简单的应用测试脚本
const http = require('http');

function testEndpoint(path, expectedStatus = 200) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      console.log(`测试 ${path}: ${res.statusCode === expectedStatus ? '✅ 通过' : '❌ 失败'} (状态码: ${res.statusCode})`);
      resolve(res.statusCode === expectedStatus);
    });

    req.on('error', (err) => {
      console.log(`测试 ${path}: ❌ 失败 (错误: ${err.message})`);
      reject(err);
    });

    req.setTimeout(5000, () => {
      console.log(`测试 ${path}: ❌ 超时`);
      req.destroy();
      reject(new Error('请求超时'));
    });

    req.end();
  });
}

async function runTests() {
  console.log('🧪 开始测试前端工具箱应用...\n');

  const tests = [
    { path: '/', name: '首页' },
    { path: '/markdown', name: 'Markdown 编辑器页面' }
  ];

  let passedTests = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    try {
      const passed = await testEndpoint(test.path);
      if (passed) passedTests++;
    } catch (error) {
      // 错误已在 testEndpoint 中处理
    }
  }

  console.log(`\n📊 测试结果: ${passedTests}/${totalTests} 通过`);
  
  if (passedTests === totalTests) {
    console.log('🎉 所有测试通过！应用运行正常。');
  } else {
    console.log('⚠️  部分测试失败，请检查应用状态。');
  }
}

// 检查服务器是否运行
console.log('检查开发服务器是否在 http://localhost:3000 运行...');
runTests().catch(console.error);
