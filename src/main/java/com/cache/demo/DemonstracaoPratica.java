package com.cache.demo;

import com.cache.builder.CacheBuilder;
import com.cache.core.Cache;
import com.cache.decorator.MetricsCacheDecorator;
import com.cache.strategy.FifoEvictionStrategy;

import java.util.Optional;

/**
 * DEMONSTRAÇÃO PRÁTICA 1: Roteiro da Parte 3 (Apresentador 1)
 *
 * Executa exatamente o fluxo narrado na apresentação:
 * 1. Configura CacheBuilder com capacidade máxima = 2, TTL = 1000ms (1s), estratégia FIFO,
 *    métricas ativadas e listener registrado.
 * 2. Insere dois usuários e consulta para verificar que estão armazenados.
 * 3. Insere um terceiro usuário.
 * 4. Mostra que o primeiro usuário foi removido por FIFO (limite de capacidade atingido).
 * 5. Mostra as métricas de hit e miss.
 */
public class DemonstracaoPratica {

    public static void main(String[] args) {
        System.out.println("==========================================================");
        System.out.println(" DEMONSTRAÇÃO PRÁTICA: IN-PROCESS CACHE MANAGER (PARTE 3)");
        System.out.println("==========================================================\n");

        // 1. Configuração do Cache via CacheBuilder
        System.out.println("1. Configurando o cache via CacheBuilder...");
        System.out.println("   - Capacidade máxima: 2 elementos");
        System.out.println("   - TTL: 1000 milissegundos (1 segundo)");
        System.out.println("   - Estratégia de evicção: FIFO");
        System.out.println("   - Métricas: Habilitadas");
        System.out.println("   - Listener de eventos: Registrado\n");

        Cache<String, String> cache = CacheBuilder.<String, String>newBuilder()
                .maxCapacity(2)
                .ttlMillis(1000)
                .evictionStrategy(new FifoEvictionStrategy<>())
                .enableMetrics()
                .addListener(event -> {
                    System.out.printf("   [EVENTO OBSERVER] Tipo: %-10s | Chave: %-10s | Valor: %s%n",
                            event.getEventType(), event.getKey(), event.getValue());
                })
                .build();

        // 2. Inserção de dois usuários
        System.out.println("2. Inserindo dois usuários no cache...");
        cache.put("user1", "João Silva (ID: 101)");
        cache.put("user2", "Maria Santos (ID: 102)");

        System.out.println("\n3. Realizando consultas para verificar se foram armazenados corretamente:");
        Optional<String> u1 = cache.get("user1");
        Optional<String> u2 = cache.get("user2");
        System.out.println("   - Consulta 'user1': " + u1.orElse("NÃO ENCONTRADO"));
        System.out.println("   - Consulta 'user2': " + u2.orElse("NÃO ENCONTRADO"));

        // 3. Inserção do terceiro usuário (excede capacidade 2)
        System.out.println("\n4. Inserindo o terceiro usuário ('user3')...");
        System.out.println("   Como a capacidade máxima é 2, o cache aplicará a estratégia FIFO para liberar espaço.");
        cache.put("user3", "Carlos Eduardo (ID: 103)");

        // 4. Verificação da evicção do primeiro usuário
        System.out.println("\n5. Verificando que o primeiro usuário ('user1') foi removido por evicção FIFO:");
        Optional<String> consultaUser1AposEviccao = cache.get("user1");
        System.out.println("   - Consulta 'user1': " + consultaUser1AposEviccao.orElse("NÃO ENCONTRADO (Evicto com sucesso!)"));

        Optional<String> consultaUser2AposEviccao = cache.get("user2");
        Optional<String> consultaUser3AposEviccao = cache.get("user3");
        System.out.println("   - Consulta 'user2': " + consultaUser2AposEviccao.orElse("NÃO ENCONTRADO"));
        System.out.println("   - Consulta 'user3': " + consultaUser3AposEviccao.orElse("NÃO ENCONTRADO"));

        // 5. Exibição das métricas coletadas pelo Decorator
        if (cache instanceof MetricsCacheDecorator) {
            MetricsCacheDecorator<String, String> metricsCache = (MetricsCacheDecorator<String, String>) cache;
            System.out.println("\n6. Métricas operacionais (MetricsCacheDecorator):");
            System.out.println("   - Total de Consultas: " + metricsCache.getTotalRequests());
            System.out.println("   - Cache Hits: " + metricsCache.getHitCount());
            System.out.println("   - Cache Misses: " + metricsCache.getMissCount());
            System.out.printf("   - Taxa de Acerto (Hit Ratio): %.2f%%%n", metricsCache.getHitRatio() * 100.0);
        }

        System.out.println("\n==========================================================");
        System.out.println(" FIM DA DEMONSTRAÇÃO PRÁTICA");
        System.out.println("==========================================================");
    }
}
