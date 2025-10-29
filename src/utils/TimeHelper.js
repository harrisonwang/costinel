/**
 * 时间工具类
 * 处理时间格式化和时区转换
 */

export class TimeHelper {
    /**
     * 获取中国时间（东八区）
     * @returns {string} 格式化的中国时间字符串
     */
    static getChinaTime() {
        return new Date().toLocaleString('zh-CN', {
            timeZone: 'Asia/Shanghai',
            hour12: false
        });
    }

    /**
     * 获取当前时间戳
     * @returns {number} 时间戳
     */
    static getTimestamp() {
        return Date.now();
    }

    /**
     * 格式化时间戳
     * @param {number} timestamp - 时间戳
     * @returns {string} 格式化的时间字符串
     */
    static formatTimestamp(timestamp) {
        return new Date(timestamp).toLocaleString('zh-CN', {
            timeZone: 'Asia/Shanghai',
            hour12: false
        });
    }
}

