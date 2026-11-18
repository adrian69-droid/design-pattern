package com.cache.decorator;

import com.cache.core.Cache;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

/**
 * PADRÃO DE PROJETO: Decorator (Concreto)
 *
 * Decorator que acompanha e calcula métricas operacionais de desempenho:
 * - Consultas bem-sucedidas (Cache Hit)
 * - Consultas sem resultado / expiradas (Cache Miss)
 * - Total de inserções (Puts)
 * - Taxa de acerto (Hit Ratio)
 *
 * Conforme citado na apresentação:
 * "Um exemplo é o MetricsCacheDecorator, que acompanha a quantidade de consultas
 * bem-sucedidas, chamadas de cache hit, e consultas sem resultado, chamadas de cache miss.
 * Assim, conseguimos acompanhar o desempenho do cache de maneira independente."
 *
 * @param <K> Tipo da chave
 * @param <V> Tipo do valor
 */
public class MetricsCacheDecorator<K, V> extends CacheDecorator<K, V> {

    private final AtomicLong hitCount = new AtomicLong(0);
    private final AtomicLong missCount = new AtomicLong(0);
    private final AtomicLong putCount = new AtomicLong(0);
    private final AtomicLong removeCount = new AtomicLong(0);

    public MetricsCacheDecorator(Cache<K, V> decoratedCache) {
        super(decoratedCache);
    }

    @Override
    public void put(K key, V value) {
        super.put(key, value);
        putCount.incrementAndGet();
    }

    @Override
    public Optional<V> get(K key) {
        Optional<V> result = super.get(key);
        if (result.isPresent()) {
            hitCount.incrementAndGet();
        } else {
            missCount.incrementAndGet();
        }
        return result;
    }

    @Override
    public Optional<V> remove(K key) {
        Optional<V> removed = super.remove(key);
        if (removed.isPresent()) {
            removeCount.incrementAndGet();
        }
        return removed;
    }

    public long getHitCount() {
        return hitCount.get();
    }

    public long getMissCount() {
        return missCount.get();
    }

    public long getPutCount() {
        return putCount.get();
    }

    public long getRemoveCount() {
        return removeCount.get();
    }

    public long getTotalRequests() {
        return hitCount.get() + missCount.get();
    }

    /**
     * Calcula a taxa percentual de acerto (Hit Ratio).
     *
     * @return Valor entre 0.0 e 1.0 (ou 0.0 se não houve requisições)
     */
    public double getHitRatio() {
        long total = getTotalRequests();
        if (total == 0) {
            return 0.0;
        }
        return (double) hitCount.get() / total;
    }

    public void resetMetrics() {
        hitCount.set(0);
        missCount.set(0);
        putCount.set(0);
        removeCount.set(0);
    }

    @Override
    public String toString() {
        return String.format(
                "CacheMetrics[Hits: %d, Misses: %d, Total Requests: %d, Hit Ratio: %.2f%%, Puts: %d]",
                getHitCount(),
                getMissCount(),
                getTotalRequests(),
                getHitRatio() * 100.0,
                getPutCount()
        );
    }
}
