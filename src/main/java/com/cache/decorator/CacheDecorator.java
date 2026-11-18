package com.cache.decorator;

import com.cache.core.Cache;
import java.util.Optional;

/**
 * PADRÃO DE PROJETO: Decorator (Classe Base)
 *
 * Envolve uma instância de Cache delegando todas as operações para ela.
 * Permite que subclasses anexem comportamentos transversais adicionais (como
 * coleta de métricas, logging ou criptografia) sem alterar a implementação do cache original.
 *
 * @param <K> Tipo da chave
 * @param <V> Tipo do valor
 */
public abstract class CacheDecorator<K, V> implements Cache<K, V> {

    protected final Cache<K, V> decoratedCache;

    public CacheDecorator(Cache<K, V> decoratedCache) {
        if (decoratedCache == null) {
            throw new IllegalArgumentException("O cache decorado não pode ser nulo.");
        }
        this.decoratedCache = decoratedCache;
    }

    @Override
    public void put(K key, V value) {
        decoratedCache.put(key, value);
    }

    @Override
    public Optional<V> get(K key) {
        return decoratedCache.get(key);
    }

    @Override
    public Optional<V> remove(K key) {
        return decoratedCache.remove(key);
    }

    @Override
    public void clear() {
        decoratedCache.clear();
    }

    @Override
    public int size() {
        return decoratedCache.size();
    }

    @Override
    public boolean containsKey(K key) {
        return decoratedCache.containsKey(key);
    }

    public Cache<K, V> getDecoratedCache() {
        return decoratedCache;
    }
}
