/**
 * Utility to generate and manage Trace IDs for distributed logging.
 */

// Generate a random trace ID (prefixing with tr- to make it identifiable)
export const generateTraceId = () => {
    return `tr-${Math.random().toString(36).substring(2, 15)}-${Date.now().toString(36)}`;
};

// Simple singleton or session storage to persist trace ID for the current activity flow
let currentTraceId = generateTraceId();

export const getTraceId = (refresh = false) => {
    if (refresh) {
        currentTraceId = generateTraceId();
    }
    return currentTraceId;
};

export const getTracing = () => {
    return {
        traceId: getTraceId(),
        spanId: `sp-${Math.random().toString(36).substring(2, 9)}`,
    };
};
