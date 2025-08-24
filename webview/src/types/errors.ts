// Error types for the application

export enum ErrorCodes {
    // Authentication & Authorization
    AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
    TOKEN_EXPIRED = 'TOKEN_EXPIRED',
    PERMISSION_DENIED = 'PERMISSION_DENIED',
    
    // Validation
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    INVALID_URL = 'INVALID_URL',
    
    // Network & API
    NETWORK_ERROR = 'NETWORK_ERROR',
    TIMEOUT_ERROR = 'TIMEOUT_ERROR',
    RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
    JIRA_API_ERROR = 'JIRA_API_ERROR',
    
    // Generic
    UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export enum ErrorSeverity {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM', 
    HIGH = 'HIGH',
    CRITICAL = 'CRITICAL'
}

export interface AppError {
    code: ErrorCodes;
    message: string;
    severity?: ErrorSeverity;
    context?: string;
    details?: any;
    retryable?: boolean;
    timestamp?: Date;
}

// Utility types for error handling
export interface ErrorToastConfig {
    type: 'error' | 'warning' | 'info';
    title: string;
    message: string;
    actions?: Array<{
        label: string;
        action: () => void;
    }>;
}

export interface RetryConfig {
    maxAttempts: number;
    baseDelay: number;
    maxDelay?: number;
    backoffFactor?: number;
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
