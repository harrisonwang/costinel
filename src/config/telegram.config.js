/**
 * Telegram 配置
 */

import dotenv from 'dotenv';
dotenv.config();

export const TELEGRAM_CONFIG = {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    chatId: process.env.TELEGRAM_CHAT_ID,
    parseMode: 'HTML',
    disableWebPagePreview: false
};

// 验证必要的环境变量
if (!TELEGRAM_CONFIG.botToken || !TELEGRAM_CONFIG.chatId) {
    throw new Error('请在 .env 文件中设置 TELEGRAM_BOT_TOKEN 和 TELEGRAM_CHAT_ID 环境变量');
}

