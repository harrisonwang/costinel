import TelegramBot from 'node-telegram-bot-api';
import { TELEGRAM_CONFIG } from '../telegram.config.js';

class TelegramService {
    constructor() {
        this.bot = new TelegramBot(TELEGRAM_CONFIG.botToken, { polling: false });
    }

    async sendMessage(message) {
        try {
            await this.bot.sendMessage(TELEGRAM_CONFIG.chatId, message, {
                parse_mode: 'HTML',
                disable_web_page_preview: false
            });
        } catch (error) {
            console.error('Telegram 发送消息失败:', error);
        }
    }
}

export default new TelegramService();
