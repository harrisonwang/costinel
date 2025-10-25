#!/usr/bin/env node

import Lexer from './lexer.js';
import Parser from './parser.js';
import puppeteer from 'puppeteer';
import { PRODUCTS, SITE_CONFIGS } from './config.js';
import telegramService from './services/telegram.js';

class RestockNotifier {
    constructor(tests) {
        this.tests = tests;
    }

    // 打印表格分隔线
    printSeparator(widths) {
        const line = widths.map(w => '─'.repeat(w)).join('─┼─');
        console.log(`├─${line}─┤`);
    }

    // 打印表格顶部
    printTableTop(widths) {
        const line = widths.map(w => '─'.repeat(w)).join('─┬─');
        console.log(`┌─${line}─┐`);
    }

    // 打印表格底部
    printTableBottom(widths) {
        const line = widths.map(w => '─'.repeat(w)).join('─┴─');
        console.log(`└─${line}─┘`);
    }

    // 打印表格行
    printRow(columns, widths) {
        const paddedColumns = columns.map((col, i) => {
            return this.padToWidth(col, widths[i]);
        });
        console.log(`│ ${paddedColumns.join(' │ ')} │`);
    }

    // 计算显示宽度（中文字符算2个宽度，ASCII算1个）
    getDisplayWidth(str) {
        let width = 0;
        for (const char of str) {
            const code = char.charCodeAt(0);
            // ASCII 字符宽度为 1
            if (code <= 127) {
                width += 1;
            } else {
                // 中文及其他宽字符为 2
                width += 2;
            }
        }
        return width;
    }

    // 填充字符串到指定显示宽度
    padToWidth(str, targetWidth) {
        const displayWidth = this.getDisplayWidth(str);
        
        if (displayWidth > targetWidth) {
            // 需要截断
            let truncated = '';
            let currentWidth = 0;
            
            for (const char of str) {
                const charWidth = char.charCodeAt(0) <= 127 ? 1 : 2;
                if (currentWidth + charWidth + 3 > targetWidth) {
                    break;
                }
                truncated += char;
                currentWidth += charWidth;
            }
            
            const dotsWidth = 3; // "..." 的宽度
            const paddingNeeded = targetWidth - currentWidth - dotsWidth;
            return truncated + '...' + ' '.repeat(Math.max(0, paddingNeeded));
        } else {
            // 填充空格到目标宽度
            const paddingNeeded = targetWidth - displayWidth;
            return str + ' '.repeat(Math.max(0, paddingNeeded));
        }
    }

    async run() {
        console.log(`\n[${getChinaTime()}] 开始检查库存...\n`);
        
        // 定义列宽
        const columnWidths = [30, 15, 60, 12];
        const headers = ['套餐名称', '检查状态', 'URL', '库存状态'];
        
        // 打印表格头部
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
            
            // 获取URL
            for (const action of test.actions) {
                if (action.type === 'open') {
                    url = action.url;
                    break;
                }
            }

            // 显示检查中状态（不需要动画，直接打印完成状态）
            // const checkingRow = [
            //     this.padToWidth(productName, columnWidths[0]),
            //     this.padToWidth('[检查中...]', columnWidths[1]),
            //     this.padToWidth(url, columnWidths[2]),
            //     this.padToWidth('等待中', columnWidths[3])
            // ];
            // process.stdout.write(`│ ${checkingRow.join(' │ ')} │\r`);

            // 执行检查
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

            // 显示最终状态
            const finalRow = [
                this.padToWidth(productName, columnWidths[0]),
                this.padToWidth('[已完成]', columnWidths[1]),
                this.padToWidth(url, columnWidths[2]),
                this.padToWidth(stockStatus, columnWidths[3])
            ];
            console.log(`│ ${finalRow.join(' │ ')} │`);
            
            // 如果不是最后一行，打印分隔线
            if (i < this.tests.length - 1) {
                this.printSeparator(columnWidths);
            }
        }

        // 打印表格底部
        this.printTableBottom(columnWidths);
        console.log(`\n[${getChinaTime()}] 库存检查完成\n${'='.repeat(50)}`);
        
        await browser.close();
    }
}

// 动态生成测试代码
const generateTestCode = () => {
    return PRODUCTS.map(product => `
test "Check ${product.name} Stock" {
    open "${product.url}"
    assert "stock" contains "Out of Stock"
}
`).join('\n');
};

const sourceCode = generateTestCode();

// 修改最后的执行部分，添加错误处理
async function main() {
    try {
        const lexer = new Lexer(sourceCode);
        const tokens = lexer.tokenize();
        const parser = new Parser(tokens);
        const ast = parser.parse();
        const runner = new RestockNotifier(ast);
        await runner.run();
    } catch (error) {
        console.error('执行出错:', error);
        process.exit(1);
    }
}

main();

// 添加一个获取东八区时间的辅助函数
function getChinaTime() {
    return new Date().toLocaleString('zh-CN', {
        timeZone: 'Asia/Shanghai',
        hour12: false
    });
}
