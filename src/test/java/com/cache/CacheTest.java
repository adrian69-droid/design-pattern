package com.cache;

import com.cache.builder.CacheBuilder;
import com.cache.core.Cache;
import com.cache.decorator.MetricsCacheDecorator;
import com.cache.observer.CacheEventType;
import com.cache.strategy.FifoEvictionStrategy;
import com.cache.strategy.LruEvictionStrategy;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Suíte de testes unitários da biblioteca In-Process Cache Manager.
 * Executável diretamente pela JVM (sem depender obrigatoriamente de dependências externas).
 */
public class CacheTest {

    private static void assertTrue(boolean condition, String message) {
        if (!condition) {
            throw new AssertionError("FALHA: " + message);
        }
    }

    private static void assertEquals(Object expected, Object actual, String message) {
        if (expected == null && actual == null) return;
        if (expected != null && expected.equals(actual)) return;
        throw new AssertionError("FALHA: " + message + " | Esperado: " + expected + ", Obtido: " + actual);
    }

    public static void main(String[] args) throws InterruptedException {
        System.out.println("Executando bateria de testes do In-Process Cache Manager...\n");

        testOperacoesBasicas();
        testPoliticaFifo();
        testPoliticaLru();
        testExpiracaoTtl();
        testNotificacoesObserver();
        testMetricsDecorator();

        System.out.println("\n✅ TODOS OS TESTES PASSARAM COM SUCESSO!");
    }

    private static void testOperacoesBasicas() {
        System.out.print("- Teste: Operações Básicas (put, get, remove, clear)... ");
        Cache<String, Integer> cache = CacheBuilder.<String, Integer>newBuilder()
                .maxCapacity(10)
                .build();

        cache.put("a", 100);
        cache.put("b", 200);

        assertEquals(2, cache.size(), "Tamanho deve ser 2");
        assertEquals(Optional.of(100), cache.get("a"), "Valor de 'a' deve ser 100");
        assertTrue(cache.containsKey("b"), "Chave 'b' deve existir");

        cache.remove("a");
        assertEquals(Optional.empty(), cache.get("a"), "Valor de 'a' deve ser vazio após remoção");

        cache.clear();
        assertEquals(0, cache.size(), "Tamanho deve ser 0 após clear()");
        System.out.println("OK");
    }

    private static void testPoliticaFifo() {
        System.out.print("- Teste: Evicção FIFO (First In, First Out)... ");
        Cache<String, String> cache = CacheBuilder.<String, String>newBuilder()
                .maxCapacity(2)
                .evictionStrategy(new FifoEvictionStrategy<>())
                .build();

        cache.put("k1", "v1");
        cache.put("k2", "v2");
        cache.put("k3", "v3"); // Deve evictar k1

        assertEquals(Optional.empty(), cache.get("k1"), "k1 deve ter sido removido pelo FIFO");
        assertEquals(Optional.of("v2"), cache.get("k2"), "k2 deve permanecer");
        assertEquals(Optional.of("v3"), cache.get("k3"), "k3 deve permanecer");
        System.out.println("OK");
    }

    private static void testPoliticaLru() {
        System.out.print("- Teste: Evicção LRU (Least Recently Used)... ");
        Cache<String, String> cache = CacheBuilder.<String, String>newBuilder()
                .maxCapacity(2)
                .evictionStrategy(new LruEvictionStrategy<>())
                .build();

        cache.put("k1", "v1");
        cache.put("k2", "v2");

        // Acessa k1 para torná-lo mais recentemente usado
        cache.get("k1");

        // Insere k3; como k2 é o menos recentemente usado, k2 deve ser evicto!
        cache.put("k3", "v3");

        assertEquals(Optional.of("v1"), cache.get("k1"), "k1 deve permanecer porque foi acessado recentemente");
        assertEquals(Optional.empty(), cache.get("k2"), "k2 deve ter sido evicto pelo LRU");
        assertEquals(Optional.of("v3"), cache.get("k3"), "k3 deve estar presente");
        System.out.println("OK");
    }

    private static void testExpiracaoTtl() throws InterruptedException {
        System.out.print("- Teste: Expiração por TTL... ");
        Cache<String, String> cache = CacheBuilder.<String, String>newBuilder()
                .maxCapacity(5)
                .ttlMillis(50) // 50ms de TTL
                .build();

        cache.put("expiraRapido", "dado");
        assertEquals(Optional.of("dado"), cache.get("expiraRapido"), "Deve estar disponível imediatamente");

        Thread.sleep(70); // Aguarda expirar

        assertEquals(Optional.empty(), cache.get("expiraRapido"), "Deve retornar vazio após expiração de TTL");
        System.out.println("OK");
    }

    private static void testNotificacoesObserver() {
        System.out.print("- Teste: Notificações do Observer... ");
        List<CacheEventType> eventosCapturados = new ArrayList<>();

        Cache<String, String> cache = CacheBuilder.<String, String>newBuilder()
                .maxCapacity(2)
                .addListener(event -> eventosCapturados.add(event.getEventType()))
                .build();

        cache.put("k1", "v1"); // INSERTION
        cache.put("k2", "v2"); // INSERTION
        cache.put("k3", "v3"); // EVICTION + INSERTION
        cache.remove("k2");     // REMOVAL

        assertTrue(eventosCapturados.contains(CacheEventType.INSERTION), "Deve capturar INSERTION");
        assertTrue(eventosCapturados.contains(CacheEventType.EVICTION), "Deve capturar EVICTION");
        assertTrue(eventosCapturados.contains(CacheEventType.REMOVAL), "Deve capturar REMOVAL");
        System.out.println("OK");
    }

    private static void testMetricsDecorator() {
        System.out.print("- Teste: Decorator de Métricas (Hit/Miss/Ratio)... ");
        Cache<String, String> cache = CacheBuilder.<String, String>newBuilder()
                .maxCapacity(5)
                .enableMetrics()
                .build();

        assertTrue(cache instanceof MetricsCacheDecorator, "Deve ser uma instância decorada");
        MetricsCacheDecorator<String, String> metrics = (MetricsCacheDecorator<String, String>) cache;

        cache.put("chave", "valor");
        cache.get("chave");       // Hit 1
        cache.get("chave");       // Hit 2
        cache.get("inexistente"); // Miss 1

        assertEquals(2L, metrics.getHitCount(), "Hit count deve ser 2");
        assertEquals(1L, metrics.getMissCount(), "Miss count deve ser 1");
        assertEquals(3L, metrics.getTotalRequests(), "Total de requests deve ser 3");
        assertTrue(Math.abs(metrics.getHitRatio() - (2.0 / 3.0)) < 0.001, "Hit ratio deve ser 66.67%");
        System.out.println("OK");
    }
}
