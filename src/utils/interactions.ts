export const runAfterInteractions = (fn: () => void) => {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    const frame = requestAnimationFrame(() => {
        timeout = setTimeout(fn, 0);
    });

    return {
        cancel: () => {
            cancelAnimationFrame(frame);
            if (timeout) clearTimeout(timeout);
        },
    };
};
