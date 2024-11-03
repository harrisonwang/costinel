# VPS Watcher

[English](README.md) | [中文](README_zh.md)

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
- Telegram notifications support
- Environment variables configuration

## Requirements

- Node.js >= 20
- npm or yarn
- Telegram Bot Token (for notifications)

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

3. Configure Environment Variables

```bash
cp .env.example .env
# Edit .env file with your Telegram bot token and chat ID
vim .env
```

4. Write Monitoring Rules

```dsl
test "Check Bandwagonhost Stock" {
    open "https://bandwagonhost.com/cart.php?a=add&pid=145"
    assert "stock" contains "Out of Stock"
}
```

5. Start Monitoring

```bash
npm start
```

## Environment Variables

Create a `.env` file in the project root:

```bash
# Telegram Configuration
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here

# Monitor Configuration
CHECK_INTERVAL=300  # check interval in seconds
```

## Telegram Bot Setup

1. Create a new bot:
   - Contact @BotFather on Telegram
   - Use the `/newbot` command
   - Save the bot token

2. Get your chat ID:
   - Send a message to your bot
   - Visit: `https://api.telegram.org/bot<YourBOTToken>/getUpdates`
   - Find your `chat.id` in the response

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

Current website configurations are located in `src/config.js`:

```javascript
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
```

## Development

Project Structure:

- `src/lexer.js`: DSL lexical analyzer
- `src/parser.js`: DSL parser
- `src/index.js`: Main program
- `src/config.js`: Website configurations
- `src/services/telegram.js`: Telegram notification service
- `scripts/vps-watcher.sh`: Execution script

## Crontab Setup

Add to crontab for automatic checking:

```bash
# Check every 5 minutes
*/5 * * * * /path/to/vps-watcher/scripts/vps-watcher.sh
```

## FAQ

1. **How to add a new provider?**
   - Add new configuration in `SITE_CONFIGS`
   - Configure corresponding selector and matching text

2. **How to adjust check interval?**
   - Modify CHECK_INTERVAL in .env file
   - Update crontab schedule if using cron

3. **Telegram notifications not working?**
   - Verify bot token and chat ID in .env
   - Check bot permissions
   - Review application logs

## Contributing

Pull Requests and Issues are welcome!

## Author

Harrison Wang

## License

MIT License
