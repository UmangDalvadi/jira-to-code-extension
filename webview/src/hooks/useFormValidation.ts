import { useState, useCallback } from 'react';
import { handleValidationError } from '../utils/errorHandler';

export interface ValidationRule<T = any> {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: T) => string | null;
    message?: string;
}

export interface ValidationRules {
    [key: string]: ValidationRule;
}

export interface ValidationErrors {
    [key: string]: string;
}

export const useFormValidation = <T extends Record<string, any>>(
    initialValues: T,
    validationRules: ValidationRules = {}
) => {
    const [values, setValues] = useState<T>(initialValues);
    const [errors, setErrors] = useState<ValidationErrors>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validateField = useCallback((name: string, value: any): string | null => {
        const rule = validationRules[name];
        if (!rule) return null;

        // Required validation
        if (rule.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
            return rule.message || `${name} is required`;
        }

        // Skip other validations if value is empty and not required
        if (!value && !rule.required) return null;

        // String validations
        if (typeof value === 'string') {
            // Min length validation
            if (rule.minLength && value.length < rule.minLength) {
                return rule.message || `${name} must be at least ${rule.minLength} characters`;
            }

            // Max length validation
            if (rule.maxLength && value.length > rule.maxLength) {
                return rule.message || `${name} must be no more than ${rule.maxLength} characters`;
            }

            // Pattern validation
            if (rule.pattern && !rule.pattern.test(value)) {
                return rule.message || `${name} format is invalid`;
            }
        }

        // Custom validation
        if (rule.custom) {
            return rule.custom(value);
        }

        return null;
    }, [validationRules]);

    const validateForm = useCallback((): boolean => {
        const newErrors: ValidationErrors = {};
        let isValid = true;

        Object.keys(validationRules).forEach(name => {
            const error = validateField(name, values[name]);
            if (error) {
                newErrors[name] = error;
                isValid = false;
            }
        });

        setErrors(newErrors);
        return isValid;
    }, [values, validateField, validationRules]);

    const handleChange = useCallback((name: string, value: any) => {
        setValues(prev => ({ ...prev, [name]: value }));
        
        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    }, [errors]);

    const handleBlur = useCallback((name: string) => {
        setTouched(prev => ({ ...prev, [name]: true }));
        
        // Validate field on blur
        const error = validateField(name, values[name]);
        if (error) {
            setErrors(prev => ({ ...prev, [name]: error }));
        }
    }, [validateField, values]);

    const handleSubmit = useCallback(async <R>(
        onSubmit: (values: T) => Promise<R> | R,
        onError?: (error: any) => void
    ): Promise<R | null> => {
        setIsSubmitting(true);
        
        try {
            // Mark all fields as touched
            const allTouched = Object.keys(validationRules).reduce(
                (acc, key) => ({ ...acc, [key]: true }),
                {}
            );
            setTouched(allTouched);

            // Validate form
            if (!validateForm()) {
                const validationError = handleValidationError(
                    'Please fix the validation errors before submitting',
                    'form-validation'
                );
                if (onError) {
                    onError(validationError);
                }
                return null;
            }

            // Submit form
            const result = await onSubmit(values);
            return result;
        } catch (error) {
            if (onError) {
                onError(error);
            }
            throw error;
        } finally {
            setIsSubmitting(false);
        }
    }, [values, validateForm, validationRules]);

    const reset = useCallback((newValues?: Partial<T>) => {
        setValues(newValues ? { ...initialValues, ...newValues } : initialValues);
        setErrors({});
        setTouched({});
        setIsSubmitting(false);
    }, [initialValues]);

    const setFieldError = useCallback((name: string, error: string) => {
        setErrors(prev => ({ ...prev, [name]: error }));
    }, []);

    const clearFieldError = useCallback((name: string) => {
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[name];
            return newErrors;
        });
    }, []);

    const getFieldProps = useCallback((name: string) => ({
        value: values[name] || '',
        onChange: (value: any) => handleChange(name, value),
        onBlur: () => handleBlur(name),
        error: touched[name] ? errors[name] : undefined,
        hasError: Boolean(touched[name] && errors[name])
    }), [values, errors, touched, handleChange, handleBlur]);

    return {
        values,
        errors,
        touched,
        isSubmitting,
        handleChange,
        handleBlur,
        handleSubmit,
        validateForm,
        reset,
        setFieldError,
        clearFieldError,
        getFieldProps,
        hasErrors: Object.keys(errors).length > 0,
        isValid: Object.keys(errors).length === 0
    };
};

// Common validation rules
export const commonValidationRules = {
    email: {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Please enter a valid email address'
    },
    url: {
        pattern: /^https?:\/\/.+/,
        message: 'Please enter a valid URL'
    },
    jiraUrl: {
        pattern: /^https?:\/\/.+\/(browse|projects)\/[A-Z]+-\d+/,
        message: 'Please enter a valid Jira ticket URL'
    },
    required: {
        required: true,
        message: 'This field is required'
    },
    minLength: (length: number) => ({
        minLength: length,
        message: `Must be at least ${length} characters`
    }),
    maxLength: (length: number) => ({
        maxLength: length,
        message: `Must be no more than ${length} characters`
    })
};
