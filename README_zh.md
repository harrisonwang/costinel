# VPS Watcher (VPS库存监控工具)

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

## 系统要求

- Node.js >= 20
- npm 或 yarn

## 快速开始

1. 克隆仓库

```bash
git clone https://github.com/harrisonwang/vps-watcher.git
cd vps-watcher
```

2. 安装依赖

```bash
npm install
```

3. 编写监控规则

```dsl
test "check bandwagonhost stock" {
    open "https://bandwagonhost.com/cart.php?a=add&pid=145"
    assert "stock" contains "Out of Stock"
}
```

4. 启动监控

```bash
npm start
```

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

目前支持的网站配置位于 `src/index.js` 中的 `SITE_CONFIGS`：

```javascript
const SITE_CONFIGS = {
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
- `src/index.js`: 主程序和网站配置

## 常见问题

1. **如何添加新的供应商？**
   - 在 `SITE_CONFIGS` 中添加新的配置
   - 配置对应的选择器和匹配文本

2. **如何调整检查间隔？**
   - 目前固定为 3 秒，可以修改 `src/index.js` 中的等待时间

## 贡献

欢迎提交 Pull Request 或 Issue！

## 作者

小王爷

## 许可证

MIT License
