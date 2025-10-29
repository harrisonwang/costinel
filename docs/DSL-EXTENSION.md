# Costinel DSL 扩展方案

## 概述

扩展 Costinel 的 DSL 语言，支持股票监控、自然语言配置和更复杂的监控场景。

---

## 1. 股票监控 DSL

### 基础语法

```dsl
stock "SZ002261" {
    name "拓维信息"

    when price below 10 {
        notify "💰 价格低于 10 元"
    }

    when price above 15 {
        notify "🚀 价格突破 15 元"
    }

    when change up 5% {
        notify "📈 涨幅超过 5%"
    }

    when change down 5% {
        notify "📉 跌幅超过 5%"
    }

    when price in 9.5..10.5 {
        notify "🎯 进入目标区间"
    }
}
```

### 高级功能

```dsl
stock "SH600519" {
    name "贵州茅台"
    cooldown 30min

    // 组合条件
    when (price below 1500) and (change down 3%) {
        notify "茅台大跌，关注买入机会" priority high
    }

    // 时间条件
    when price above 1800 at "14:30" {
        notify "尾盘突破 1800" priority high
    }

    // 技术指标
    when ma5 cross ma20 {
        notify "金叉信号"
    }
}
```

---

## 2. 自然语言配置

### 设计思路

支持用自然语言描述监控规则，AI 解析后生成标准 DSL。

### 示例

```javascript
// 用户输入自然语言
const userInput = "监控搬瓦工的 DC9 套餐，有货就通知我";

// AI 解析生成 DSL
const generatedDSL = `
test "Check The DC9 Plan Stock" {
    open "https://bandwagonhost.com/cart.php?a=add&pid=145"
    assert "stock" contains "Out of Stock"
}
`;
```

```javascript
// 股票监控示例
const userInput = "拓维信息低于 10 块提醒我";

// 生成的 DSL
const generatedDSL = `
stock "SZ002261" {
    name "拓维信息"
    when price below 10 {
        notify "价格低于 10 元"
    }
}
`;
```

### 实现方案

```javascript
// src/services/nlp-parser.js
import OpenAI from 'openai';

class NLPParser {
    constructor() {
        this.client = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
    }

    async parseToDSL(naturalLanguage) {
        const prompt = `
你是一个监控系统的 DSL 生成器。根据用户的自然语言描述，生成对应的 DSL 代码。

支持的监控类型：
1. VPS 补货监控
2. 股票价格监控

DSL 语法示例：

VPS 监控:
test "Check Product Stock" {
    open "URL"
    assert "stock" contains "Out of Stock"
}

股票监控:
stock "CODE" {
    name "NAME"
    when price below VALUE {
        notify "MESSAGE"
    }
}

用户输入: ${naturalLanguage}

请只输出 DSL 代码，不要有任何解释。
`;

        const response = await this.client.chat.completions.create({
            model: 'gpt-4',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.1
        });

        return response.choices[0].message.content.trim();
    }

    // 验证生成的 DSL 是否合法
    async validate(dsl) {
        try {
            const lexer = new Lexer(dsl);
            const tokens = lexer.tokenize();
            const parser = new Parser(tokens);
            parser.parse();
            return { valid: true };
        } catch (error) {
            return { valid: false, error: error.message };
        }
    }
}

export default NLPParser;
```

---

## 3. Telegram Bot 交互增强

### 命令列表

```
/start - 开始使用
/help - 帮助信息

监控管理:
/add <自然语言> - 添加监控
/list - 列出所有监控
/remove <id> - 删除监控
/pause <id> - 暂停监控
/resume <id> - 恢复监控

查询:
/status - 查看监控状态
/stats - 查看统计数据
/history - 查看通知历史

设置:
/config - 配置设置
/cooldown <minutes> - 设置通知冷却时间
```

### 交互示例

