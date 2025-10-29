/**
 * 站点配置
 * 定义不同 VPS 商家的库存检测规则
 */

export const SITE_CONFIGS = {
    'bandwagonhost.com': {
        stockSelector: '#order-web20cart .errorbox',
        outOfStockText: 'Out of Stock',
        waitTime: 3000
    },
    'app.vmiss.com': {
        stockSelector: 'h2',
        outOfStockText: 'Out of Stock',
        waitTime: 3000
    },
    'dmit.io': {
        stockSelector: '#order-boxes h1',
        outOfStockText: 'Out of Stock',
        waitTime: 3000
    }
};

