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
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36'
    },
    
    // 检查间隔（毫秒）
    checkInterval: parseInt(process.env.CHECK_INTERVAL || '300000', 10),
    
    // 日志级别
    logLevel: process.env.LOG_LEVEL || 'info'
};

