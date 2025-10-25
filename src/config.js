export const PRODUCTS = [
    {
        name: 'The DC9 Plan',
        url: 'https://bandwagonhost.com/cart.php?a=add&pid=145',
        site: 'bandwagonhost.com'
    },
    {
        name: 'NODESEEK-BIGGERBOX-PRO',
        url: 'https://bandwagonhost.com/cart.php?a=add&pid=156',
        site: 'bandwagonhost.com'
    },
    {
        name: 'CN.HK.BGP.V3',
        url: 'https://app.vmiss.com/store/cn-hk-bgp-v3/basic',
        site: 'vmiss.com'
    },
    {
        name: 'LAX.Pro.WEE',
        url: 'https://www.dmit.io/cart.php?a=add&pid=183',
        site: 'dmit.io'
    }
];

export const SITE_CONFIGS = {
    'bandwagonhost.com': {
        stockSelector: '#order-web20cart .errorbox',
        outOfStockText: 'Out of Stock'
    },
    'app.vmiss.com': {
        stockSelector: 'h2',
        outOfStockText: 'Out of Stock'
    },
    'dmit.io': {
        stockSelector: '#order-boxes h1',
        outOfStockText: 'Out of Stock'
    }
};
