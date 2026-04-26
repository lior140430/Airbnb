import React, { useCallback, useState } from 'react';

/**
 * Generic form state management hook.
 * 
 * @example
 * const { values, handleChange, setValues, resetForm } = useFormState({
 *   email: '',
 *   password: '',
 * });
 * 
 * <input name="email" value={values.email} onChange={handleChange} />
 */
export function useFormState<T extends Record<string, any>>(initialValues: T) {
    const [values, setValues] = useState<T>(initialValues);

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
            const { name, value } = e.target;
            setValues((prev) => ({ ...prev, [name]: value }));
        },
        []
    );

    const setField = useCallback(
        (name: keyof T, value: T[keyof T]) => {
            setValues((prev) => ({ ...prev, [name]: value }));
        },
        []
    );

    const resetForm = useCallback(() => {
        setValues(initialValues);
    }, [initialValues]);

    return { values, handleChange, setValues, setField, resetForm };
}
