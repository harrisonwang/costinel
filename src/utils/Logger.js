/**
 * 日志和表格渲染工具类
 * 负责格式化输出和表格显示
 */

import { TextHelper } from './TextHelper.js';
import { TimeHelper } from './TimeHelper.js';

export class Logger {
    constructor(columnWidths = [30, 15, 60, 12]) {
        this.columnWidths = columnWidths;
    }

    /**
     * 打印表格顶部边框
     */
    printTableTop() {
        const line = this.columnWidths.map(w => '─'.repeat(w)).join('─┬─');
        console.log(`┌─${line}─┐`);
    }

    /**
     * 打印表格底部边框
     */
    printTableBottom() {
        const line = this.columnWidths.map(w => '─'.repeat(w)).join('─┴─');
        console.log(`└─${line}─┘`);
    }

    /**
     * 打印表格分隔线
     */
    printSeparator() {
        const line = this.columnWidths.map(w => '─'.repeat(w)).join('─┼─');
        console.log(`├─${line}─┤`);
    }

    /**
     * 打印表格行
     * @param {string[]} columns - 列数据数组
     */
    printRow(columns) {
        const paddedColumns = columns.map((col, i) => {
            return TextHelper.padToWidth(col, this.columnWidths[i]);
        });
        console.log(`│ ${paddedColumns.join(' │ ')} │`);
    }

    /**
     * 打印表格头部
     * @param {string[]} headers - 表头数组
     */
    printHeader(headers) {
        this.printTableTop();
        this.printRow(headers);
        this.printSeparator();
    }

    /**
     * 打印开始信息
     */
    printStart() {
        console.log(`\n[${TimeHelper.getChinaTime()}] 开始检查库存...\n`);
    }

    /**
     * 打印完成信息
     */
    printComplete() {
        this.printTableBottom();
        console.log(`\n[${TimeHelper.getChinaTime()}] 库存检查完成\n${'='.repeat(130)}`);
    }

    /**
     * 打印错误信息
     * @param {string} message - 错误消息
     * @param {Error} error - 错误对象
     */
    printError(message, error) {
        console.error(`\n[错误] ${message}`);
        if (error) {
            console.error(`详情: ${error.message}`);
            if (process.env.DEBUG) {
                console.error(error.stack);
            }
        }
    }

    /**
     * 打印信息日志
     * @param {string} message - 日志消息
     */
    printInfo(message) {
        console.log(`[信息] ${message}`);
    }

    /**
     * 打印警告日志
     * @param {string} message - 警告消息
     */
    printWarn(message) {
        console.warn(`[警告] ${message}`);
    }
}

