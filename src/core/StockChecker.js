/**
 * 库存检查器类
 * 核心业务逻辑，负责协调各个服务完成库存检查
 */

import { BrowserService } from '../services/BrowserService.js';
import { NotificationService } from '../services/NotificationService.js';
import { Logger } from '../utils/Logger.js';
import { TaskRunner } from './TaskRunner.js';

export class StockChecker {
    constructor(config) {
        this.config = config;
        this.browserService = null;
        this.notificationService = null;
        this.logger = null;
        this.taskRunner = null;
        this.initialized = false;
    }

    /**
     * 初始化检查器
     */
    async initialize() {
        if (this.initialized) {
            return;
        }

        try {
            // 初始化日志器
            this.logger = new Logger();

            // 初始化浏览器服务
            this.browserService = new BrowserService(this.config.browser);
            await this.browserService.initialize();

            // 初始化通知服务
            this.notificationService = new NotificationService(this.config);
            this.notificationService.initialize();

            // 初始化任务运行器
            this.taskRunner = new TaskRunner(
                this.browserService,
                this.notificationService,
                this.logger
            );

            this.initialized = true;

            // 打印启用的通知渠道
            const enabledServices = this.notificationService.getEnabledServices();
            if (enabledServices.length > 0) {
                this.logger.printInfo(`已启用通知渠道: ${enabledServices.join(', ')}`);
            } else {
                this.logger.printWarn('未配置任何通知渠道');
            }

        } catch (error) {
            throw new Error(`初始化失败: ${error.message}`);
        }
    }

    /**
     * 执行一次库存检查
     */
    async run() {
        if (!this.initialized) {
            throw new Error('检查器未初始化，请先调用 initialize()');
        }

        this.logger.printStart();

        try {
            // 清空之前的任务
            this.taskRunner.clear();

            // 为每个产品创建任务
            for (const product of this.config.products) {
                this.taskRunner.addTask(product);
            }

            // 执行所有任务
            await this.taskRunner.runAll(this.config.sites);

            // 打印完成信息
            this.logger.printComplete();

            // 打印统计信息
            this.printSummary();

        } catch (error) {
            this.logger.printError('执行检查时发生错误', error);
            throw error;
        }
    }

    /**
     * 打印统计摘要
     */
    printSummary() {
        const totalTasks = this.taskRunner.getTasks().length;
        const successCount = this.taskRunner.getSuccessCount();
        const failureCount = this.taskRunner.getFailureCount();
        const inStockCount = this.taskRunner.getInStockCount();

        console.log(`\n📊 统计信息:`);
        console.log(`   总任务数: ${totalTasks}`);
        console.log(`   检查成功: ${successCount}`);
        console.log(`   检查失败: ${failureCount}`);
        console.log(`   有货产品: ${inStockCount}`);

        if (inStockCount > 0) {
            console.log(`\n🎉 发现 ${inStockCount} 个产品有货，已发送通知！`);
        }
    }

    /**
     * 清理资源
     */
    async cleanup() {
        if (this.browserService) {
            await this.browserService.close();
        }
    }

    /**
     * 获取配置
     * @returns {Object}
     */
    getConfig() {
        return this.config;
    }

    /**
     * 检查是否已初始化
     * @returns {boolean}
     */
    isInitialized() {
        return this.initialized;
    }
}

