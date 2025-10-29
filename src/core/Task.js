/**
 * 任务类
 * 表示单个产品的库存检查任务
 */

import { TASK_STATUS } from '../constants/index.js';

export class Task {
    constructor(product) {
        this.product = product;
        this.status = TASK_STATUS.PENDING;
        this.result = null;
        this.error = null;
        this.startTime = null;
        this.endTime = null;
    }

    /**
     * 标记任务开始
     */
    start() {
        this.status = TASK_STATUS.RUNNING;
        this.startTime = Date.now();
    }

    /**
     * 标记任务完成
     * @param {Object} result - 检查结果
     */
    complete(result) {
        this.status = TASK_STATUS.COMPLETED;
        this.result = result;
        this.endTime = Date.now();
    }

    /**
     * 标记任务失败
     * @param {Error} error - 错误对象
     */
    fail(error) {
        this.status = TASK_STATUS.FAILED;
        this.error = error;
        this.endTime = Date.now();
    }

    /**
     * 获取任务执行时长（毫秒）
     * @returns {number|null}
     */
    getDuration() {
        if (this.startTime && this.endTime) {
            return this.endTime - this.startTime;
        }
        return null;
    }

    /**
     * 检查任务是否完成（成功或失败）
     * @returns {boolean}
     */
    isFinished() {
        return this.status === TASK_STATUS.COMPLETED || this.status === TASK_STATUS.FAILED;
    }

    /**
     * 检查任务是否成功
     * @returns {boolean}
     */
    isSuccess() {
        return this.status === TASK_STATUS.COMPLETED && !this.result?.error;
    }

    /**
     * 获取产品名称
     * @returns {string}
     */
    getProductName() {
        return this.product.name;
    }

    /**
     * 获取产品 URL
     * @returns {string}
     */
    getProductUrl() {
        return this.product.url;
    }
}

