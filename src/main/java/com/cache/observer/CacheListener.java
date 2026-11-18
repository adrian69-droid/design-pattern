package com.cache.observer;

/**
 * PADRÃO DE PROJETO: Observer
 *
 * Interface a ser implementada por qualquer componente que deseje receber
 * notificações sobre os eventos do ciclo de vida do cache (inserções, remoções,
 * expirações e evicções).
 *
 * @param <K> Tipo da chave
 * @param <V> Tipo do valor
 */
@FunctionalInterface
public interface CacheListener<K, V> {

    /**
     * Notificação disparada quando ocorre um evento no cache.
     *
     * @param event Dados do evento ocorrido
     */
    void onEvent(CacheEvent<K, V> event);
}
