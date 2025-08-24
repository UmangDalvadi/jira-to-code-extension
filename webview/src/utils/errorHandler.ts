import { AppError, ErrorSeverity, ErrorCodes } from '../types/errors';
import { retryWithBackoff } from './retryUtils';

export interface ErrorHandlerConfig {
    enableLogging?: boolean;
    enableRetry?: boolean;
    maxRetries?: number;
    onError?: (error: AppError) => void;
}

export class ErrorHandler {
    private config: ErrorHandlerConfig;
    private static instance: ErrorHandler;

    constructor(config: ErrorHandlerConfig = {}) {
        this.config = {
            enableLogging: true,
            enableRetry: true,
            maxRetries: 3,
            ...config
        };
    }

    static getInstance(config?: ErrorHandlerConfig): ErrorHandler {
        if (!ErrorHandler.instance) {
            ErrorHandler.instance = new ErrorHandler(config);
        }
        return ErrorHandler.instance;
    }

    // Enhanced error handling with automatic classification
    handle(error: unknown, context?: string): AppError {
        const appError = this.normalizeError(error, context);
        
        this.logError(appError);
        
        if (this.config.onError) {
            this.config.onError(appError);
        }

        // Send to VS Code extension for logging
        this.sendToExtension(appError);

        return appError;
    }

    // Wrapper for async operations with automatic retry
    async handleAsync<T>(
        operation: () => Promise<T>,
        context?: string,
        retryConfig?: { maxAttempts?: number; baseDelay?: number }
    ): Promise<T> {
        try {
            if (this.config.enableRetry) {
                return await retryWithBackoff(operation, {
                    maxAttempts: retryConfig?.maxAttempts ?? this.config.maxRetries ?? 3,
                    baseDelay: retryConfig?.baseDelay ?? 1000,
                    onRetry: (attempt, error) => {
                        const appError = this.normalizeError(error, `${context} (retry ${attempt})`);
                        this.logError(appError);
                    }
                });
            } else {
                return await operation();
            }
        } catch (error) {
            throw this.handle(error, context);
        }
    }

    private normalizeError(error: unknown, context?: string): AppError {
        // Handle different error types
        if (error instanceof Error) {
            return this.createErrorFromException(error, context);
        }

        // Handle fetch/network errors
        if (typeof error === 'object' && error !== null) {
            const obj = error as any;
            
            // Handle Axios errors
            if (obj.response) {
                return this.createErrorFromAxiosResponse(obj, context);
            }
            
            // Handle network errors
            if (obj.request) {
                return this.createError(
                    ErrorCodes.NETWORK_ERROR,
                    'Network error. Please check your internet connection.',
                    ErrorSeverity.HIGH,
                    context,
                    { originalError: obj.request },
                    true
                );
            }
            
            if (obj.name === 'TypeError' && obj.message?.includes('fetch')) {
                return this.createError(
                    ErrorCodes.NETWORK_ERROR,
                    'Network connection failed',
                    ErrorSeverity.HIGH,
                    context,
                    { originalError: obj },
                    true
                );
            }
        }

        // Handle string errors
        if (typeof error === 'string') {
            return this.createError(
                ErrorCodes.UNKNOWN_ERROR,
                error,
                ErrorSeverity.MEDIUM,
                context
            );
        }

        // Fallback for unknown error types
        return this.createError(
            ErrorCodes.UNKNOWN_ERROR,
            'An unexpected error occurred',
            ErrorSeverity.MEDIUM,
            context,
            { originalError: error }
        );
    }

    private createErrorFromException(error: Error, context?: string): AppError {
        const message = error.message.toLowerCase();
        const name = error.name.toLowerCase();

        // Timeout errors
        if (error.name === 'AbortError' || message.includes('timeout') || name.includes('timeouterror')) {
            return this.createError(
                ErrorCodes.TIMEOUT_ERROR,
                'Request timed out. Please try again.',
                ErrorSeverity.MEDIUM,
                context,
                { originalError: error.name, stack: error.stack },
                true
            );
        }

        // Validation errors
        if (error.name === 'ValidationError' || message.includes('validation') || message.includes('invalid')) {
            return this.createError(
                ErrorCodes.VALIDATION_ERROR,
                error.message,
                ErrorSeverity.MEDIUM,
                context,
                { originalError: error.name, stack: error.stack },
                false
            );
        }

        // Parse errors
        if (name.includes('syntaxerror') || message.includes('parse')) {
            return this.createError(
                ErrorCodes.JIRA_API_ERROR,
                'Unable to process server response',
                ErrorSeverity.MEDIUM,
                context,
                { originalError: error.name, stack: error.stack },
                false
            );
        }

        // Network/fetch errors
        if (message.includes('fetch') || message.includes('network') || name.includes('networkerror')) {
            return this.createError(
                ErrorCodes.NETWORK_ERROR,
                'Network connection failed',
                ErrorSeverity.HIGH,
                context,
                { originalError: error.name, stack: error.stack },
                true
            );
        }

        // Default error
        return this.createError(
            ErrorCodes.UNKNOWN_ERROR,
            error.message,
            this.determineSeverity(error),
            context,
            { originalError: error.name, stack: error.stack }
        );
    }

