/**
 * 统一配置导出
 */

import { PRODUCTS } from './products.config.js';
import { SITE_CONFIGS } from './sites.config.js';
import { TELEGRAM_CONFIG } from './telegram.config.js';

export const config = {
    // 产品配置
    products: PRODUCTS,
    
    // 站点配置
    sites: SITE_CONFIGS,
    
    // Telegram 配置
    telegram: TELEGRAM_CONFIG,
    
    // 浏览器配置
    browser: {
        // puppeteer-real-browser 配置
        headless: false,                    // 使用有头模式(通过 Xvfb)
        turnstile: true,                   // 自动处理 Cloudflare Turnstile
        executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
        disableXvfb: false,                // 启用 Xvfb 虚拟显示
        customConfig: {},
        connectOption: {
            defaultViewport: null
        },
        ignoreAllFlags: false,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
    },
    
    // 检查间隔（毫秒）
    checkInterval: parseInt(process.env.CHECK_INTERVAL || '300000', 10),
    
    // 日志级别
    logLevel: process.env.LOG_LEVEL || 'info'
};

