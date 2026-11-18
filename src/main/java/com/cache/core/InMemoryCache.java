package com.cache.core;

import com.cache.observer.CacheEvent;
import com.cache.observer.CacheEventType;
import com.cache.observer.CacheListener;
import com.cache.strategy.EvictionStrategy;
import com.cache.strategy.FifoEvictionStrategy;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Implementação padrão de Cache em Memória (In-Process Cache Manager).
 *
 * Integra:
 * - Strategy: política de evicção (FifoEvictionStrategy, LruEvictionStrategy ou customizada).
 * - Observer: lista de listeners notificados para inserções, remoções, expirações e evicções.
 * - Controle fino de TTL e capacidade máxima.
 *
 * @param <K> Tipo da chave
 * @param <V> Tipo do valor
 */
public class InMemoryCache<K, V> implements Cache<K, V> {

    private final Map<K, CacheEntry<V>> storage = new ConcurrentHashMap<>();
    private final List<CacheListener<K, V>> listeners = new CopyOnWriteArrayList<>();

    private final int maxCapacity;
    private final long defaultTtlMillis;
    private final EvictionStrategy<K, V> evictionStrategy;

    public InMemoryCache(int maxCapacity, long defaultTtlMillis, EvictionStrategy<K, V> evictionStrategy) {
        if (maxCapacity <= 0) {
            throw new IllegalArgumentException("A capacidade máxima deve ser maior que zero.");
        }
        this.maxCapacity = maxCapacity;
        this.defaultTtlMillis = defaultTtlMillis;
        this.evictionStrategy = (evictionStrategy != null) ? evictionStrategy : new FifoEvictionStrategy<>();
    }

    public void addListener(CacheListener<K, V> listener) {
        if (listener != null) {
            listeners.add(listener);
        }
    }

    public void removeListener(CacheListener<K, V> listener) {
        listeners.remove(listener);
    }

    @Override
    public synchronized void put(K key, V value) {
        if (key == null || value == null) {
            throw new IllegalArgumentException("Chave e valor não podem ser nulos.");
        }

        // Se o elemento não existe e o cache atingiu a capacidade máxima, executa evicção
        if (!storage.containsKey(key) && storage.size() >= maxCapacity) {
            evictOne();
        }

        CacheEntry<V> newEntry = new CacheEntry<>(value, defaultTtlMillis);
        storage.put(key, newEntry);
        evictionStrategy.onAccess(key);

        notifyListeners(new CacheEvent<>(key, value, CacheEventType.INSERTION));
    }

    @Override
    public synchronized Optional<V> get(K key) {
        if (key == null) {
            return Optional.empty();
        }

        CacheEntry<V> entry = storage.get(key);
        if (entry == null) {
            return Optional.empty();
        }

        // Checagem de expiração por TTL
        if (entry.isExpired()) {
            storage.remove(key);
            evictionStrategy.onRemove(key);
            notifyListeners(new CacheEvent<>(key, entry.getValue(), CacheEventType.EXPIRATION));
            return Optional.empty();
        }

        // Registra acesso para políticas como LRU e LFU
        entry.recordAccess();
        evictionStrategy.onAccess(key);

        return Optional.of(entry.getValue());
    }

    @Override
    public synchronized Optional<V> remove(K key) {
        if (key == null) {
            return Optional.empty();
        }

        CacheEntry<V> entry = storage.remove(key);
        if (entry != null) {
            evictionStrategy.onRemove(key);
            notifyListeners(new CacheEvent<>(key, entry.getValue(), CacheEventType.REMOVAL));
            return Optional.of(entry.getValue());
        }

        return Optional.empty();
    }

    @Override
    public synchronized void clear() {
        storage.clear();
        evictionStrategy.onClear();
    }

    @Override
    public synchronized int size() {
        // Remove entradas expiradas para retornar tamanho exato de válidos
        storage.entrySet().removeIf(entry -> {
            if (entry.getValue().isExpired()) {
                evictionStrategy.onRemove(entry.getKey());
                notifyListeners(new CacheEvent<>(entry.getKey(), entry.getValue().getValue(), CacheEventType.EXPIRATION));
                return true;
            }
            return false;
        });
        return storage.size();
    }

    @Override
    public synchronized boolean containsKey(K key) {
        return get(key).isPresent();
    }

    /**
     * Executa a evicção de um elemento utilizando a EvictionStrategy (Strategy Pattern).
     */
    private void evictOne() {
        Optional<K> victimKey = evictionStrategy.selectVictim(storage);
        if (victimKey.isPresent()) {
            K keyToRemove = victimKey.get();
            CacheEntry<V> removedEntry = storage.remove(keyToRemove);
            if (removedEntry != null) {
                notifyListeners(new CacheEvent<>(keyToRemove, removedEntry.getValue(), CacheEventType.EVICTION));
            }
        }
    }

    private void notifyListeners(CacheEvent<K, V> event) {
        for (CacheListener<K, V> listener : listeners) {
            try {
                listener.onEvent(event);
            } catch (Exception e) {
                System.err.println("Erro ao notificar CacheListener: " + e.getMessage());
            }
        }
    }

    public int getMaxCapacity() {
        return maxCapacity;
    }

    public long getDefaultTtlMillis() {
        return defaultTtlMillis;
    }

    public EvictionStrategy<K, V> getEvictionStrategy() {
        return evictionStrategy;
    }
}
