#!/bin/bash

LOCK_FILE="/tmp/vps-watcher.lock"
PROJECT_DIR="/opt/vps-watcher"
LOG_FILE="$PROJECT_DIR/logs/vps-watcher.log"

# 检查是否已经在运行
if [ -f "$LOCK_FILE" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 程序已经在运行中" >> "$LOG_FILE"
    exit 1
fi

# 创建锁文件
touch "$LOCK_FILE"

# 清理函数
cleanup() {
    rm -f "$LOCK_FILE"
}

# 注册清理函数
trap cleanup EXIT

# 确保日志目录存在
mkdir -p "$(dirname "$LOG_FILE")"

# 加载环境变量
if [ -f "$PROJECT_DIR/.env" ]; then
    export $(cat "$PROJECT_DIR/.env" | grep -v '^#' | xargs)
fi

# 执行主程序
cd "$PROJECT_DIR"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 开始执行检查" >> "$LOG_FILE"
/root/.nvm/versions/node/v20.17.0/bin/node src/index.js >> "$LOG_FILE" 2>&1
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 检查完成" >> "$LOG_FILE"