```
用户: /add 监控搬瓦工 DC9 套餐

Bot:
✅ 已添加监控

📦 VPS 监控
• 产品: The DC9 Plan
• URL: https://bandwagonhost.com/cart.php?a=add&pid=145
• 状态: 活跃
• ID: #001

---

用户: /add 拓维信息低于 10 元提醒我

Bot:
✅ 已添加监控

📈 股票监控
• 股票: 拓维信息 (SZ002261)
• 条件: 价格低于 ¥10
• 冷却: 1 小时
• ID: #002

---

用户: /list

Bot:
📋 监控列表 (2 个)

#001 📦 The DC9 Plan
状态: 🟢 活跃 | 最后检查: 5 分钟前

#002 📈 拓维信息 (SZ002261)
状态: 🟢 活跃 | 当前价格: ¥9.85

---

用户: /stats

Bot:
📊 统计数据

总监控数: 2
活跃: 2 | 暂停: 0

本周触发: 5 次
• VPS 补货: 2 次
• 股票提醒: 3 次

---

用户: /remove 002

Bot:
✅ 已删除监控 #002 (拓维信息)
```

### 实现代码

```javascript
// src/services/telegram-bot.js
import TelegramBot from 'node-telegram-bot-api';
import NLPParser from './nlp-parser.js';

class TelegramBotService {
    constructor(token) {
        this.bot = new TelegramBot(token, { polling: true });
        this.nlpParser = new NLPParser();
        this.monitors = new Map();
        this.setupCommands();
    }

    setupCommands() {
        // /start
        this.bot.onText(/\/start/, (msg) => {
            this.bot.sendMessage(msg.chat.id, `
👋 欢迎使用 Costinel 监控系统！

我可以帮你监控：
📦 VPS 补货
📈 股票价格

使用 /help 查看所有命令
            `);
        });

        // /add
        this.bot.onText(/\/add (.+)/, async (msg, match) => {
            const naturalLanguage = match[1];
            const chatId = msg.chat.id;

            try {
                // 使用 NLP 解析
                const dsl = await this.nlpParser.parseToDSL(naturalLanguage);

                // 验证 DSL
                const validation = await this.nlpParser.validate(dsl);
                if (!validation.valid) {
                    throw new Error(validation.error);
                }

                // 添加监控
                const monitorId = this.addMonitor(dsl, chatId);

                this.bot.sendMessage(chatId, `
✅ 已添加监控 #${monitorId}

📝 生成的规则:
\`\`\`
${dsl}
\`\`\`

使用 /list 查看所有监控
                `, { parse_mode: 'Markdown' });
            } catch (error) {
                this.bot.sendMessage(chatId, `
❌ 添加失败: ${error.message}

请尝试：
• /add 监控搬瓦工 DC9 套餐
• /add 拓维信息低于 10 元提醒我
                `);
            }
        });

        // /list
        this.bot.onText(/\/list/, (msg) => {
            const monitors = Array.from(this.monitors.values());

            if (monitors.length === 0) {
                this.bot.sendMessage(msg.chat.id, '📭 暂无监控任务');
                return;
            }

            const list = monitors.map(m =>
                `#${m.id} ${m.icon} ${m.name}\n状态: ${m.status} | 最后检查: ${m.lastCheck}`
            ).join('\n\n');

            this.bot.sendMessage(msg.chat.id, `
📋 监控列表 (${monitors.length} 个)

${list}
            `);
        });

        // /remove
        this.bot.onText(/\/remove (\d+)/, (msg, match) => {
            const monitorId = match[1];
            const monitor = this.monitors.get(monitorId);

            if (!monitor) {
                this.bot.sendMessage(msg.chat.id, `❌ 监控 #${monitorId} 不存在`);
                return;
            }

            this.monitors.delete(monitorId);
            this.bot.sendMessage(msg.chat.id, `✅ 已删除监控 #${monitorId} (${monitor.name})`);
        });
    }

    addMonitor(dsl, chatId) {
        const id = Date.now().toString();
        this.monitors.set(id, {
            id,
            dsl,
            chatId,
            status: '🟢 活跃',
            createdAt: new Date(),
            lastCheck: '刚刚'
        });
        return id;
    }

    start() {
        console.log('Telegram Bot 已启动');
    }
}

export default TelegramBotService;
```

---

## 4. 完整使用流程

### 场景 1: 通过 Telegram 添加 VPS 监控

```
1. 用户在 Telegram 发送: /add 监控搬瓦工 DC9 套餐

2. 系统:
   - NLP 解析自然语言
   - 生成 DSL 代码
   - 验证语法
   - 添加到监控列表
   - 返回确认消息

3. 系统自动执行:
   - 根据 cron 定时检查
   - 发现有货时推送 Telegram 通知
