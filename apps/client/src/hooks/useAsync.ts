import { useCallback, useEffect, useState } from 'react';

interface AsyncState<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
}

interface UseAsyncReturn<T> extends AsyncState<T> {
    execute: (...args: any[]) => Promise<void>;
    setData: React.Dispatch<React.SetStateAction<T | null>>;
}

/**
 * Generic hook for async operations with loading/error tracking.
 *
 * @param asyncFn - The async function to execute
 * @param immediate - Whether to execute immediately on mount (default: false)
 *
 * @example
 * const { data, loading, error, execute } = useAsync(() => getProperty(id));
 * useEffect(() => { execute(); }, [id]);
 */
export function useAsync<T>(
    asyncFn: (...args: any[]) => Promise<T>,
    immediate = false
): UseAsyncReturn<T> {
    const [state, setState] = useState<AsyncState<T>>({
        data: null,
        loading: immediate,
        error: null,
    });

    const execute = useCallback(
        async (...args: any[]) => {
            setState((prev) => ({ ...prev, loading: true, error: null }));
            try {
                const result = await asyncFn(...args);
                setState({ data: result, loading: false, error: null });
            } catch (err: any) {
                const message = err?.response?.data?.message || err?.message || 'An error occurred';
                setState((prev) => ({ ...prev, loading: false, error: message }));
            }
        },
        [asyncFn]
    );

    const setData: React.Dispatch<React.SetStateAction<T | null>> = useCallback(
        (value) => {
            setState((prev) => ({
                ...prev,
                data: typeof value === 'function' ? (value as (prev: T | null) => T | null)(prev.data) : value,
            }));
        },
        []
    );

    useEffect(() => {
        if (immediate) {
            execute();
        }
    }, [immediate, execute]);

    return { ...state, execute, setData };
}
