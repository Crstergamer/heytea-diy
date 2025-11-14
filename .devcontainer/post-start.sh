#!/bin/bash

# 设置颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_message() {
    echo -e "${2}${1}${NC}"
}

print_message "🔄 启动 Online Workspace 服务..." $CYAN

# 检查依赖是否已安装
if [ ! -d "node_modules" ]; then
    print_message "📦 检测到缺少依赖，正在安装..." $YELLOW
    npm install
    print_message "✅ 依赖安装完成" $GREEN
fi

sleep 5

# 自动启动 UI 界面
print_message "🚀 使用时请勿关闭该界面..." $CYAN
print_message "🚀 正在启动  UI   界面..." $CYAN

npm start

print_message "" $NC