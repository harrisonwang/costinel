export const PRODUCTS = [
    {
        name: 'BWH CN2 GIA',
        url: 'https://bandwagonhost.com/cart.php?a=add&pid=145',
        site: 'bandwagonhost.com'
    },
    {
        name: 'DMIT CN2 GIA',
        url: 'https://www.dmit.io/cart.php?a=add&pid=183',
        site: 'dmit.io'
    }
];

export const SITE_CONFIGS = {
    'bandwagonhost.com': {
        stockSelector: '#order-web20cart .errorbox',
        outOfStockText: 'Out of Stock'
    },
    'dmit.io': {
        stockSelector: '#order-boxes h1',
        outOfStockText: 'Out of Stock'
    }
};
