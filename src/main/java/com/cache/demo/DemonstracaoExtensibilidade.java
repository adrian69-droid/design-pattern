package com.cache.demo;

import com.cache.builder.CacheBuilder;
import com.cache.core.Cache;
import com.cache.core.CacheEntry;
import com.cache.strategy.AbstractEvictionStrategy;

import java.util.Map;
import java.util.Optional;

/**
 * DEMONSTRAÇÃO DE EXTENSIBILIDADE: Roteiro da Parte 3 (Item 8)
 *
 * Demonstra como o desenvolvedor cliente estende a biblioteca criando uma estratégia
 * LFU (Least Frequently Used) personalizada, sem alterar nenhuma linha do código-fonte da biblioteca
 * (respeitando o Princípio Aberto/Fechado - Open/Closed Principle).
 */
public class DemonstracaoExtensibilidade {

    /**
     * ESTRATÉGIA CUSTOMIZADA DO CLIENTE: LFU (Least Frequently Used)
     *
     * O desenvolvedor cliente simplesmente estende AbstractEvictionStrategy e implementa
     * o método 'determineCandidate' do Template Method, selecionando a chave cujo registro
     * possui a menor contagem de acessos (accessCount).
     */
    public static class LfuEvictionStrategy<K, V> extends AbstractEvictionStrategy<K, V> {

        @Override
        public void onAccess(K key) {
            // A contagem é atualizada automaticamente pela CacheEntry.recordAccess()
        }

        @Override
        public void onRemove(K key) {
        }

        @Override
        public void onClear() {
        }

        /**
         * Implementação do método primitivo do Template Method:
         * Identifica o elemento com menor quantidade de acessos.
         */
        @Override
        protected K determineCandidate(Map<K, CacheEntry<V>> entries) {
            K lfuKey = null;
            long minAccessCount = Long.MAX_VALUE;

            for (Map.Entry<K, CacheEntry<V>> entry : entries.entrySet()) {
                long count = entry.getValue().getAccessCount();
                if (count < minAccessCount) {
                    minAccessCount = count;
                    lfuKey = entry.getKey();
                }
            }

            return lfuKey;
        }
    }

    public static void main(String[] args) {
        System.out.println("==========================================================");
        System.out.println(" DEMONSTRAÇÃO DE EXTENSIBILIDADE (OPEN/CLOSED PRINCIPLE)");
        System.out.println("==========================================================\n");

        System.out.println("1. O cliente instancia o cache plugando sua própria LfuEvictionStrategy...");
        Cache<String, String> cache = CacheBuilder.<String, String>newBuilder()
                .maxCapacity(2)
                .evictionStrategy(new LfuEvictionStrategy<>())
                .addListener(event -> {
                    System.out.printf("   [EVENTO LFU] Tipo: %-10s | Chave: %-10s | Valor: %s%n",
                            event.getEventType(), event.getKey(), event.getValue());
                })
                .build();

        // 2. Insere dois registros
        System.out.println("\n2. Inserindo 'itemA' e 'itemB'...");
        cache.put("itemA", "Relatório de Vendas");
        cache.put("itemB", "Configurações Globais");

        // 3. Acessa 'itemA' várias vezes para aumentar seu accessCount
        System.out.println("\n3. Acessando 'itemA' 3 vezes (tornando-o mais frequente que 'itemB')...");
        cache.get("itemA");
        cache.get("itemA");
        cache.get("itemA");

        // 4. Insere 'itemC' (capacidade máxima 2 atingida)
        System.out.println("\n4. Inserindo 'itemC'...");
        System.out.println("   Como 'itemB' foi acessado menos vezes que 'itemA', o LFU deve remover 'itemB'!");
        cache.put("itemC", "Logs de Auditoria");

        // 5. Verifica se 'itemB' foi removido e 'itemA' permaneceu
        System.out.println("\n5. Verificando os itens no cache:");
        Optional<String> getA = cache.get("itemA");
        Optional<String> getB = cache.get("itemB");
        Optional<String> getC = cache.get("itemC");

        System.out.println("   - 'itemA' (mais acessado): " + getA.orElse("NÃO ENCONTRADO"));
        System.out.println("   - 'itemB' (menos acessado): " + getB.orElse("NÃO ENCONTRADO (Evicto pelo LFU customizado!)"));
        System.out.println("   - 'itemC' (recém-inserido): " + getC.orElse("NÃO ENCONTRADO"));

        System.out.println("\n==========================================================");
        System.out.println(" EXTENSIBILIDADE COMPROVADA COM SUCESSO (SOLID OCP)");
        System.out.println("==========================================================");
    }
}
