/**
 * 浏览器服务类
 * 封装 Puppeteer 浏览器操作
 */

import puppeteer from 'puppeteer';

export class BrowserService {
    constructor(config) {
        this.config = config;
        this.browser = null;
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
            this.browser = await puppeteer.launch({
                headless: this.config.headless !== false,
                args: this.config.args || ['--no-sandbox', '--disable-setuid-sandbox']
            });
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
            // 打开产品页面
            await page.goto(product.url, { waitUntil: 'networkidle2', timeout: 30000 });

            // 等待页面加载
            await new Promise(resolve => setTimeout(resolve, siteConfig.waitTime || 3000));

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
            await this.browser.close();
            this.browser = null;
            this.initialized = false;
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

