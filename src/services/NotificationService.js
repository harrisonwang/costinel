/**
 * 通知服务类
 * 抽象通知层，支持多种通知渠道
 */

import { TelegramService } from './TelegramService.js';

export class NotificationService {
    constructor(config) {
        this.config = config;
        this.services = [];
        this.initialized = false;
    }

    /**
     * 初始化通知服务
     */
    initialize() {
        // 初始化 Telegram 服务
        if (this.config.telegram && this.config.telegram.botToken) {
            const telegramService = new TelegramService(this.config.telegram);
            telegramService.initialize();
            this.services.push({
                name: 'Telegram',
                service: telegramService
            });
        }

        // 未来可以在这里添加其他通知渠道
        // 例如：邮件、Discord、钉钉、企业微信等

        this.initialized = true;
    }

    /**
     * 发送库存通知到所有渠道
     * @param {Object} product - 产品信息
     * @param {string} url - 产品页面 URL
     * @returns {Promise<boolean>} 是否至少有一个渠道发送成功
     */
    async sendStockAlert(product, url) {
        if (!this.initialized) {
            console.warn('[通知] 通知服务未初始化');
            return false;
        }

        const results = await Promise.allSettled(
            this.services.map(({ name, service }) =>
                service.sendStockAlert(product, url)
                    .then(success => ({ name, success }))
            )
        );

        // 检查是否至少有一个成功
        const hasSuccess = results.some(result =>
            result.status === 'fulfilled' && result.value.success
        );

        return hasSuccess;
    }

    /**
     * 发送通用消息到所有渠道
     * @param {string} message - 消息内容
     * @returns {Promise<boolean>} 是否至少有一个渠道发送成功
     */
    async sendMessage(message) {
        if (!this.initialized) {
            console.warn('[通知] 通知服务未初始化');
            return false;
        }

        const results = await Promise.allSettled(
            this.services.map(({ service }) => service.sendMessage(message))
        );

        // 检查是否至少有一个成功
        const hasSuccess = results.some(result =>
            result.status === 'fulfilled' && result.value
        );

        return hasSuccess;
    }

    /**
     * 发送错误通知
     * @param {string} errorMessage - 错误信息
     * @returns {Promise<boolean>} 是否至少有一个渠道发送成功
     */
    async sendErrorAlert(errorMessage) {
        if (!this.initialized) {
            return false;
        }

        const results = await Promise.allSettled(
            this.services.map(({ service }) => {
                if (service.sendErrorAlert) {
                    return service.sendErrorAlert(errorMessage);
                }
                return Promise.resolve(false);
            })
        );

        const hasSuccess = results.some(result =>
            result.status === 'fulfilled' && result.value
        );

        return hasSuccess;
    }

    /**
     * 获取已启用的通知渠道列表
     * @returns {string[]} 渠道名称列表
     */
    getEnabledServices() {
        return this.services.map(s => s.name);
    }
}

