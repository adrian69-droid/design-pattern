package com.cache.core;

import java.util.Optional;

/**
 * Interface principal da biblioteca de Cache em Memória.
 * Define o contrato elementar de operações suportadas.
 *
 * @param <K> Tipo da chave
 * @param <V> Tipo do valor armazenado
 */
public interface Cache<K, V> {

    /**
     * Insere ou atualiza um elemento no cache.
     *
     * @param key   Chave identificadora
     * @param value Valor a ser armazenado
     */
    void put(K key, V value);

    /**
     * Consulta um elemento no cache.
     * Atualiza métricas de acesso para políticas de evicção (como LRU/LFU).
     *
     * @param key Chave a ser consultada
     * @return Optional contendo o valor, ou vazio caso não exista ou esteja expirado
     */
    Optional<V> get(K key);

    /**
     * Remove explicitamente um elemento do cache.
     *
     * @param key Chave a ser removida
     * @return Optional contendo o valor removido, ou vazio se não existia
     */
    Optional<V> remove(K key);

    /**
     * Limpa todos os elementos armazenados no cache.
     */
    void clear();

    /**
     * Retorna a quantidade de elementos válidos presentes no cache.
     *
     * @return Quantidade de itens
     */
    int size();

    /**
     * Verifica se uma chave existe no cache e ainda é válida.
     *
     * @param key Chave a verificar
     * @return true se presente e não expirada
     */
    boolean containsKey(K key);
}
