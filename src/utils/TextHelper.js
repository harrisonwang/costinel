/**
 * 文本处理工具类
 * 处理文本宽度计算和填充
 */

export class TextHelper {
    /**
     * 计算字符串的显示宽度（中文字符算2个宽度，ASCII算1个）
     * @param {string} str - 输入字符串
     * @returns {number} 显示宽度
     */
    static getDisplayWidth(str) {
        let width = 0;
        for (const char of str) {
            const code = char.charCodeAt(0);
            // ASCII 字符宽度为 1
            if (code <= 127) {
                width += 1;
            } else {
                // 中文及其他宽字符为 2
                width += 2;
            }
        }
        return width;
    }

    /**
     * 填充字符串到指定显示宽度
     * @param {string} str - 输入字符串
     * @param {number} targetWidth - 目标宽度
     * @returns {string} 填充后的字符串
     */
    static padToWidth(str, targetWidth) {
        const displayWidth = this.getDisplayWidth(str);
        
        if (displayWidth > targetWidth) {
            // 需要截断
            return this.truncateToWidth(str, targetWidth);
        } else {
            // 填充空格到目标宽度
            const paddingNeeded = targetWidth - displayWidth;
            return str + ' '.repeat(Math.max(0, paddingNeeded));
        }
    }

    /**
     * 截断字符串到指定宽度并添加省略号
     * @param {string} str - 输入字符串
     * @param {number} targetWidth - 目标宽度
     * @returns {string} 截断后的字符串
     */
    static truncateToWidth(str, targetWidth) {
        let truncated = '';
        let currentWidth = 0;
        
        for (const char of str) {
            const charWidth = char.charCodeAt(0) <= 127 ? 1 : 2;
            if (currentWidth + charWidth + 3 > targetWidth) {
                break;
            }
            truncated += char;
            currentWidth += charWidth;
        }
        
        const dotsWidth = 3; // "..." 的宽度
        const paddingNeeded = targetWidth - currentWidth - dotsWidth;
        return truncated + '...' + ' '.repeat(Math.max(0, paddingNeeded));
    }
}

