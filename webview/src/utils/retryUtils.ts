import { RetryConfig } from '../types/errors';

export interface RetryOptions {
    maxAttempts: number;
    baseDelay: number;
    maxDelay?: number;
    backoffFactor?: number;
    onRetry?: (attempt: number, error: any) => void;
}

export async function retryWithBackoff<T>(
    operation: () => Promise<T>,
    options: RetryOptions
): Promise<T> {
    const {
        maxAttempts,
        baseDelay,
        maxDelay = 30000,
        backoffFactor = 2,
        onRetry
    } = options;

    let lastError: any;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;

            // Don't retry on the last attempt
            if (attempt === maxAttempts) {
                break;
            }

            // Call retry callback if provided
            if (onRetry) {
                onRetry(attempt, error);
            }

            // Calculate delay with exponential backoff
            const delay = Math.min(
                baseDelay * Math.pow(backoffFactor, attempt - 1),
                maxDelay
            );

            await sleep(delay);
        }
    }

    throw lastError;
}

export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export class RetryableError extends Error {
    constructor(message: string, public isRetryable = true) {
        super(message);
        this.name = 'RetryableError';
    }
}

export function isRetryableError(error: any): boolean {
    // Check if it's explicitly marked as retryable
    if (error instanceof RetryableError) {
        return error.isRetryable;
    }

    // Check for common retryable HTTP status codes
    if (error.response?.status) {
        const status = error.response.status;
        return status >= 500 || status === 429 || status === 408;
    }

    // Check for network-related errors
    if (error.code) {
        const retryableCodes = [
            'ECONNRESET',
            'ECONNREFUSED',
            'ETIMEDOUT',
            'ENOTFOUND',
            'ECONNABORTED'
        ];
        return retryableCodes.includes(error.code);
    }

    // Check for fetch-related network errors
    if (error.name === 'TypeError' && error.message?.includes('fetch')) {
        return true;
    }

    return false;
}

export async function withRetry<T>(
    operation: () => Promise<T>,
    config: RetryConfig = { maxAttempts: 3, baseDelay: 1000 }
): Promise<T> {
    return retryWithBackoff(operation, {
        maxAttempts: config.maxAttempts,
        baseDelay: config.baseDelay,
        maxDelay: config.maxDelay,
        backoffFactor: config.backoffFactor
    });
}

// Legacy class for backwards compatibility
export class RetryUtils {
    static async withRetry<T>(
        operation: () => Promise<T>,
        config: { maxRetries: number; delayMs: number; backoffMultiplier?: number } = { maxRetries: 3, delayMs: 1000, backoffMultiplier: 2 }
    ): Promise<T> {
        return retryWithBackoff(operation, {
            maxAttempts: config.maxRetries + 1, // Convert to attempts
            baseDelay: config.delayMs,
            backoffFactor: config.backoffMultiplier || 2
        });
    }
    
    static delay(ms: number): Promise<void> {
        return sleep(ms);
    }
    
    static async withTimeout<T>(
        operation: () => Promise<T>,
        timeoutMs: number = 30000
    ): Promise<T> {
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
                reject(new Error(`Operation timed out after ${timeoutMs}ms`));
            }, timeoutMs);
        });
        
        return Promise.race([operation(), timeoutPromise]);
    }
}
