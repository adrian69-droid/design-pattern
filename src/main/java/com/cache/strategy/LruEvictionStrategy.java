package com.cache.strategy;

import com.cache.core.CacheEntry;
import java.util.Map;

/**
 * Estratégia LRU (Least Recently Used).
 *
 * Remove o elemento que ficou mais tempo sem ser acessado (menor timestamp/sequência de acesso).
 * Estende AbstractEvictionStrategy utilizando o Template Method.
 *
 * @param <K> Tipo da chave
 * @param <V> Tipo do valor
 */
public class LruEvictionStrategy<K, V> extends AbstractEvictionStrategy<K, V> {

    @Override
    public void onAccess(K key) {
        // O acesso é registrado diretamente na CacheEntry (accessSequence e lastAccessedAt)
    }

    @Override
    public void onRemove(K key) {
    }

    @Override
    public void onClear() {
    }

    /**
     * Implementação do método primitivo do Template Method:
     * Percorre as entradas e identifica aquela com a menor sequência de acesso (mais antiga).
     */
    @Override
    protected K determineCandidate(Map<K, CacheEntry<V>> entries) {
        K lruKey = null;
        long oldestSequence = Long.MAX_VALUE;

        for (Map.Entry<K, CacheEntry<V>> entry : entries.entrySet()) {
            long sequence = entry.getValue().getAccessSequence();
            if (sequence < oldestSequence) {
                oldestSequence = sequence;
                lruKey = entry.getKey();
            }
        }

        return lruKey;
    }
}
