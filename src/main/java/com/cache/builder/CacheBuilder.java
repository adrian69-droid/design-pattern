package com.cache.builder;

import com.cache.core.Cache;
import com.cache.core.InMemoryCache;
import com.cache.decorator.MetricsCacheDecorator;
import com.cache.observer.CacheListener;
import com.cache.strategy.EvictionStrategy;
import com.cache.strategy.FifoEvictionStrategy;

import java.util.ArrayList;
import java.util.List;

/**
 * PADRÃO DE PROJETO: Builder
 *
 * Facilita a criação e configuração fluente do cache em memória.
 * Permite definir de forma intuitiva:
 * - Capacidade máxima de itens
 * - Tempo de vida (TTL) em milissegundos
 * - Estratégia de evicção (Strategy)
 * - Registro de observadores (Observer)
 * - Habilitação de métricas com decorator (Decorator)
 *
 * Conforme citado na apresentação:
 * "Primeiro, utilizamos o CacheBuilder para criar uma instância do cache.
 * Aqui configuramos uma capacidade máxima de dois elementos, um TTL de mil milissegundos,
 * que equivale a um segundo, e escolhemos a estratégia FIFO. Também habilitamos a coleta de
 * métricas e adicionamos um listener para acompanhar os eventos."
 *
 * @param <K> Tipo da chave
 * @param <V> Tipo do valor
 */
public class CacheBuilder<K, V> {

    private int maxCapacity = 100;
    private long ttlMillis = 0; // 0 significa sem expiração por padrão
    private EvictionStrategy<K, V> evictionStrategy = new FifoEvictionStrategy<>();
    private boolean metricsEnabled = false;
    private final List<CacheListener<K, V>> listeners = new ArrayList<>();

    public static <K, V> CacheBuilder<K, V> newBuilder() {
        return new CacheBuilder<>();
    }

    public CacheBuilder<K, V> maxCapacity(int maxCapacity) {
        if (maxCapacity <= 0) {
            throw new IllegalArgumentException("A capacidade máxima deve ser maior que zero.");
        }
        this.maxCapacity = maxCapacity;
        return this;
    }

    public CacheBuilder<K, V> ttlMillis(long ttlMillis) {
        if (ttlMillis < 0) {
            throw new IllegalArgumentException("O TTL não pode ser negativo.");
        }
        this.ttlMillis = ttlMillis;
        return this;
    }

    public CacheBuilder<K, V> evictionStrategy(EvictionStrategy<K, V> strategy) {
        if (strategy == null) {
            throw new IllegalArgumentException("A estratégia de evicção não pode ser nula.");
        }
        this.evictionStrategy = strategy;
        return this;
    }

    public CacheBuilder<K, V> enableMetrics() {
        this.metricsEnabled = true;
        return this;
    }

    public CacheBuilder<K, V> addListener(CacheListener<K, V> listener) {
        if (listener != null) {
            this.listeners.add(listener);
        }
        return this;
    }

    /**
     * Constrói e retorna a instância de Cache configurada.
     * Se as métricas foram habilitadas, envelopa a instância com o MetricsCacheDecorator.
     *
     * @return Instância configurada de Cache<K, V>
     */
    public Cache<K, V> build() {
        InMemoryCache<K, V> rawCache = new InMemoryCache<>(maxCapacity, ttlMillis, evictionStrategy);

        // Registra todos os listeners configurados
        for (CacheListener<K, V> listener : listeners) {
            rawCache.addListener(listener);
        }

        // Se habilitado, decora com o coletor de métricas (Decorator Pattern)
        if (metricsEnabled) {
            return new MetricsCacheDecorator<>(rawCache);
        }

        return rawCache;
    }
}
