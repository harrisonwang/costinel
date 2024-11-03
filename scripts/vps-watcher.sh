#!/bin/bash

LOCK_FILE="/tmp/vps-watcher.lock"

# 检查是否已经在运行
if [ -f "$LOCK_FILE" ]; then
    echo "程序已经在运行中"
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

# 执行主程序
cd /opt/vps-watcher
/root/.nvm/versions/node/v20.17.0/bin/node src/index.js >> /opt/vps-watcher/logs/vps-watcher.log 2>&1
