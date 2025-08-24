import React, { useState } from 'react';
import {
    CheckCircle,
    Code,
    Database,
    ExternalLink,
    GitBranch,
    Play,
    TestTube,
    AlertCircle,
    RefreshCw,
    Loader
} from "lucide-react";
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useToast } from '../components/Toast';
import { useFormValidation, commonValidationRules } from '../hooks/useFormValidation';
import { globalErrorHandler } from '../utils/errorHandler';
import { withErrorBoundary } from '../components/ErrorBoundary';
import { postMessage } from "../lib/vscodeBridge";

// Define message types locally for development
enum FromWebview {
    SendJiraUrl = "sendJiraUrl",
}

interface WorkflowStep {
    id: string;
    title: string;
    description: string;
    icon: React.ComponentType<any>;
    status: 'pending' | 'active' | 'completed' | 'error';
}

const Workflow: React.FC = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const { success, error: showError, warning, info } = useToast();

    // Form validation for Jira URL input
    const {
        handleSubmit,
        getFieldProps,
        isValid,
        reset
    } = useFormValidation(
        { jiraUrl: '', additionalContext: '' },
        {
            jiraUrl: {
                ...commonValidationRules.required,
                ...commonValidationRules.jiraUrl
            },
            additionalContext: {
                ...commonValidationRules.maxLength(500)
            }
        }
    );

    const [steps, setSteps] = useState<WorkflowStep[]>([
        {
            id: 'fetch',
            title: 'Fetch & Parse',
            description: 'Extract requirements from Jira',
            icon: Database,
            status: 'active'
        },
        {
            id: 'generate',
            title: 'Generate Code',
            description: 'AI-powered code generation',
            icon: Code,
            status: 'pending'
        },
        {
            id: 'test',
            title: 'Create Tests',
            description: 'Automated test creation',
            icon: TestTube,
            status: 'pending'
        },
        {
            id: 'validate',
            title: 'Validate Coverage',
            description: 'Ensure quality standards',
            icon: CheckCircle,
            status: 'pending'
        },
        {
            id: 'git',
            title: 'Git Automation',
            description: 'Branch and PR creation',
            icon: GitBranch,
            status: 'pending'
        },
        {
            id: 'update',
            title: 'Update Jira',
            description: 'Status and progress tracking',
            icon: ExternalLink,
            status: 'pending'
        }
    ]);

    const updateStepStatus = (stepIndex: number, status: WorkflowStep['status']) => {
        setSteps(prev => prev.map((step, index) => 
            index === stepIndex ? { ...step, status } : step
        ));
    };

    const processStep = async (stepIndex: number): Promise<void> => {
        const step = steps[stepIndex];
        updateStepStatus(stepIndex, 'active');
        setIsProcessing(true);

        try {
            await globalErrorHandler.handleAsync(
                async () => {
                    // Simulate API processing with potential failures
                    await new Promise((resolve, reject) => {
                        setTimeout(() => {
                            // Simulate different failure rates for different steps
                            const failureRates = [0.2, 0.15, 0.1, 0.1, 0.25, 0.15];
                            const shouldFail = Math.random() < (failureRates[stepIndex] || 0.1);
                            
                            if (shouldFail) {
                                const errors = [
                                    'Network timeout occurred',
                                    'Jira API rate limit exceeded',
                                    'Invalid authentication credentials',
                                    'Ticket not found or access denied',
                                    'Code generation service unavailable',
                                    'Git repository access denied'
                                ];
                                reject(new Error(errors[Math.floor(Math.random() * errors.length)]));
                            } else {
                                resolve(`${step.title} completed successfully`);
                            }
                        }, 2000 + Math.random() * 3000); // 2-5 seconds
                    });
                },
                `Workflow step: ${step.title}`,
                { 
                    maxAttempts: 3, 
                    baseDelay: 1000 
                }
            );

            // Step completed successfully
            updateStepStatus(stepIndex, 'completed');
            success(
                `${step.title} Completed`,
                step.description + ' - Ready for next step',
                4000
            );

            // Move to next step
            if (stepIndex < steps.length - 1) {
                setCurrentStep(stepIndex + 1);
                updateStepStatus(stepIndex + 1, 'active');
                // Auto-process next step after a brief delay
                setTimeout(() => processStep(stepIndex + 1), 1000);
            } else {
                // All steps completed
                success(
                    'Workflow Complete!',
                    'All steps have been completed successfully. Your code is ready for review.',
                    6000
                );
            }
            
            setRetryCount(0);
        } catch (err) {
            const appError = globalErrorHandler.handle(err, `Workflow step: ${step.title}`);
            const userMessage = globalErrorHandler.getUserFriendlyMessage(appError);
            
            updateStepStatus(stepIndex, 'error');
            
            showError(
                `${step.title} Failed`,
                userMessage,
                8000
            );

            if (globalErrorHandler.isRecoverable(appError)) {
                const newRetryCount = retryCount + 1;
                setRetryCount(newRetryCount);
                
                if (newRetryCount < 3) {
                    warning(
                        'Retry Available',
                        `This error might be temporary. You can retry this step. (Attempt ${newRetryCount}/3)`,
                        8000
                    );
                } else {
                    info(
                        'Multiple Failures',
                        'Multiple attempts have failed. Please check your configuration or try again later.',
                        10000
                    );
                }
            }
        } finally {
            setIsProcessing(false);
        }
    };

    const handleJiraSubmit = async () => {
        setIsProcessing(true);
        
        try {
            await handleSubmit(
                async (formValues) => {
                    // Send to VS Code extension with error handling
                    await globalErrorHandler.handleAsync(
                        async () => {
                            postMessage(FromWebview.SendJiraUrl, { jiraUrl: formValues.jiraUrl });
                            
                            // Start workflow after successful message send
                            setCurrentStep(0);
                            await processStep(0);
                        },
                        'Jira URL processing',
                        { maxAttempts: 2, baseDelay: 1000 }
                    );
                    
                },
                () => {
                    showError(
                        'Validation Error',
                        'Please check your input and try again.',
                        5000
                    );
                }
            );
            
        } catch (err) {
            const appError = globalErrorHandler.handle(err, 'Jira URL submission');
            const userMessage = globalErrorHandler.getUserFriendlyMessage(appError);
            
            showError(
                'Failed to process Jira URL',
                userMessage,
                8000
            );
        } finally {
            setIsProcessing(false);
        }
    };

    const retryCurrentStep = () => {
        if (currentStep < steps.length) {
            processStep(currentStep);
        }
    };

    const resetWorkflow = () => {
        setCurrentStep(0);
        setRetryCount(0);
        setSteps(prev => prev.map((step, index) => ({
            ...step,
            status: index === 0 ? 'active' : 'pending'
        })));
        reset();
        info('Workflow Reset', 'You can start the process again from the beginning.', 3000);
    };

    const jiraUrlProps = getFieldProps('jiraUrl');

    return (
        <div className="space-y-6">
            {/* Quick Start */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Play size={20} />
                    Start New Workflow
                </h2>

                <form onSubmit={(e) => { 
                    e.preventDefault(); 
                    handleJiraSubmit().catch(console.error);
                }} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Jira Ticket URL *
                        </label>
                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={jiraUrlProps.value}
                                onChange={(e) => jiraUrlProps.onChange(e.target.value)}
                                onBlur={jiraUrlProps.onBlur}
                                placeholder="https://yourcompany.atlassian.net/browse/DEV-123"
                                className={`flex-1 bg-gray-700 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 transition-colors ${
                                    jiraUrlProps.hasError
                                        ? 'border-red-500 focus:ring-red-500'
                                        : 'border-gray-600 focus:ring-blue-500'
                                } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                disabled={isProcessing}
                            />
                            <button
                                type="submit"
                                disabled={!isValid || isProcessing}
                                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
                            >
                                {isProcessing ? (
                                    <Loader className="animate-spin" size={16} />
                                ) : (
                                    <Play size={16} />
                                )}
                                {isProcessing ? "Processing..." : "Start"}
                            </button>
                        </div>
                        {jiraUrlProps.error && (
                            <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                                <AlertCircle size={14} />
                                {jiraUrlProps.error}
                            </p>
                        )}
                        <p className="text-gray-400 text-sm mt-2">
                            🚀 Just paste your Jira URL and hit start! We'll handle authentication automatically.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={resetWorkflow}
                            disabled={isProcessing}
                            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700 text-white rounded-lg transition-colors"
                        >
                            Reset
                        </button>
                    </div>
                </form>
            </div>

            {/* Workflow Steps Progress */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <h2 className="text-xl font-semibold mb-4">Workflow Progress</h2>
                <div className="space-y-3">
                    {steps.map((step, index) => {
                        const Icon = step.icon;
                        const isActive = index === currentStep;
                        const isCompleted = step.status === 'completed';
                        const hasError = step.status === 'error';

                        return (
                            <div key={step.id} className={`flex items-center space-x-4 p-3 rounded-lg transition-colors ${
                                isActive ? 'bg-blue-900/20 border border-blue-700' :
                                isCompleted ? 'bg-green-900/20 border border-green-700' :
                                hasError ? 'bg-red-900/20 border border-red-700' :
                                'bg-gray-700'
                            }`}>
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                                    isCompleted ? 'bg-green-600' :
                                    hasError ? 'bg-red-600' :
                                    isActive ? 'bg-blue-600' :
                                    'bg-gray-600'
                                }`}>
                                    {isCompleted ? (
                                        <CheckCircle size={16} className="text-white" />
                                    ) : hasError ? (
                                        <AlertCircle size={16} className="text-white" />
                                    ) : isActive && isProcessing ? (
                                        <Loader className="animate-spin text-white" size={16} />
                                    ) : (
                                        <Icon size={16} className="text-white" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h3 className={`font-medium ${
                                        isCompleted ? 'text-green-400' :
                                        hasError ? 'text-red-400' :
                                        isActive ? 'text-blue-400' :
                                        'text-gray-300'
                                    }`}>
                                        {step.title}
                                    </h3>
                                    <p className="text-sm text-gray-400">{step.description}</p>
                                </div>
                                {hasError && (
                                    <button
                                        onClick={retryCurrentStep}
                                        disabled={isProcessing}
                                        className="flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white text-sm rounded transition-colors"
                                    >
                                        <RefreshCw size={12} />
                                        Retry
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Processing Indicator */}
            {isProcessing && (
                <LoadingSpinner
                    size="lg"
                    text={`Processing ${steps[currentStep]?.title}...`}
                    fullScreen
                />
            )}

            {/* Help & Tips */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-300 mb-2">Tips for Success:</h3>
                <ul className="text-xs text-gray-400 space-y-1">
                    <li>• Ensure you have proper permissions to access the Jira ticket</li>
                    <li>• Check your network connection if requests are failing</li>
                    <li>• The workflow will automatically proceed through each step</li>
                    <li>• Use the retry feature if temporary errors occur</li>
                    <li>• Reset the workflow to start over if needed</li>
                </ul>
            </div>
        </div>
    );
};

// Wrap with error boundary for additional protection
export default withErrorBoundary(Workflow);
