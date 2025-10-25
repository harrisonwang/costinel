# VPS 补货通知工具

一个基于 Node.js 和 Puppeteer 的 VPS 库存监控工具，支持自定义 DSL 语法来描述监控任务。

## 当前支持的供应商

- Bandwagonhost
- DMIT

## 功能特点

- 基于 Puppeteer 实现真实浏览器模拟
- 自定义 DSL 语法编写监控规则
- 支持多个供应商配置
- 支持自定义选择器和匹配文本
- 支持等待时间和错误处理
- Telegram 通知支持
- 环境变量配置

## 系统要求

- Node.js >= 20
- npm 或 yarn
- Telegram Bot Token（用于通知）

## 快速开始

1. 克隆仓库

```bash
git clone https://github.com/harrisonwang/vps-restock-notifier.git
cd vps-restock-notifier
```

2. 安装依赖

```bash
npm install
```

3. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，填入您的 Telegram bot token 和 chat ID
vim .env
```

4. 编写监控规则

```dsl
test "check bandwagonhost stock" {
    open "https://bandwagonhost.com/cart.php?a=add&pid=145"
    assert "stock" contains "Out of Stock"
}
```

5. 启动监控

```bash
npm start
```

## 环境变量配置

在项目根目录创建 `.env` 文件：

```bash
# Telegram 配置
TELEGRAM_BOT_TOKEN=你的bot_token
TELEGRAM_CHAT_ID=你的chat_id

# 监控配置
CHECK_INTERVAL=300  # 检查间隔（秒）
```

## Telegram 机器人设置

1. 创建新机器人：
   - 在 Telegram 中联系 @BotFather
   - 使用 `/newbot` 命令
   - 保存获得的 bot token

2. 获取您的 chat ID：
   - 向机器人发送消息
   - 访问：`https://api.telegram.org/bot<YourBOTToken>/getUpdates`
   - 在响应中找到您的 `chat.id`

## DSL 语法说明

支持的命令：

- `test`: 定义测试用例
- `open`: 打开指定 URL
- `click`: 点击指定元素
- `input`: 输入文本
- `assert`: 断言检查

示例：

```dsl
test "check bandwagonhost stock" {
    open "https://bandwagonhost.com/cart.php?a=add&pid=145"
    assert "stock" contains "Out of Stock"
}
```

## 网站配置说明

目前支持的网站配置位于 `src/config.js`：

```javascript
export const SITE_CONFIGS = {
    'bandwagonhost.com': {
        stockSelector: '#order-web20cart .errorbox',
        outOfStockText: 'Out of Stock'
    },
    'dmit.io': {
        stockSelector: '#order-boxes h1',
        outOfStockText: 'Out of Stock'
    }
};
```

## 开发相关

项目结构：

- `src/lexer.js`: DSL 词法分析器
- `src/parser.js`: DSL 语法分析器
- `src/index.js`: 主程序
- `src/config.js`: 网站配置
- `src/services/telegram.js`: Telegram 通知服务
- `scripts/vps-restock-notifier.sh`: 执行脚本

## 定时任务设置

添加到 crontab 实现自动检查：

```bash
# 每5分钟检查一次
*/5 * * * * /opt/vps-restock-notifier/scripts/vps-restock-notifier.sh
```

## 常见问题

1. **如何添加新的供应商？**
   - 在 `SITE_CONFIGS` 中添加新的配置
   - 配置对应的选择器和匹配文本

2. **如何调整检查间隔？**
   - 修改 .env 文件中的 CHECK_INTERVAL
   - 如果使用 cron，更新 crontab 调度时间

3. **Telegram 通知不工作？**
   - 验证 .env 中的 bot token 和 chat ID
   - 检查机器人权限
   - 查看应用日志

## 贡献

欢迎提交 Pull Request 或 Issue！

## 作者

小王爷

## 许可证

MIT License
