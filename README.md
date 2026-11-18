# ⚡ In-Process Cache Manager (`in-process-cache`)

> **Biblioteca Extensível de Cache em Memória desenvolvida em Java**, aplicando rigorosamente os conceitos de **Design Patterns (GoF)**, princípios **SOLID** (com foco no *Open/Closed Principle*) e **Clean Code**.

---

## 👥 Integrantes da Equipe

| Nome Completo | Matrícula | Papel na Apresentação |
| :--- | :--- | :--- |
| **[Aluno 1 - Nome Completo]** | `[Matrícula 1]` | **Apresentador 1** (Introdução, Demonstração Prática FIFO e Extensão LFU) |
| **[Aluno 2 - Nome Completo]** | `[Matrícula 2]` | **Apresentador 2** (Estrutura do Código, Strategy, Template Method, Observer, Decorator e Conclusão) |

---

## 🎥 Vídeo de Apresentação

- **Link do Vídeo no YouTube:** [https://youtu.be/mY1obLfsi9s](https://youtu.be/mY1obLfsi9s)  
*(Vídeo da apresentação parcial com duração máxima de 10 minutos seguindo o roteiro estruturado).*

---

## 🎯 1. Objetivo da Biblioteca

O objetivo principal da biblioteca é armazenar informações temporariamente na memória em nível de processo (*in-process*), permitindo que aplicações clientes recuperem esses dados com alta performance sem consultar fontes externas ou bancos de dados a todo momento.

O artefato final gerado é **estritamente uma biblioteca Java (pacote `.jar`)** pronta para ser importada como dependência em outros projetos.

---

## 🏛️ 2. Padrões de Projeto Aplicados

A arquitetura foi estruturada com os seguintes padrões de projeto:

1. **Strategy (`EvictionStrategy`):**
   - Permite a troca dinâmica de algoritmos de evicção de dados (remoção por limite de capacidade).
   - Implementações nativas da biblioteca: `FifoEvictionStrategy` (First In, First Out) e `LruEvictionStrategy` (Least Recently Used).
   
2. **Template Method (`AbstractEvictionStrategy`):**
   - Define a estrutura padrão e o esqueleto do algoritmo no método template final `selectVictim()`.
   - Delega a responsabilidade da regra de escolha da vítima para o método primitivo abstrato `determineCandidate()`, permitindo que novas estratégias sejam criadas sem duplicar lógica de fluxo.

3. **Observer (`CacheEvent`, `CacheEventType`, `CacheListener`):**
   - Desacopla o núcleo do cache dos consumidores de eventos.
   - Emite notificações automáticas quando ocorrem eventos de `INSERTION`, `REMOVAL`, `EXPIRATION` e `EVICTION`.

4. **Decorator (`CacheDecorator`, `MetricsCacheDecorator`):**
   - Adiciona funcionalidades transversais sem modificar a classe principal `InMemoryCache`.
   - O `MetricsCacheDecorator` rastreia consultas com sucesso (*cache hits*), consultas sem resultado (*cache misses*), total de requisições e taxa de acerto (*hit ratio*).

5. **Builder (`CacheBuilder`):**
   - Fornece uma API fluente e intuitiva para configurar e instanciar o cache:
     - Capacidade máxima (`maxCapacity`)
     - Tempo de expiração TTL (`ttlMillis`)
     - Estratégia de evicção (`evictionStrategy`)
     - Habilitação de métricas (`enableMetrics`)
     - Registro de ouvintes (`addListener`)

---

## 🚀 3. Guia de Uso

### 3.1. Caso de Uso Padrão (*Out-of-the-Box*)

```java
import com.cache.builder.CacheBuilder;
import com.cache.core.Cache;
import com.cache.strategy.FifoEvictionStrategy;
import java.util.Optional;

// 1. Configuração via CacheBuilder
Cache<String, String> cache = CacheBuilder.<String, String>newBuilder()
        .maxCapacity(2)
        .ttlMillis(1000) // TTL de 1 segundo
        .evictionStrategy(new FifoEvictionStrategy<>())
        .enableMetrics()
        .addListener(event -> {
            System.out.println("Evento: " + event.getEventType() + " | Chave: " + event.getKey());
        })
        .build();

// 2. Inserção
cache.put("user1", "João Silva");
cache.put("user2", "Maria Santos");

// 3. Consulta
Optional<String> user1 = cache.get("user1"); // Cache Hit!

// 4. Inserção além da capacidade máxima (2) -> FIFO remove user1
cache.put("user3", "Carlos Eduardo");

// 5. Consulta a user1
Optional<String> user1AposEviccao = cache.get("user1"); // Retorna Optional.empty() (Cache Miss)
```

---

### 3.2. Extensibilidade (*Open/Closed Principle*)

Como o desenvolvedor cliente cria sua própria estratégia de evicção **LFU (Least Frequently Used)** sem modificar nenhuma linha do código da biblioteca:

```java
import com.cache.core.CacheEntry;
import com.cache.strategy.AbstractEvictionStrategy;
import java.util.Map;

// O cliente estende AbstractEvictionStrategy aplicando o Template Method
public class LfuEvictionStrategy<K, V> extends AbstractEvictionStrategy<K, V> {

    @Override
    public void onAccess(K key) {}

    @Override
    public void onRemove(K key) {}

    @Override
    public void onClear() {}

    @Override
    protected K determineCandidate(Map<K, CacheEntry<V>> entries) {
        K lfuKey = null;
        long minCount = Long.MAX_VALUE;

        for (Map.Entry<K, CacheEntry<V>> entry : entries.entrySet()) {
            if (entry.getValue().getAccessCount() < minCount) {
                minCount = entry.getValue().getAccessCount();
                lfuKey = entry.getKey();
            }
        }
        return lfuKey;
    }
}
```

E pluga diretamente no `CacheBuilder`:

```java
Cache<String, String> cache = CacheBuilder.<String, String>newBuilder()
        .maxCapacity(10)
        .evictionStrategy(new LfuEvictionStrategy<>())
        .build();
```

---

## 🛠️ 4. Como Compilar e Executar

### Pré-requisitos:
- **Java JDK 21+** instalado.

### Execução via Linha de Comando:

```bash
# Executa a demonstração prática narrada no vídeo
executar-demo.bat

# Ou manualmente via terminal:
javac -d bin (Get-ChildItem -Path src -Recurse -Filter *.java).FullName
java -cp bin com.cache.demo.DemonstracaoPratica
java -cp bin com.cache.demo.DemonstracaoExtensibilidade
```

### Execução dos Testes:

```bash
executar-testes.bat

# Ou manualmente via terminal:
java -cp bin com.cache.CacheTest
```

### Geração do Pacote JAR da Biblioteca:

```bash
jar cvf target/in-process-cache-1.0.0.jar -C bin com
```

---

## 📄 5. Licença
Distribuído sob a licença MIT.
