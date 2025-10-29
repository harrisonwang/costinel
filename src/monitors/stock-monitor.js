/**
 * 股票监控模块
 * 复用 Costinel 的通知服务和配置管理
 */

import { stocks } from "stock-api";
import dayjs from 'dayjs';
import telegramService from '../services/telegram.js';

class StockMonitor {
    constructor(config) {
        this.config = config;
        this.cache = new Map(); // 用于去重通知
    }

    /**
     * 带重试的股票数据获取
     */
    async fetchStockData(code, retries = 3) {
        for (let i = 0; i < retries; i++) {
            try {
                return await stocks.tencent.getStock(code);
            } catch (error) {
                if (i === retries - 1) throw error;
                await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
            }
        }
    }

    /**
     * 获取节假日数据
     */
    async getHolidayData(year) {
        const url = `https://raw.githubusercontent.com/NateScarlet/holiday-cn/master/${year}.json`;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error(`获取节假日数据失败: ${error.message}`);
            return null;
        }
    }

    /**
     * 判断是否为交易日和交易时间
     */
    async isMarketOpen() {
        const now = dayjs();
        const year = now.year();
        const holidayData = await this.getHolidayData(year);

        // 周末检查
        if (now.day() === 0 || now.day() === 6) {
            return { open: false, reason: '周末休市' };
        }

        // 节假日检查
        if (holidayData?.days) {
            const formattedDate = now.format('YYYY-MM-DD');
            const holiday = holidayData.days.find(
                day => day.date === formattedDate && day.isOffDay
            );
            if (holiday) {
                return { open: false, reason: `${holiday.name}休市` };
            }
        }

        // 交易时间检查
        const hour = now.hour();
        const minute = now.minute();
        const time = hour * 100 + minute;
        const isTradingTime = (time >= 930 && time <= 1130) || (time >= 1300 && time <= 1500);

        if (!isTradingTime) {
            return { open: false, reason: '非交易时间' };
        }

        return { open: true };
    }

    /**
     * 检查条件是否触发
     */
    checkConditions(data, conditions) {
        const percent = (data.percent * 100).toFixed(2);
        const triggered = [];

        for (const condition of conditions) {
            let match = false;

            switch (condition.type) {
                case 'below':
                    match = data.now < condition.value;
                    break;
                case 'above':
                    match = data.now > condition.value;
                    break;
                case 'change_up':
                    match = parseFloat(percent) >= condition.value;
                    break;
                case 'change_down':
                    match = parseFloat(percent) <= -condition.value;
                    break;
                case 'range':
                    match = data.now >= condition.min && data.now <= condition.max;
                    break;
            }

            if (match) {
                triggered.push(condition);
            }
        }

        return triggered;
    }

    /**
     * 生成通知消息
     */
    formatMessage(data, triggeredConditions) {
        const percent = (data.percent * 100).toFixed(2);
        const alerts = triggeredConditions.map(c => `⚠️ ${c.message || this.getDefaultMessage(c)}`).join('\n');

        return `
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

⏰ ${dayjs().format('YYYY-MM-DD HH:mm:ss')}
`;
    }

    /**
     * 获取默认条件消息
     */
    getDefaultMessage(condition) {
        switch (condition.type) {
            case 'below':
                return `价格低于 ¥${condition.value}`;
            case 'above':
                return `价格突破 ¥${condition.value}`;
            case 'change_up':
                return `涨幅超过 ${condition.value}%`;
            case 'change_down':
                return `跌幅超过 ${condition.value}%`;
            case 'range':
                return `价格在 ¥${condition.min} - ¥${condition.max} 区间`;
            default:
                return '条件触发';
        }
    }

    /**
     * 检查是否需要通知（防止重复）
     */
    shouldNotify(stockCode, conditionKey, cooldown = 3600000) {
        const cacheKey = `${stockCode}:${conditionKey}`;
        const lastNotify = this.cache.get(cacheKey);

        if (!lastNotify) {
            this.cache.set(cacheKey, Date.now());
            return true;
        }

        if (Date.now() - lastNotify > cooldown) {
            this.cache.set(cacheKey, Date.now());
            return true;
        }

        return false;
    }

    /**
     * 监控单个股票
     */
    async monitorStock(stockConfig) {
        try {
            const data = await this.fetchStockData(stockConfig.code);
            const triggeredConditions = this.checkConditions(data, stockConfig.conditions);

            console.log(`📊 ${data.name} (${data.code}): ¥${data.now} (${(data.percent * 100).toFixed(2)}%)`);

            if (triggeredConditions.length > 0) {
                // 检查冷却时间
                const conditionKey = triggeredConditions.map(c => `${c.type}:${c.value}`).join(',');

                if (this.shouldNotify(stockConfig.code, conditionKey, stockConfig.cooldown || 3600000)) {
                    const message = this.formatMessage(data, triggeredConditions);
                    await telegramService.sendMessage(message);
                    console.log(`   🔔 已发送通知 (${triggeredConditions.length} 个条件)`);
                } else {
                    console.log(`   ⏰ 冷却中，跳过通知`);
                }
            } else {
                console.log(`   ✓ 未触发条件`);
            }

            return { success: true, data };
        } catch (error) {
            console.error(`❌ ${stockConfig.code} 监控失败: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    /**
     * 执行监控任务
     */
    async run() {
        console.log(`\n${'='.repeat(80)}`);
        console.log(`📈 股票监控开始 - ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`);
        console.log('='.repeat(80));

        // 检查市场状态
        const marketStatus = await this.isMarketOpen();
        if (!marketStatus.open) {
            console.log(`⏸️  ${marketStatus.reason}，跳过监控\n`);
            return { skipped: true, reason: marketStatus.reason };
        }

        console.log('✅ 市场开放中\n');

        // 并发监控所有股票
        const results = await Promise.allSettled(
            this.config.stocks.map(stock => this.monitorStock(stock))
        );

        // 统计结果
        const stats = {
            total: results.length,
            success: results.filter(r => r.status === 'fulfilled' && r.value?.success).length,
            failed: results.filter(r => r.status === 'rejected' || !r.value?.success).length
        };

        console.log(`\n${'='.repeat(80)}`);
        console.log(`📊 监控完成: 成功 ${stats.success}/${stats.total} | 失败 ${stats.failed}`);
        console.log('='.repeat(80)}\n`);

        return stats;
    }
}

export default StockMonitor;
