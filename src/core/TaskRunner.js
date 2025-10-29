/**
 * 任务运行器类
 * 负责管理和执行任务队列
 */

import { Task } from './Task.js';
import { STOCK_STATUS } from '../constants/index.js';

export class TaskRunner {
    constructor(browserService, notificationService, logger) {
        this.browserService = browserService;
        this.notificationService = notificationService;
        this.logger = logger;
        this.tasks = [];
    }

    /**
     * 添加任务
     * @param {Object} product - 产品信息
     */
    addTask(product) {
        const task = new Task(product);
        this.tasks.push(task);
        return task;
    }

    /**
     * 执行所有任务
     * @param {Object} siteConfigs - 站点配置
     */
    async runAll(siteConfigs) {
        const headers = ['套餐名称', '检查状态', 'URL', '库存状态'];
        this.logger.printHeader(headers);

        for (let i = 0; i < this.tasks.length; i++) {
            const task = this.tasks[i];
            await this.runTask(task, siteConfigs);

            // 打印任务结果
            this.printTaskResult(task);

            // 如果不是最后一行，打印分隔线
            if (i < this.tasks.length - 1) {
                this.logger.printSeparator();
            }
        }
    }

    /**
     * 执行单个任务
     * @param {Task} task - 任务对象
     * @param {Object} siteConfigs - 站点配置
     */
    async runTask(task, siteConfigs) {
        task.start();

        try {
            const product = task.product;
            
            // 获取站点配置
            const siteConfig = this.getSiteConfig(product.site, siteConfigs);
            
            if (!siteConfig) {
                task.complete({
                    inStock: false,
                    message: STOCK_STATUS.CONFIG_ERROR,
                    url: product.url,
                    error: true
                });
                return;
            }

            // 执行库存检查
            const result = await this.browserService.checkStock(product, siteConfig);
            task.complete(result);

            // 如果有货，发送通知
            if (result.inStock && !result.error) {
                await this.notificationService.sendStockAlert(product, result.url);
            }

        } catch (error) {
            task.fail(error);
            this.logger.printError(`任务执行失败: ${task.getProductName()}`, error);
        }
    }

    /**
     * 获取站点配置
     * @param {string} site - 站点域名
     * @param {Object} siteConfigs - 所有站点配置
     * @returns {Object|null}
     */
    getSiteConfig(site, siteConfigs) {
        // 尝试直接匹配
        if (siteConfigs[site]) {
            return siteConfigs[site];
        }

        // 尝试匹配带 app. 前缀的域名
        const appSite = `app.${site}`;
        if (siteConfigs[appSite]) {
            return siteConfigs[appSite];
        }

        return null;
    }

    /**
     * 打印任务结果
     * @param {Task} task - 任务对象
     */
    printTaskResult(task) {
        const product = task.product;
        const result = task.result;

        let stockStatus = STOCK_STATUS.ERROR;
        if (result) {
            stockStatus = result.message;
        } else if (task.error) {
            stockStatus = `${STOCK_STATUS.ERROR}: ${task.error.message}`;
        }

        const row = [
            product.name,
            STOCK_STATUS.COMPLETED,
            result?.url || product.url,
            stockStatus
        ];

        this.logger.printRow(row);
    }

    /**
     * 获取所有任务
     * @returns {Task[]}
     */
    getTasks() {
        return this.tasks;
    }

    /**
     * 获取成功的任务数量
     * @returns {number}
     */
    getSuccessCount() {
        return this.tasks.filter(task => task.isSuccess()).length;
    }

    /**
     * 获取失败的任务数量
     * @returns {number}
     */
    getFailureCount() {
        return this.tasks.filter(task => task.status === 'failed').length;
    }

    /**
     * 获取有货的产品数量
     * @returns {number}
     */
    getInStockCount() {
        return this.tasks.filter(task =>
            task.result && task.result.inStock && !task.result.error
        ).length;
    }

    /**
     * 清空任务列表
     */
    clear() {
        this.tasks = [];
    }
}

