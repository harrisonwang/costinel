/**
 * 常量定义
 */

// 库存状态
export const STOCK_STATUS = {
    IN_STOCK: '√ 有货',
    OUT_OF_STOCK: '[无货]',
    ERROR: '! 错误',
    CONFIG_ERROR: 'X 配置错误',
    CHECKING: '[检查中...]',
    COMPLETED: '[已完成]'
};

// 任务状态
export const TASK_STATUS = {
    PENDING: 'pending',
    RUNNING: 'running',
    COMPLETED: 'completed',
    FAILED: 'failed'
};

// 默认配置
export const DEFAULTS = {
    WAIT_TIME: 3000,
    CHECK_INTERVAL: 300000,
    LOG_LEVEL: 'info'
};

