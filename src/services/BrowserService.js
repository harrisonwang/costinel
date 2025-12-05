/**
 * 浏览器服务类
 * 封装 puppeteer-real-browser 浏览器操作
 */

import { connect } from 'puppeteer-real-browser';

export class BrowserService {
    constructor(config) {
        this.config = config;
        this.browser = null;
        this.page = null;
        this.initialized = false;
    }

    /**
     * 初始化浏览器
     */
    async initialize() {
        if (this.initialized) {
            return;
        }

        try {
            const { browser, page } = await connect({
                headless: this.config.headless !== undefined ? this.config.headless : false,
                turnstile: this.config.turnstile !== undefined ? this.config.turnstile : true,
                executablePath: this.config.executablePath,
                disableXvfb: this.config.disableXvfb !== undefined ? this.config.disableXvfb : false,
                customConfig: this.config.customConfig || {},
                connectOption: this.config.connectOption || { defaultViewport: null },
                ignoreAllFlags: this.config.ignoreAllFlags !== undefined ? this.config.ignoreAllFlags : false
            });

            this.browser = browser;
            this.page = page;
            this.initialized = true;
        } catch (error) {
            throw new Error(`浏览器初始化失败: ${error.message}`);
        }
    }

    /**
     * 创建新页面
     * @returns {Promise<Page>} Puppeteer 页面对象
     */
    async createPage() {
        if (!this.initialized) {
            await this.initialize();
        }

        // puppeteer-real-browser 已经在初始化时创建了一个页面
        // 我们可以复用它或创建新页面
        const page = await this.browser.newPage();
        
        // 设置用户代理
        if (this.config.userAgent) {
            await page.setUserAgent(this.config.userAgent);
        }

        return page;
    }

    /**
     * 检查产品库存状态
     * @param {Object} product - 产品信息
     * @param {Object} siteConfig - 站点配置
     * @returns {Promise<Object>} 检查结果 { inStock: boolean, message: string, url: string }
     */
    async checkStock(product, siteConfig) {
        const page = await this.createPage();

        try {
            // 打开产品页面,增加超时时间
            await page.goto(product.url, { 
                waitUntil: 'networkidle2', 
                timeout: 60000  // 增加到 60 秒,给反爬虫检测更多时间
            });

            // 等待页面加载和 JavaScript 执行
            await new Promise(resolve => setTimeout(resolve, siteConfig.waitTime || 5000));

            // 获取当前域名
            const currentUrl = page.url();
            const domain = await page.evaluate(() => {
                return window.location.hostname.replace(/^www\./, '');
            });

            // 检查库存状态
            const elementText = await page.evaluate((selector) => {
                const element = document.querySelector(selector);
                return element ? element.innerText : null;
            }, siteConfig.stockSelector);

            // 判断是否有货
            if (!elementText) {
                return {
                    inStock: false,
                    message: `未找到元素: ${siteConfig.stockSelector}`,
                    url: currentUrl,
                    error: true
                };
            }

            const outOfStock = elementText.includes(siteConfig.outOfStockText);
            const inStock = !outOfStock;

            return {
                inStock,
                message: inStock ? '√ 有货' : '[无货]',
                url: currentUrl,
                error: false
            };

        } catch (error) {
            // 特殊处理反爬虫检测错误
            if (error.message.includes('timeout') || error.message.includes('Navigation')) {
                return {
                    inStock: false,
                    message: `页面加载超时(可能遇到反爬虫): ${error.message.substring(0, 50)}`,
                    url: product.url,
                    error: true
                };
            }
            
            return {
                inStock: false,
                message: `检查失败: ${error.message}`,
                url: product.url,
                error: true
            };
        } finally {
            await page.close();
        }
    }

    /**
     * 关闭浏览器
     */
    async close() {
        if (this.browser) {
            try {
                // 关闭所有页面
                const pages = await this.browser.pages();
                for (const page of pages) {
                    await page.close();
                }
                
                // 关闭浏览器连接
                await this.browser.close();
            } catch (error) {
                console.error('关闭浏览器时出错:', error.message);
            } finally {
                this.browser = null;
                this.page = null;
                this.initialized = false;
            }
        }
    }

    /**
     * 检查浏览器是否已初始化
     * @returns {boolean}
     */
    isInitialized() {
        return this.initialized;
    }
}

