import { collectDefaultMetrics, Counter, Histogram, Registry } from 'prom-client';

export const register = new Registry();

collectDefaultMetrics({
    register,
    prefix: 'uekpz2_'
});

export const uekCacheHitCounter = new Counter({
    name: 'uekpz2_custom_cache_hit',
    help: 'Cache Hits against UEK',
    labelNames: ['routeType']
});
register.registerMetric(uekCacheHitCounter);

export const uekCacheMissCounter = new Counter({
    name: 'uekpz2_custom_cache_miss',
    help: 'Cache Misses against UEK',
    labelNames: ['routeType']
});
register.registerMetric(uekCacheMissCounter);

export const uekFetchLatencyHistogram = new Histogram({
    name: 'uekpz2_custom_fetch_latency_ms',
    help: 'Duration of HTTP requests to UEK in milliseconds',
    labelNames: ['routeType'],
    buckets: [50, 75, 100, 125, 150, 175, 200, 300, 500, 1000, 1500]
});
register.registerMetric(uekFetchLatencyHistogram);

export const uekRateLimiterLatencyHistogram = new Histogram({
    name: 'uekpz2_custom_ratelimit_latency_ms',
    help: 'Duration of self rate limit in milliseconds',
    buckets: [10, 25, 50, 75, 100, 125, 150, 200, 300, 500, 1000, 2000, 5000]
});
register.registerMetric(uekRateLimiterLatencyHistogram);
