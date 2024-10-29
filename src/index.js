import Lexer from './lexer.js';
import Parser from './parser.js';
import puppeteer from 'puppeteer';

// 添加网站配置
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

class Watcher {
    constructor(tests) {
        this.tests = tests;
    }

    async run() {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36');

        for (const test of this.tests) {
            console.log(`Running test: ${test.testName}`);
            for (const action of test.actions) {
                if (action.type === 'open') {
                    console.log(`Opening URL: ${action.url}`);
                    await page.goto(action.url);
                } else if (action.type === 'click') {
                    console.log(`Clicking on: ${action.selector}`);
                    await page.click(action.selector);
                } else if (action.type === 'input') {
                    console.log(`Typing in: ${action.selector}`);
                    await page.type(action.selector, action.value);
                } else if (action.type === 'assert') {
                    console.log('等待3秒...');
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    
                    try {
                        // 获取当前页面的域名并移除 www 前缀
                        const domain = await page.evaluate(() => {
                            return window.location.hostname.replace(/^www\./, '');
                        });
                        const config = SITE_CONFIGS[domain];
                        
                        if (!config) {
                            console.error(`未找到网站 ${domain} 的配置`);
                            return;
                        }

                        const elementText = await page.evaluate((selector) => {
                            const element = document.querySelector(selector);
                            return element ? element.innerText : `未找到元素: ${selector}`;
                        }, config.stockSelector);
                        
                        console.log(`${domain} 库存状态文本:`, elementText);

                        // 使用配置的文本进行断言
                        const found = elementText.includes(config.outOfStockText);
                        if (!found) {
                            console.log(`${domain} 可能有库存`);
                        } else {
                            console.log(`${domain} 暂无库存`);
                        }
                        
                    } catch (error) {
                        console.error(`检查库存出错:`, error);
                    }
                }
            }
        }

        await browser.close();
    }
}

// const sourceCode = `
// test "Check Stock" {
//     open "https://bandwagonhost.com/cart.php?a=add&pid=145"
//     assert "stock" contains "Out of Stock"
// }
// `;

const sourceCode = `
test "Check Stock" {
    open "https://www.dmit.io/cart.php?a=add&pid=183"
    assert "stock" contains "Out of Stock"
}
`;

const lexer = new Lexer(sourceCode);
const tokens = lexer.tokenize();
const parser = new Parser(tokens);
const ast = parser.parse();
const runner = new Watcher(ast);
runner.run();
