package com.cache.core;

import java.util.concurrent.atomic.AtomicLong;

/**
 * Representa um registro individual armazenado no cache em memória.
 *
 * Conforme descrito na arquitetura:
 * "Ela mantém o valor, o horário de criação, o último acesso, a quantidade de acessos
 * e o tempo de vida do registro, conhecido como TTL."
 *
 * @param <V> Tipo do valor armazenado
 */
public class CacheEntry<V> {

    private static final AtomicLong ACCESS_SEQUENCE_GENERATOR = new AtomicLong(0);

    private final V value;
    private final long createdAt;
    private long lastAccessedAt;
    private long accessSequence;
    private long accessCount;
    private final long ttlMillis;

    public CacheEntry(V value, long ttlMillis) {
        this.value = value;
        this.ttlMillis = ttlMillis;
        this.createdAt = System.currentTimeMillis();
        this.lastAccessedAt = this.createdAt;
        this.accessSequence = ACCESS_SEQUENCE_GENERATOR.incrementAndGet();
        this.accessCount = 0;
    }

    /**
     * Registra um acesso ao item, atualizando o timestamp de último acesso,
     * a sequência lógica de acesso e incrementando a contagem de acessos (utilizada por LFU).
     */
    public synchronized void recordAccess() {
        this.lastAccessedAt = System.currentTimeMillis();
        this.accessSequence = ACCESS_SEQUENCE_GENERATOR.incrementAndGet();
        this.accessCount++;
    }

    /**
     * Verifica se o registro excedeu o tempo de vida (TTL).
     * Se ttlMillis <= 0, o registro não expira por tempo.
     *
     * @return true se o registro já expirou
     */
    public boolean isExpired() {
        if (ttlMillis <= 0) {
            return false;
        }
        return (System.currentTimeMillis() - createdAt) > ttlMillis;
    }

    public V getValue() {
        return value;
    }

    public long getCreatedAt() {
        return createdAt;
    }

    public synchronized long getLastAccessedAt() {
        return lastAccessedAt;
    }

    public synchronized long getAccessSequence() {
        return accessSequence;
    }

    public synchronized long getAccessCount() {
        return accessCount;
    }

    public long getTtlMillis() {
        return ttlMillis;
    }

    @Override
    public String toString() {
        return "CacheEntry{" +
                "value=" + value +
                ", createdAt=" + createdAt +
                ", lastAccessedAt=" + lastAccessedAt +
                ", accessSequence=" + accessSequence +
                ", accessCount=" + accessCount +
                ", ttlMillis=" + ttlMillis +
                '}';
    }
}
