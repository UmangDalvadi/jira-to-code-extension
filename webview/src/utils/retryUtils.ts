import { RetryConfig } from '../types/errors';

export class RetryUtils {
    static async withRetry<T>(
        operation: () => Promise<T>,
        config: RetryConfig = { maxRetries: 3, delayMs: 1000, backoffMultiplier: 2 }
    ): Promise<T> {
        let lastError: Error;
        
        for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error as Error;
                
                if (attempt === config.maxRetries) {
                    throw lastError;
                }
                
                const delay = config.delayMs * Math.pow(config.backoffMultiplier || 2, attempt);
                await this.delay(delay);
            }
        }
        
        throw lastError!;
    }
    
    static delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
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
