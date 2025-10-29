import { stocks } from "stock-api";
import fetch from 'node-fetch';
import dayjs from 'dayjs';
import dotenv from 'dotenv';

dotenv.config();

// ==================== 配置管理 ====================
const CONFIG = {
    telegram: {
        botToken: process.env.TELEGRAM_BOT_TOKEN,
        chatId: process.env.TELEGRAM_CHAT_ID
    },
    stocks: [
        {
            code: "SZ002261",
            name: "拓维信息",
            conditions: [
                { type: 'below', price: 10, message: '价格低于 10 元' },
                { type: 'above', price: 15, message: '价格突破 15 元' },
                { type: 'change', percent: 5, message: '涨幅超过 5%' },
                { type: 'change', percent: -5, message: '跌幅超过 5%' }
            ]
        },
        // 可以添加更多股票
        // {
        //     code: "SH600519",
        //     name: "贵州茅台",
        //     conditions: [...]
        // }
    ],
    retry: {
        maxAttempts: 3,
        delay: 2000
    }
};

// ==================== 工具函数 ====================

/**
 * 带重试的 fetch
 */
async function fetchWithRetry(url, options = {}, attempts = CONFIG.retry.maxAttempts) {
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        if (attempts <= 1) {
            throw error;
        }
        console.log(`请求失败，${CONFIG.retry.delay}ms 后重试... (剩余 ${attempts - 1} 次)`);
        await sleep(CONFIG.retry.delay);
        return fetchWithRetry(url, options, attempts - 1);
    }
}

/**
 * 延迟函数
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ==================== 交易日判断 ====================

/**
 * 获取指定年份的节假日数据
 */
async function getHolidayData(year) {
    const url = `https://raw.githubusercontent.com/NateScarlet/holiday-cn/master/${year}.json`;
    try {
        return await fetchWithRetry(url);
    } catch (error) {
        console.error(`获取节假日数据失败: ${error.message}`);
        return null;
    }
}

/**
 * 判断当前是否为交易日
 */
async function isMarketOpen() {
    const now = dayjs();
    const year = now.year();
    const holidayData = await getHolidayData(year);

    if (!holidayData?.days) {
        console.error('节假日数据加载失败，假设市场开放');
        return true;
    }

    // 周末检查
    const isWeekend = now.day() === 6 || now.day() === 0;
    if (isWeekend) {
        console.log('⏸️  周末休市');
        return false;
    }

    // 节假日检查
    const formattedDate = now.format('YYYY-MM-DD');
    const holiday = holidayData.days.find(
        day => day.date === formattedDate && day.isOffDay
    );

    if (holiday) {
        console.log(`⏸️  ${holiday.name}休市`);
        return false;
    }

    // 检查交易时间（9:30-11:30, 13:00-15:00）
    const hour = now.hour();
    const minute = now.minute();
    const time = hour * 100 + minute;

    const isTradingTime = (time >= 930 && time <= 1130) || (time >= 1300 && time <= 1500);

    if (!isTradingTime) {
        console.log('⏸️  非交易时间段');
        return false;
    }

    return true;
}

// ==================== Telegram 通知 ====================

/**
 * 发送 Telegram 通知（带重试）
 */
async function notifyTelegram(message) {
    const url = `https://api.telegram.org/bot${CONFIG.telegram.botToken}/sendMessage`;

    const payload = {
        chat_id: CONFIG.telegram.chatId,
        text: message,
        parse_mode: 'HTML'
    };

    try {
        await fetchWithRetry(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        console.log('✅ Telegram 通知发送成功');
    } catch (error) {
        console.error(`❌ Telegram 通知发送失败: ${error.message}`);
    }
}

// ==================== 股票监控 ====================

/**
 * 检查单个股票
 */
async function checkStock(stockConfig) {
    try {
        const data = await stocks.tencent.getStock(stockConfig.code);
        const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
        const percent = (data.percent * 100).toFixed(2);

        console.log(`\n📊 ${data.name} (${data.code.toLowerCase()})`);
        console.log(`   当前价格: ¥${data.now}`);
        console.log(`   涨跌幅: ${percent > 0 ? '+' : ''}${percent}%`);

        // 检查所有条件
        const triggeredConditions = [];

        for (const condition of stockConfig.conditions) {
            let triggered = false;

            switch (condition.type) {
                case 'below':
                    triggered = data.now < condition.price;
                    break;
                case 'above':
                    triggered = data.now > condition.price;
                    break;
                case 'change':
                    const currentPercent = parseFloat(percent);
                    if (condition.percent > 0) {
                        triggered = currentPercent >= condition.percent;
                    } else {
                        triggered = currentPercent <= condition.percent;
                    }
                    break;
            }

            if (triggered) {
                triggeredConditions.push(condition);
            }
        }

        // 发送通知
        if (triggeredConditions.length > 0) {
            const alerts = triggeredConditions.map(c => `⚠️ ${c.message}`).join('\n');
            const message = `
🔔 <b>股票提醒</b>

📈 <b>${data.name}</b> (${data.code.toLowerCase()})
━━━━━━━━━━━━━━━━━━━━━━

💰 当前价格: <b>¥${data.now}</b>
📊 涨跌幅: <b>${percent > 0 ? '+' : ''}${percent}%</b>

昨收: ¥${data.yesterday}
今开: ¥${data.open}
最高: ¥${data.high}
最低: ¥${data.low}

<b>触发条件:</b>
${alerts}

⏰ ${now}
`;
            await notifyTelegram(message);
            console.log(`   🔔 已触发 ${triggeredConditions.length} 个条件`);
        } else {
            console.log(`   ✓ 未触发任何条件`);
        }

        return { success: true, data };
    } catch (error) {
        console.error(`❌ 获取股票 ${stockConfig.code} 数据失败: ${error.message}`);
        return { success: false, error: error.message };
    }
}

/**
 * 监控所有股票
 */
async function monitorStocks() {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`🚀 股票监控开始 - ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`);
    console.log('='.repeat(50));

    // 检查市场是否开放
    const marketOpen = await isMarketOpen();
    if (!marketOpen) {
        console.log('\n💤 市场未开放，跳过本次检查\n');
        return;
    }

    console.log('✅ 市场开放中\n');

    // 并发检查所有股票
    const results = await Promise.allSettled(
        CONFIG.stocks.map(stock => checkStock(stock))
    );

    // 统计结果
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failCount = results.length - successCount;

    console.log(`\n${'='.repeat(50)}`);
    console.log(`📊 监控完成: 成功 ${successCount} | 失败 ${failCount}`);
    console.log('='.repeat(50)}\n`);
}

// ==================== 入口 ====================

// 验证配置
if (!CONFIG.telegram.botToken || !CONFIG.telegram.chatId) {
    console.error('❌ 错误: 请在 .env 文件中配置 TELEGRAM_BOT_TOKEN 和 TELEGRAM_CHAT_ID');
    process.exit(1);
}

// 执行监控
monitorStocks().catch(error => {
    console.error('❌ 程序异常:', error);
    process.exit(1);
});
