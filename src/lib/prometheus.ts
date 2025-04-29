import { collectDefaultMetrics, Counter, Histogram, Registry } from 'prom-client';

export const register = new Registry();

collectDefaultMetrics({
    register,
    prefix: 'uekpz2_'
});

export const uekCacheHitCounter = new Counter({
    name: 'uek_cache_hit',
    help: 'Cache Hits against UEK',
    labelNames: ['route']
});
register.registerMetric(uekCacheHitCounter);

export const uekCacheMissCounter = new Counter({
    name: 'uek_cache_miss',
    help: 'Cache Misses against UEK',
    labelNames: ['route']
});
register.registerMetric(uekCacheMissCounter);

export const uekFetchLatencyHistogram = new Histogram({
    name: 'uek_fetch_latency_ms',
    help: 'Duration of HTTP requests to UEK in milliseconds',
    labelNames: ['route'],
    buckets: [50, 75, 100, 125, 150, 175, 200, 300, 500, 1000]
});
register.registerMetric(uekFetchLatencyHistogram);

export const uekRateLimiterLatencyHistogram = new Histogram({
    name: 'uek_ratelimit_latency_ms',
    help: 'Duration of self rate limit in milliseconds',
    buckets: [50, 75, 100, 125, 150, 175, 200, 300, 500, 1000]
});
register.registerMetric(uekRateLimiterLatencyHistogram);
