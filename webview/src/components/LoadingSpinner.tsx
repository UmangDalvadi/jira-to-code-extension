import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    text?: string;
    className?: string;
    fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 'md',
    text,
    className = '',
    fullScreen = false
}) => {
    const getSizeClasses = () => {
        switch (size) {
            case 'sm': return 'w-4 h-4';
            case 'md': return 'w-6 h-6';
            case 'lg': return 'w-8 h-8';
        }
    };

    const getTextSize = () => {
        switch (size) {
            case 'sm': return 'text-sm';
            case 'md': return 'text-base';
            case 'lg': return 'text-lg';
        }
    };

    const content = (
        <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
            <Loader2 className={`animate-spin text-blue-500 ${getSizeClasses()}`} />
            {text && (
                <p className={`text-gray-300 ${getTextSize()}`}>
                    {text}
                </p>
            )}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                    {content}
                </div>
            </div>
        );
    }

    return content;
};

// Hook for managing loading states
export const useLoading = () => {
    const [loading, setLoading] = React.useState(false);
    const [loadingText, setLoadingText] = React.useState<string | undefined>();

    const startLoading = React.useCallback((text?: string) => {
        setLoadingText(text);
        setLoading(true);
    }, []);

    const stopLoading = React.useCallback(() => {
        setLoading(false);
        setLoadingText(undefined);
    }, []);

    return {
        loading,
        loadingText,
        startLoading,
        stopLoading
    };
};
