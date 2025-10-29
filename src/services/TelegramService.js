/**
 * Telegram 服务类
 * 负责处理 Telegram 消息发送
 */

import TelegramBot from 'node-telegram-bot-api';
import { TimeHelper } from '../utils/TimeHelper.js';

export class TelegramService {
    constructor(config) {
        this.config = config;
        this.bot = null;
        this.initialized = false;
    }

    /**
     * 初始化 Telegram Bot
     */
    initialize() {
        if (!this.config.botToken || !this.config.chatId) {
            throw new Error('Telegram 配置不完整，请检查 BOT_TOKEN 和 CHAT_ID');
        }

        this.bot = new TelegramBot(this.config.botToken, { polling: false });
        this.initialized = true;
    }

    /**
     * 发送消息
     * @param {string} message - 消息内容
     * @returns {Promise<boolean>} 是否发送成功
     */
    async sendMessage(message) {
        if (!this.initialized) {
            console.error('[Telegram] 服务未初始化');
            return false;
        }

        try {
            await this.bot.sendMessage(this.config.chatId, message, {
                parse_mode: this.config.parseMode || 'HTML',
                disable_web_page_preview: this.config.disableWebPagePreview || false
            });
            return true;
        } catch (error) {
            console.error('[Telegram] 发送消息失败:', error.message);
            return false;
        }
    }

    /**
     * 发送库存通知
     * @param {Object} product - 产品信息
     * @param {string} url - 产品页面 URL
     * @returns {Promise<boolean>} 是否发送成功
     */
    async sendStockAlert(product, url) {
        const message = `
🎉 <b>${product.site}</b> 有库存啦！

📦 套餐名称: ${product.name}
🔗 产品链接: ${url}
⏰ 检测时间: ${TimeHelper.getChinaTime()}

快去抢购吧！
`;
        return await this.sendMessage(message);
    }

    /**
     * 发送错误通知（可选）
     * @param {string} errorMessage - 错误信息
     * @returns {Promise<boolean>} 是否发送成功
     */
    async sendErrorAlert(errorMessage) {
        const message = `
⚠️ <b>Costinel 监控异常</b>

错误信息: ${errorMessage}
发生时间: ${TimeHelper.getChinaTime()}
`;
        return await this.sendMessage(message);
    }
}

