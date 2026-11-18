package com.cache.strategy;

import com.cache.core.CacheEntry;
import java.util.Map;
import java.util.Optional;

/**
 * PADRÃO DE PROJETO: Strategy
 *
 * Interface que define a família de algoritmos de evicção/remoção de dados do cache.
 * Permite que diferentes políticas (FIFO, LRU, LFU, etc.) sejam intercambiadas em tempo
 * de execução sem modificar a implementação principal do cache.
 *
 * @param <K> Tipo da chave
 * @param <V> Tipo do valor
 */
public interface EvictionStrategy<K, V> {

    /**
     * Notifica a estratégia sobre o acesso ou inserção de um elemento.
     *
     * @param key Chave acessada ou inserida
     */
    void onAccess(K key);

    /**
     * Notifica a estratégia sobre a remoção de um elemento.
     *
     * @param key Chave removida
     */
    void onRemove(K key);

    /**
     * Notifica a limpeza total do cache.
     */
    void onClear();

    /**
     * Seleciona e retorna a chave do elemento que deve ser removido do cache
     * de acordo com a política implementada.
     *
     * @param entries Mapa contendo os registros atuais do cache
     * @return Optional contendo a chave a ser removida, ou vazio se não houver candidatos
     */
    Optional<K> selectVictim(Map<K, CacheEntry<V>> entries);
}
