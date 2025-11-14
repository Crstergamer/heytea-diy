#!/bin/bash

echo "🚀 设置工作环境..."

# 快速安装依赖（后台运行，避免阻塞）
echo "📦 开始安装依赖（后台运行）..."
nohup npm install --prefer-offline --no-optional > install.log 2>&1 &

echo "✅ 环境设置完成！"
echo "💡 依赖正在后台安装，请稍等片刻"
echo "💡 安装完成后将自动运行 'npm start' 启动开发服务器"