    private createErrorFromAxiosResponse(error: any, context?: string): AppError {
        const status = error.response?.status;
        const data = error.response?.data;
        
        switch (status) {
            case 401:
                return this.createError(
                    ErrorCodes.AUTHENTICATION_ERROR,
                    'Authentication failed. Please log in again.',
                    ErrorSeverity.HIGH,
                    context,
                    { status, data },
                    false
                );
            case 403:
                return this.createError(
                    ErrorCodes.PERMISSION_DENIED,
                    'You don\'t have permission to access this resource.',
                    ErrorSeverity.HIGH,
                    context,
                    { status, data },
                    false
                );
            case 404:
                return this.createError(
                    ErrorCodes.JIRA_API_ERROR,
                    'Jira ticket not found. Please check the URL.',
                    ErrorSeverity.MEDIUM,
                    context,
                    { status, data },
                    false
                );
            case 429:
                return this.createError(
                    ErrorCodes.RATE_LIMIT_ERROR,
                    'Too many requests. Please wait before trying again.',
                    ErrorSeverity.MEDIUM,
                    context,
                    { status, data },
                    true
                );
            case 500:
            case 502:
            case 503:
                return this.createError(
                    ErrorCodes.JIRA_API_ERROR,
                    'Jira server error. Please try again later.',
                    ErrorSeverity.HIGH,
                    context,
                    { status, data },
                    true
                );
            default:
                return this.createError(
                    ErrorCodes.JIRA_API_ERROR,
                    `Request failed with status ${status}`,
                    status >= 500 ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM,
                    context,
                    { status, data },
                    status >= 500
                );
        }
    }

    public createError(
        code: ErrorCodes,
        message: string,
        severity: ErrorSeverity,
        context?: string,
        details?: any,
        retryable = false
    ): AppError {
        return {
            code,
            message,
            severity,
            context,
            details,
            retryable,
            timestamp: new Date()
        };
    }

    private determineSeverity(error: Error): ErrorSeverity {
        const message = error.message.toLowerCase();
        const name = error.name.toLowerCase();

        // Critical errors that break core functionality
        if (name.includes('referenceerror') || name.includes('typeerror') && !message.includes('fetch')) {
            return ErrorSeverity.CRITICAL;
        }

        // High severity for network and auth issues
        if (message.includes('network') || message.includes('unauthorized') || message.includes('forbidden')) {
            return ErrorSeverity.HIGH;
        }

        // Medium for validation and API errors
        if (message.includes('validation') || message.includes('api') || message.includes('timeout')) {
            return ErrorSeverity.MEDIUM;
        }

        // Low for minor issues
        return ErrorSeverity.LOW;
    }

