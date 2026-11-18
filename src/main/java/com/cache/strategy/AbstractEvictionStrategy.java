package com.cache.strategy;

import com.cache.core.CacheEntry;
import java.util.Map;
import java.util.Optional;

/**
 * PADRÃO DE PROJETO: Template Method
 *
 * Classe abstrata que estabelece a estrutura algorítmica padronizada para o
 * processo de escolha de qual elemento será removido do cache por limite de capacidade.
 *
 * Define o fluxo esqueleto no método template 'selectVictim', deixando para as classes
 * filhas especializadas (como FIFO, LRU e LFU) a responsabilidade de implementar
 * o método primitivo 'determineCandidate'.
 *
 * @param <K> Tipo da chave
 * @param <V> Tipo do valor
 */
public abstract class AbstractEvictionStrategy<K, V> implements EvictionStrategy<K, V> {

    /**
     * MÉTODO TEMPLATE (final para não ser sobrescrito incorretamente).
     *
     * Define o esqueleto geral de execução:
     * 1. Verifica se há entradas no cache.
     * 2. Executa pré-checagem comum.
     * 3. Invoca o método primitivo abstrato 'determineCandidate' que as subclasses implementam.
     * 4. Executa pós-processamento comum (atualiza estruturas internas da estratégia).
     *
     * @param entries Mapa com as entradas atuais do cache
     * @return Optional contendo a chave selecionada para evicção
     */
    @Override
    public final Optional<K> selectVictim(Map<K, CacheEntry<V>> entries) {
        if (entries == null || entries.isEmpty()) {
            return Optional.empty();
        }

        // Hook de pré-processamento (pode ser sobrescrito se necessário)
        beforeEviction(entries);

        // Método primitivo (passo abstrato que cada subclasse deve definir)
        K victimKey = determineCandidate(entries);

        if (victimKey != null) {
            // Pós-processamento padronizado: remove das estruturas de rastreamento internas
            onRemove(victimKey);
            afterVictimSelected(victimKey);
            return Optional.of(victimKey);
        }

        return Optional.empty();
    }

    /**
     * Método primitivo que deve ser implementado pelas subclasses (FIFO, LRU, LFU).
     * Cada estratégia concreta define aqui sua regra específica de escolha do candidato à evicção.
     *
     * @param entries Mapa com as entradas do cache
     * @return A chave selecionada para ser removida
     */
    protected abstract K determineCandidate(Map<K, CacheEntry<V>> entries);

    /**
     * Hook opcional de pré-processamento executado antes de escolher o candidato.
     */
    protected void beforeEviction(Map<K, CacheEntry<V>> entries) {
        // Implementação padrão vazia (hook)
    }

    /**
     * Hook opcional executado logo após a seleção do candidato.
     */
    protected void afterVictimSelected(K victimKey) {
        // Implementação padrão vazia (hook)
    }
}
