#!/usr/bin/env node

/**
 * Costinel 统一监控入口
 * 支持 VPS 补货监控 + 股票价格监控
 */

import Lexer from './lexer.js';
import Parser from './parser.js';
import puppeteer from 'puppeteer';
import { PRODUCTS, SITE_CONFIGS } from './config.js';
import { STOCK_CONFIG } from './config/stock.config.js';
import StockMonitor from './monitors/stock-monitor.js';
import telegramService from './services/telegram.js';

// 从原 index.js 导入的 VPS 监控类
class VPSMonitor {
    constructor(tests) {
        this.tests = tests;
    }

    printSeparator(widths) {
        const line = widths.map(w => '─'.repeat(w)).join('─┼─');
        console.log(`├─${line}─┤`);
    }

    printTableTop(widths) {
        const line = widths.map(w => '─'.repeat(w)).join('─┬─');
        console.log(`┌─${line}─┐`);
    }

    printTableBottom(widths) {
        const line = widths.map(w => '─'.repeat(w)).join('─┴─');
        console.log(`└─${line}─┘`);
    }

    printRow(columns, widths) {
        const paddedColumns = columns.map((col, i) => {
            return this.padToWidth(col, widths[i]);
        });
        console.log(`│ ${paddedColumns.join(' │ ')} │`);
    }

    getDisplayWidth(str) {
        let width = 0;
        for (const char of str) {
            const code = char.charCodeAt(0);
            width += (code <= 127) ? 1 : 2;
        }
        return width;
    }

    padToWidth(str, targetWidth) {
        const displayWidth = this.getDisplayWidth(str);

        if (displayWidth > targetWidth) {
            let truncated = '';
            let currentWidth = 0;

            for (const char of str) {
                const charWidth = char.charCodeAt(0) <= 127 ? 1 : 2;
                if (currentWidth + charWidth + 3 > targetWidth) break;
                truncated += char;
                currentWidth += charWidth;
            }

            const paddingNeeded = targetWidth - currentWidth - 3;
            return truncated + '...' + ' '.repeat(Math.max(0, paddingNeeded));
        } else {
            return str + ' '.repeat(Math.max(0, targetWidth - displayWidth));
        }
    }

    async run() {
        console.log(`\n[${getChinaTime()}] 开始检查 VPS 库存...\n`);

        const columnWidths = [30, 15, 60, 12];
        const headers = ['套餐名称', '检查状态', 'URL', '库存状态'];

        this.printTableTop(columnWidths);
        this.printRow(headers, columnWidths);
        this.printSeparator(columnWidths);

        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36');

        for (let i = 0; i < this.tests.length; i++) {
            const test = this.tests[i];
            const productName = test.testName.replace('Check ', '').replace(' Stock', '');
            let url = '';
            let stockStatus = '';

            for (const action of test.actions) {
                if (action.type === 'open') {
                    url = action.url;
                    break;
                }
            }

            for (const action of test.actions) {
                if (action.type === 'open') {
                    await page.goto(action.url);
                } else if (action.type === 'click') {
                    await page.click(action.selector);
                } else if (action.type === 'input') {
                    await page.type(action.selector, action.value);
                } else if (action.type === 'assert') {
                    await new Promise(resolve => setTimeout(resolve, 3000));

                    try {
                        const domain = await page.evaluate(() => {
                            return window.location.hostname.replace(/^www\./, '');
                        });
                        const config = SITE_CONFIGS[domain];

                        if (!config) {
                            stockStatus = 'X 配置错误';
                        } else {
                            const elementText = await page.evaluate((selector) => {
                                const element = document.querySelector(selector);
                                return element ? element.innerText : `未找到元素: ${selector}`;
                            }, config.stockSelector);

                            const found = elementText.includes(config.outOfStockText);
                            const notFoundElement = elementText.includes('未找到元素');

                            if (!found && !notFoundElement) {
                                stockStatus = '√ 有货';
                                const message = `
🎉 <b>${domain}</b> 有库存啦！

🔗 产品链接: ${page.url()}
⏰ 检测时间: ${getChinaTime()}

快去抢购吧！
`;
                                await telegramService.sendMessage(message);
                            } else {
                                stockStatus = '[无货]';
                            }
                        }
                    } catch (error) {
                        stockStatus = '! 错误';
                    }
                }
            }

            const finalRow = [
                this.padToWidth(productName, columnWidths[0]),
                this.padToWidth('[已完成]', columnWidths[1]),
                this.padToWidth(url, columnWidths[2]),
                this.padToWidth(stockStatus, columnWidths[3])
            ];
            console.log(`│ ${finalRow.join(' │ ')} │`);

            if (i < this.tests.length - 1) {
                this.printSeparator(columnWidths);
            }
        }

        this.printTableBottom(columnWidths);
        console.log(`\n[${getChinaTime()}] VPS 库存检查完成\n${'='.repeat(130)}`);

        await browser.close();
    }
}

// 生成 VPS 监控测试代码
const generateVPSTestCode = () => {
    return PRODUCTS.map(product => `
test "Check ${product.name} Stock" {
    open "${product.url}"
    assert "stock" contains "Out of Stock"
}
`).join('\n');
};

// 获取中国时间
function getChinaTime() {
    return new Date().toLocaleString('zh-CN', {
        timeZone: 'Asia/Shanghai',
        hour12: false
    });
}

// 主函数
async function main() {
    try {
        console.log('\n' + '='.repeat(130));
        console.log(`🚀 Costinel 监控系统启动 - ${getChinaTime()}`);
        console.log('='.repeat(130));

        // 1. VPS 补货监控
        console.log('\n📦 【VPS 补货监控】');
        const sourceCode = generateVPSTestCode();
        const lexer = new Lexer(sourceCode);
        const tokens = lexer.tokenize();
        const parser = new Parser(tokens);
        const ast = parser.parse();
        const vpsMonitor = new VPSMonitor(ast);
        await vpsMonitor.run();

        // 2. 股票价格监控
        console.log('\n📈 【股票价格监控】');
        const stockMonitor = new StockMonitor(STOCK_CONFIG);
        await stockMonitor.run();

        console.log('\n' + '='.repeat(130));
        console.log(`✅ 所有监控任务完成 - ${getChinaTime()}`);
        console.log('='.repeat(130) + '\n');

    } catch (error) {
        console.error('❌ 执行出错:', error);
        process.exit(1);
    }
}

main();