    private logError(error: AppError): void {
        if (!this.config.enableLogging) return;

        const logData = {
            timestamp: error.timestamp?.toISOString() || new Date().toISOString(),
            message: error.message,
            code: error.code,
            severity: error.severity || ErrorSeverity.MEDIUM,
            context: error.context,
            details: error.details,
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        // Log based on severity
        switch (error.severity || ErrorSeverity.MEDIUM) {
            case ErrorSeverity.CRITICAL:
                console.error('🔴 CRITICAL ERROR:', logData);
                break;
            case ErrorSeverity.HIGH:
                console.error('🟠 HIGH SEVERITY ERROR:', logData);
                break;
            case ErrorSeverity.MEDIUM:
                console.warn('🟡 MEDIUM SEVERITY ERROR:', logData);
                break;
            case ErrorSeverity.LOW:
                console.info('🔵 LOW SEVERITY ERROR:', logData);
                break;
        }
    }

    private sendToExtension(error: AppError): void {
        try {
            const vscode = (window as any).vscode;
            if (vscode) {
                vscode.postMessage({
                    type: 'error_log',
                    data: {
                        timestamp: error.timestamp?.toISOString() || new Date().toISOString(),
                        message: error.message,
                        code: error.code,
                        severity: error.severity || ErrorSeverity.MEDIUM,
                        context: error.context,
                        details: error.details,
                        userAgent: navigator.userAgent,
                        url: window.location.href
                    }
                });
            }
        } catch (e) {
            console.warn('Failed to send error to extension:', e);
        }
    }

    // Static methods for backwards compatibility
    static createError(code: ErrorCodes, message: string, details?: any, retryable = false): AppError {
        return {
            code,
            message,
            severity: ErrorSeverity.MEDIUM,
            details,
            retryable,
            timestamp: new Date()
        };
    }

    static parseError(error: any): AppError {
        return globalErrorHandler.handle(error, 'parseError');
    }

    static isRetryable(error: AppError): boolean {
        return error.retryable === true;
    }

    static getUserFriendlyMessage(error: AppError): string {
        return globalErrorHandler.getUserFriendlyMessage(error);
    }

    // Utility method for user-friendly error messages
    getUserFriendlyMessage(error: AppError): string {
        switch (error.code) {
            case ErrorCodes.NETWORK_ERROR:
                return 'Unable to connect to the server. Please check your internet connection and try again.';
            case ErrorCodes.AUTHENTICATION_ERROR:
                return 'Authentication failed. Please log in again or check your credentials.';
            case ErrorCodes.VALIDATION_ERROR:
                return 'Please check your input and try again.';
            case ErrorCodes.TIMEOUT_ERROR:
                return 'The request took too long to complete. Please try again.';
            case ErrorCodes.JIRA_API_ERROR:
                return 'Server error occurred. Please try again later.';
            case ErrorCodes.INVALID_URL:
                return 'Please enter a valid Jira ticket URL.';
            case ErrorCodes.TOKEN_EXPIRED:
                return 'Your session has expired. Please log in again.';
            case ErrorCodes.RATE_LIMIT_ERROR:
                return 'Too many requests. Please wait a moment before trying again.';
            case ErrorCodes.PERMISSION_DENIED:
                return 'You don\'t have permission to access this Jira ticket.';
            default:
                return error.message || 'An unexpected error occurred. Please try again.';
        }
    }

    // Method to determine if an error is recoverable
    isRecoverable(error: AppError): boolean {
        const recoverableErrors: ErrorCodes[] = [ErrorCodes.NETWORK_ERROR, ErrorCodes.TIMEOUT_ERROR, ErrorCodes.JIRA_API_ERROR, ErrorCodes.RATE_LIMIT_ERROR];
        return recoverableErrors.includes(error.code) && (error.severity || ErrorSeverity.MEDIUM) !== ErrorSeverity.CRITICAL;
    }

    // Method to get suggested actions for an error
    getSuggestedActions(error: AppError): string[] {
        switch (error.code) {
            case ErrorCodes.NETWORK_ERROR:
                return [
                    'Check your internet connection',
                    'Try refreshing the page',
                    'Contact support if the problem persists'
                ];
            case ErrorCodes.AUTHENTICATION_ERROR:
                return [
                    'Log in again',
                    'Check your credentials',
                    'Clear browser cache and cookies'
                ];
            case ErrorCodes.VALIDATION_ERROR:
                return [
                    'Review your input',
                    'Check required fields',
                    'Ensure data format is correct'
                ];
            case ErrorCodes.TIMEOUT_ERROR:
                return [
                    'Try again',
                    'Check your internet connection',
                    'Try with a smaller request'
                ];
            case ErrorCodes.RATE_LIMIT_ERROR:
                return [
                    'Wait a moment before trying again',
                    'Reduce the frequency of requests'
                ];
            default:
                return [
                    'Try refreshing the page',
                    'Try again later',
                    'Contact support if the problem persists'
                ];
        }
    }
}

// Global error handler instance
export const globalErrorHandler = ErrorHandler.getInstance();

// Utility functions for common error scenarios
export const handleApiError = (error: unknown, context?: string): AppError => {
    return globalErrorHandler.handle(error, context);
};

export const handleNetworkError = (error: unknown, context?: string): AppError => {
    const appError = globalErrorHandler.handle(error, context);
    if (appError.code !== ErrorCodes.NETWORK_ERROR) {
        return globalErrorHandler.createError(
            ErrorCodes.NETWORK_ERROR,
            'Network request failed',
            ErrorSeverity.HIGH,
            context,
            { originalError: appError },
            true
        );
    }
    return appError;
};

export const handleValidationError = (message: string, context?: string): AppError => {
    return globalErrorHandler.createError(
        ErrorCodes.VALIDATION_ERROR,
        message,
        ErrorSeverity.MEDIUM,
        context,
        {},
        false
    );
};
