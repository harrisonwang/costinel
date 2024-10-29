# VPS Watcher

A VPS stock monitoring tool based on Node.js and Puppeteer, supporting custom DSL syntax to describe monitoring tasks.

## Currently Supported Providers

- Bandwagonhost
- DMIT.io

## Features

- Real browser simulation based on Puppeteer
- Custom DSL syntax for writing monitoring rules
- Support for multiple provider configurations
- Custom selectors and text matching
- Wait time and error handling support

## Requirements

- Node.js >= 14
- npm or yarn

## Quick Start

1. Clone Repository

```bash
git clone https://github.com/harrisonwang/vps-watcher.git
cd vps-watcher
```

2. Install Dependencies

```bash
npm install
```

3. Write Monitoring Rules

```dsl
test "Check Bandwagonhost Stock" {
    open "https://bandwagonhost.com/cart.php?a=add&pid=145"
    assert "stock" contains "Out of Stock"
}
```

1. Start Monitoring

```bash
npm start
```

## DSL Syntax Guide

Supported Commands:

- `test`: Define a test case
- `open`: Open specified URL
- `click`: Click specified element
- `input`: Input text
- `assert`: Assertion check

Example:

```dsl
test "Check Bandwagonhost Stock" {
    open "https://bandwagonhost.com/cart.php?a=add&pid=145"
    assert "stock" contains "Out of Stock"
}
```

## Website Configuration

Current website configurations are located in `src/index.js` under `SITE_CONFIGS`:

```javascript

const SITE_CONFIGS = {
    'bandwagonhost.com': {
        stockSelector: '#order-web20cart .errorbox',
        outOfStockText: 'Out of Stock'
    },
    'dmit.io': {
        stockSelector: '#order-boxes h1',
        outOfStockText: 'Out of Stock'
    }
};
```

## Development

Project Structure:

- `src/lexer.js`: DSL lexical analyzer
- `src/parser.js`: DSL parser
- `src/index.js`: Main program and website configurations

## FAQ

1. **How to add a new provider?**
   - Add new configuration in `SITE_CONFIGS`
   - Configure corresponding selector and matching text

2. **How to adjust check interval?**
   - Currently fixed at 3 seconds, can be modified in `src/index.js`

## Contributing

Pull Requests and Issues are welcome!

## Author

Harrison Wang

## License

MIT License
