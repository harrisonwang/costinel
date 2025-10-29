/**
 * Costinel 应用主类
 * 应用程序的主要入口和控制器
 */

import { StockChecker } from './core/StockChecker.js';
import { config } from './config/index.js';

export class CostinelApp {
    constructor(customConfig = null) {
        this.config = customConfig || config;
        this.checker = null;
    }

    /**
     * 启动应用
     */
    async start() {
        try {
            console.log('🚀 Costinel 启动中...\n');
            
            // 创建库存检查器
            this.checker = new StockChecker(this.config);
            
            // 初始化
            await this.checker.initialize();
            
            // 执行检查
            await this.checker.run();
            
        } catch (error) {
            console.error('❌ 应用启动失败:', error.message);
            if (process.env.DEBUG) {
                console.error(error.stack);
            }
            throw error;
        }
    }

    /**
     * 停止应用并清理资源
     */
    async stop() {
        if (this.checker) {
            await this.checker.cleanup();
        }
        console.log('\n👋 Costinel 已停止');
    }

    /**
     * 运行一次检查（便捷方法）
     */
    static async runOnce(customConfig = null) {
        const app = new CostinelApp(customConfig);
        try {
            await app.start();
        } finally {
            await app.stop();
        }
    }
}