```

### 场景 2: 通过 Telegram 添加股票监控

```
1. 用户: /add 拓维信息低于 10 元提醒我

2. Bot 生成规则:
stock "SZ002261" {
    name "拓维信息"
    when price below 10 {
        notify "价格低于 10 元"
    }
}

3. 在交易时间自动检查:
   - 获取实时股价
   - 判断条件
   - 触发时推送通知
```

---

## 5. 扩展的 Lexer 和 Parser

### 扩展的词法分析器

```javascript
// src/lexer-extended.js
class ExtendedLexer {
    constructor(sourceCode) {
        this.sourceCode = sourceCode;
        this.tokenSpec = [
            // 原有 tokens
            ['TEST', /test/],
            ['OPEN', /open/],
            ['CLICK', /click/],
            ['INPUT', /input/],
            ['ASSERT', /assert/],

            // 新增股票相关
            ['STOCK', /stock/],
            ['WHEN', /when/],
            ['PRICE', /price/],
            ['CHANGE', /change/],
            ['BELOW', /below/],
            ['ABOVE', /above/],
            ['UP', /up/],
            ['DOWN', /down/],
            ['IN', /in/],
            ['NOTIFY', /notify/],
            ['COOLDOWN', /cooldown/],
            ['PRIORITY', /priority/],

            // 运算符和标识符
            ['RANGE', /\.\./],
            ['NUMBER', /\d+(\.\d+)?/],
            ['PERCENT', /%/],
            ['STRING', /"[^"]*"/],
            ['IDENTIFIER', /[a-zA-Z0-9_-]+/],
            ['LBRACE', /\{/],
            ['RBRACE', /\}/],
            ['WHITESPACE', /\s+/],
        ];
    }

    // tokenize 方法保持不变
}
```

### 扩展的语法分析器

```javascript
// src/parser-extended.js
class ExtendedParser {
    // ... 原有方法 ...

    parseStock() {
        this.eat('STOCK');
        const code = this.parseString();
        this.eat('LBRACE');

        const config = {
            type: 'stock',
            code,
            conditions: []
        };

        while (this.currentToken.type !== 'RBRACE') {
            if (this.currentToken.value === 'name') {
                this.eat('IDENTIFIER');
                config.name = this.parseString();
            } else if (this.currentToken.value === 'cooldown') {
                this.eat('IDENTIFIER');
                config.cooldown = this.parseNumber();
                this.eat('IDENTIFIER'); // min/hour
            } else if (this.currentToken.type === 'WHEN') {
                config.conditions.push(this.parseCondition());
            }
        }

        this.eat('RBRACE');
        return config;
    }

    parseCondition() {
        this.eat('WHEN');

        const condition = {};

        if (this.currentToken.type === 'PRICE') {
            this.eat('PRICE');

            if (this.currentToken.type === 'BELOW') {
                this.eat('BELOW');
                condition.type = 'below';
                condition.value = this.parseNumber();
            } else if (this.currentToken.type === 'ABOVE') {
                this.eat('ABOVE');
                condition.type = 'above';
                condition.value = this.parseNumber();
            }
        } else if (this.currentToken.type === 'CHANGE') {
            this.eat('CHANGE');

            if (this.currentToken.type === 'UP') {
                this.eat('UP');
                condition.type = 'change_up';
            } else if (this.currentToken.type === 'DOWN') {
                this.eat('DOWN');
                condition.type = 'change_down';
            }

            condition.value = this.parseNumber();
            this.eat('PERCENT');
        }

        this.eat('LBRACE');
        this.eat('NOTIFY');
        condition.message = this.parseString();
        this.eat('RBRACE');

        return condition;
    }
}
```

---

## 6. 总结

通过 DSL 扩展和自然语言支持，Costinel 可以：

1. ✅ 支持多种监控类型（VPS + 股票）
2. ✅ 自然语言配置，降低使用门槛
3. ✅ Telegram Bot 交互，随时随地管理监控
4. ✅ 可扩展性强，易于添加新的监控类型

下一步可以实现：
- 其他资产监控（加密货币、商品）
- 更复杂的条件组合（AND/OR/NOT）
- 技术指标支持（MA、MACD、KDJ）
- 回测功能
- Web 可视化管理界面
