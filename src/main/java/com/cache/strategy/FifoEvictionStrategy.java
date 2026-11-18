package com.cache.strategy;

import com.cache.core.CacheEntry;
import java.util.LinkedList;
import java.util.Map;

/**
 * Estratégia FIFO (First In, First Out).
 *
 * Remove primeiro o elemento que entrou primeiro no cache (mais antigo por data de criação).
 * Estende AbstractEvictionStrategy utilizando o Template Method.
 *
 * @param <K> Tipo da chave
 * @param <V> Tipo do valor
 */
public class FifoEvictionStrategy<K, V> extends AbstractEvictionStrategy<K, V> {

    // Fila que mantém a ordem estrita de inserção das chaves
    private final LinkedList<K> insertionOrder = new LinkedList<>();

    @Override
    public synchronized void onAccess(K key) {
        // No FIFO, acessos posteriores NÃO alteram a ordem de inserção original
        if (!insertionOrder.contains(key)) {
            insertionOrder.addLast(key);
        }
    }

    @Override
    public synchronized void onRemove(K key) {
        insertionOrder.remove(key);
    }

    @Override
    public synchronized void onClear() {
        insertionOrder.clear();
    }

    /**
     * Implementação do método primitivo do Template Method:
     * Seleciona a chave na cabeça da fila (o primeiro inserido).
     */
    @Override
    protected synchronized K determineCandidate(Map<K, CacheEntry<V>> entries) {
        // Encontra o primeiro da fila de inserção que ainda existe no mapa
        for (K key : insertionOrder) {
            if (entries.containsKey(key)) {
                return key;
            }
        }

        // Fallback: se a fila estiver vazia por algum motivo, busca pelo menor createdAt
        K oldestKey = null;
        long oldestTime = Long.MAX_VALUE;
        for (Map.Entry<K, CacheEntry<V>> entry : entries.entrySet()) {
            if (entry.getValue().getCreatedAt() < oldestTime) {
                oldestTime = entry.getValue().getCreatedAt();
                oldestKey = entry.getKey();
            }
        }
        return oldestKey;
    }
}
