#!/bin/bash

set -Eeuo pipefail
umask 027

# ============ 配置区 ============
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="${PROJECT_DIR_OVERRIDE:-$(cd "$SCRIPT_DIR/.." && pwd)}"
LOG_FILE="/var/log/costinel/app.log"
LOCK_FILE="/run/costinel.lock"
NODE_BIN="${NODE_BIN:-/root/.nvm/versions/node/v24.11.1/bin/node}"
TIMEOUT_DURATION="25m"

# ============ 锁文件（防并发）============
exec 9>"$LOCK_FILE"
if ! flock -n 9; then
    echo "[$(date '+%F %T %Z')] 程序已经在运行中，跳过本次执行" >> "$LOG_FILE" 2>&1 || true
    exit 0
fi

# ============ 清理函数 ============
cleanup() {
    flock -u 9 2>/dev/null || true
}
trap cleanup INT TERM EXIT

# ============ 确保日志目录存在 ============
mkdir -p "$(dirname "$LOG_FILE")"

# ============ 加载环境变量 ============
if [ -f "$PROJECT_DIR/.env" ]; then
    set -a
    . "$PROJECT_DIR/.env"
    set +a
fi

# ============ 执行主程序 ============
cd "$PROJECT_DIR"
timeout "$TIMEOUT_DURATION" "$NODE_BIN" src/index.js >> "$LOG_FILE" 2>&1
