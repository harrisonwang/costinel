# Costinel

> **Costinel: 您的 VPS 补货监控哨兵，助您第一时间抢占高性价比主机。**

一个基于 Node.js 和 Puppeteer 的专业 VPS 库存监控工具，采用标准化架构设计，易于维护和扩展。

## ✨ 功能特点

- 🎯 **精准监控**：基于 Puppeteer 实现真实浏览器模拟
- 🔔 **及时通知**：支持 Telegram 通知
- 🔧 **易于扩展**：支持添加新的供应商和通知渠道

## 🛒 当前支持的供应商

- [Bandwagonhost](https://bandwagonhost.com)
- [VMISS](https://vmiss.com)
- [DMIT](https://dmit.io)

## 🚀 快速开始

### 1. 克隆仓库

```bash
git clone https://github.com/harrisonwang/costinel.git
cd costinel
```

### 2. 安装依赖

```bash
npm i
```

### 3. 配置环境变量

在项目根目录创建 `.env` 文件：

```bash
# Telegram 配置
TELEGRAM_BOT_TOKEN=你的bot_token
TELEGRAM_CHAT_ID=你的chat_id

# 可选配置
CHECK_INTERVAL=300000    # 检查间隔（毫秒）
LOG_LEVEL=info          # 日志级别
DEBUG=false             # 调试模式
```

### 4. 启动监控

```bash
npm start           # 正常启动
npm run dev         # 开发模式
npm run debug       # 调试模式
```

## ⚙️ 配置说明

### 添加新的监控产品 VPS 套餐

编辑 `src/config/products.config.js`：

```javascript
export const PRODUCTS = [
    {
        name: '产品名称',
        url: '产品链接',
        site: '站点域名',
        description: '产品描述'
    }
];
```

### 添加新的 VPS 供应商站点

编辑 `src/config/sites.config.js`：

```javascript
export const SITE_CONFIGS = {
    '站点域名': {
        stockSelector: 'CSS选择器',
        outOfStockText: '缺货文本',
        waitTime: 3000  // 页面等待时间（毫秒）
    }
};
```

## 🔔 Telegram 机器人设置

### 创建新机器人

1. 在 Telegram 中联系 [@BotFather](https://t.me/BotFather)
2. 使用 `/newbot` 命令创建机器人
3. 保存获得的 Bot Token

### 获取 Chat ID

1. 向您的机器人发送任意消息
2. 访问：`https://api.telegram.org/bot<YourBOTToken>/getUpdates`
3. 在响应中找到 `chat.id` 字段

## ⏰ 定时任务设置

使用 crontab 实现定时检查：

```bash
# 编辑 crontab
crontab -e

# 每5分钟检查一次
*/5 * * * * /opt/projects/costinel/scripts/costinel.sh

# 或使用 npm start
*/5 * * * * cd /opt/projects/costinel && npm start >> logs/costinel.log 2>&1
```
## 🤝 贡献

欢迎提交 Pull Request 或 Issue！

## 👤 作者

**小王爷**

## 📄 许可证

[MIT License](LICENSE)
