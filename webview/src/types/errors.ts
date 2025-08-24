// Error types for the application
export interface AppError {
    code: string;
    message: string;
    details?: any;
    retryable?: boolean;
    timestamp?: Date;
}

export enum ErrorCodes {
    NETWORK_ERROR = 'NETWORK_ERROR',
    AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    JIRA_API_ERROR = 'JIRA_API_ERROR',
    TIMEOUT_ERROR = 'TIMEOUT_ERROR',
    RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
    UNKNOWN_ERROR = 'UNKNOWN_ERROR',
    INVALID_URL = 'INVALID_URL',
    TOKEN_EXPIRED = 'TOKEN_EXPIRED',
    PERMISSION_DENIED = 'PERMISSION_DENIED'
}

export interface RetryConfig {
    maxRetries: number;
    delayMs: number;
    backoffMultiplier?: number;
}

export interface NotificationOptions {
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    duration?: number;
    actions?: NotificationAction[];
}

export interface NotificationAction {
    label: string;
    action: () => void;
}
