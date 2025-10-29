#!/usr/bin/env node

/**
 * 独立的股票监控入口
 * 可以单独运行，不依赖 VPS 监控
 */

import StockMonitor from './monitors/stock-monitor.js';
import { STOCK_CONFIG } from './config/stock.config.js';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 验证配置
function validateConfig() {
    if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
        console.error('❌ 错误: 请在 .env 文件中配置 TELEGRAM_BOT_TOKEN 和 TELEGRAM_CHAT_ID');
        return false;
    }

    if (!STOCK_CONFIG.stocks || STOCK_CONFIG.stocks.length === 0) {
        console.error('❌ 错误: 请在 src/config/stock.config.js 中配置要监控的股票');
        return false;
    }

    return true;
}

// 主函数
async function main() {
    try {
        // 验证配置
        if (!validateConfig()) {
            process.exit(1);
        }

        // 创建监控实例
        const monitor = new StockMonitor(STOCK_CONFIG);

        // 执行监控
        const result = await monitor.run();

        // 处理结果
        if (result.skipped) {
            console.log(`ℹ️  ${result.reason}`);
            process.exit(0);
        }

        if (result.failed > 0) {
            console.error(`⚠️  部分监控失败: ${result.failed}/${result.total}`);
            process.exit(1);
        }

        console.log('✅ 所有股票监控完成');
        process.exit(0);

    } catch (error) {
        console.error('❌ 执行出错:', error);
        process.exit(1);
    }
}

// 处理未捕获的异常
process.on('unhandledRejection', (error) => {
    console.error('❌ 未处理的 Promise 拒绝:', error);
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    console.error('❌ 未捕获的异常:', error);
    process.exit(1);
});

// 执行
main();
