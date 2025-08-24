import { AppError, ErrorCodes } from '../types/errors';

export class ErrorHandler {
    static createError(code: ErrorCodes, message: string, details?: any, retryable = false): AppError {
        return {
            code,
            message,
            details,
            retryable,
            timestamp: new Date()
        };
    }

    static parseError(error: any): AppError {
        // Handle Axios errors
        if (error.response) {
            const status = error.response.status;
            const data = error.response.data;
            
            switch (status) {
                case 401:
                    return this.createError(
                        ErrorCodes.AUTHENTICATION_ERROR,
                        'Authentication failed. Please log in again.',
                        { status, data },
                        false
                    );
                case 403:
                    return this.createError(
                        ErrorCodes.PERMISSION_DENIED,
                        'You don\'t have permission to access this resource.',
                        { status, data },
                        false
                    );
                case 404:
                    return this.createError(
                        ErrorCodes.JIRA_API_ERROR,
                        'Jira ticket not found. Please check the URL.',
                        { status, data },
                        false
                    );
                case 429:
                    return this.createError(
                        ErrorCodes.RATE_LIMIT_ERROR,
                        'Too many requests. Please wait before trying again.',
                        { status, data },
                        true
                    );
                case 500:
                case 502:
                case 503:
                    return this.createError(
                        ErrorCodes.JIRA_API_ERROR,
                        'Jira server error. Please try again later.',
                        { status, data },
                        true
                    );
                default:
                    return this.createError(
                        ErrorCodes.JIRA_API_ERROR,
                        `Request failed with status ${status}`,
                        { status, data },
                        status >= 500
                    );
            }
        }

        // Handle network errors
        if (error.request) {
            return this.createError(
                ErrorCodes.NETWORK_ERROR,
                'Network error. Please check your internet connection.',
                error.request,
                true
            );
        }

        // Handle timeout errors
        if (error.code === 'ECONNABORTED') {
            return this.createError(
                ErrorCodes.TIMEOUT_ERROR,
                'Request timed out. Please try again.',
                error,
                true
            );
        }

        // Handle validation errors
        if (error.name === 'ValidationError') {
            return this.createError(
                ErrorCodes.VALIDATION_ERROR,
                error.message,
                error,
                false
            );
        }

        // Default error
        return this.createError(
            ErrorCodes.UNKNOWN_ERROR,
            error.message || 'An unexpected error occurred',
            error,
            false
        );
    }

    static isRetryable(error: AppError): boolean {
        return error.retryable === true;
    }

    static getUserFriendlyMessage(error: AppError): string {
        switch (error.code) {
            case ErrorCodes.NETWORK_ERROR:
                return 'Please check your internet connection and try again.';
            case ErrorCodes.AUTHENTICATION_ERROR:
                return 'Please authenticate with Jira again.';
            case ErrorCodes.INVALID_URL:
                return 'Please enter a valid Jira ticket URL.';
            case ErrorCodes.TOKEN_EXPIRED:
                return 'Your session has expired. Please log in again.';
            case ErrorCodes.RATE_LIMIT_ERROR:
                return 'Too many requests. Please wait a moment before trying again.';
            case ErrorCodes.PERMISSION_DENIED:
                return 'You don\'t have permission to access this Jira ticket.';
            default:
                return error.message;
        }
    }
}
