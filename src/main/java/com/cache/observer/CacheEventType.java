package com.cache.observer;

/**
 * Tipos de eventos do ciclo de vida dos registros no cache.
 */
public enum CacheEventType {
    /**
     * Item inserido ou atualizado no cache.
     */
    INSERTION,

    /**
     * Item removido explicitamente pelo usuário via remove() ou clear().
     */
    REMOVAL,

    /**
     * Item removido por expiração do tempo de vida (TTL).
     */
    EXPIRATION,

    /**
     * Item removido por limite de capacidade da política de evicção (ex: FIFO/LRU/LFU).
     */
    EVICTION
}
