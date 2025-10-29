/**
 * 股票监控配置
 */

export const STOCK_CONFIG = {
    // 监控的股票列表
    stocks: [
        {
            code: "SZ002261",
            name: "拓维信息",
            cooldown: 3600000, // 1小时内不重复通知同一条件
            conditions: [
                {
                    type: 'below',
                    value: 10,
                    message: '💰 价格低于 10 元，建议关注'
                },
                {
                    type: 'above',
                    value: 15,
                    message: '🚀 价格突破 15 元，注意风险'
                },
                {
                    type: 'change_up',
                    value: 5,
                    message: '📈 涨幅超过 5%'
                },
                {
                    type: 'change_down',
                    value: 5,
                    message: '📉 跌幅超过 5%'
                },
                {
                    type: 'range',
                    min: 9.5,
                    max: 10.5,
                    message: '🎯 价格进入目标区间 (9.5-10.5)'
                }
            ]
        },
        // 可以添加更多股票
        // {
        //     code: "SH600519",
        //     name: "贵州茅台",
        //     cooldown: 1800000, // 30分钟
        //     conditions: [
        //         {
        //             type: 'below',
        //             value: 1500,
        //             message: '茅台价格低于 1500 元'
        //         },
        //         {
        //             type: 'change_up',
        //             value: 3,
        //             message: '茅台涨幅超过 3%'
        //         }
        //     ]
        // }
    ]
};

// 条件类型说明
export const CONDITION_TYPES = {
    below: '价格低于指定值',
    above: '价格高于指定值',
    change_up: '涨幅超过指定百分比',
    change_down: '跌幅超过指定百分比',
    range: '价格在指定区间内'
};
