package com.cache.observer;

/**
 * Representa um evento disparado pela biblioteca de cache.
 *
 * @param <K> Tipo da chave
 * @param <V> Tipo do valor
 */
public class CacheEvent<K, V> {

    private final K key;
    private final V value;
    private final CacheEventType eventType;
    private final long timestamp;

    public CacheEvent(K key, V value, CacheEventType eventType) {
        this.key = key;
        this.value = value;
        this.eventType = eventType;
        this.timestamp = System.currentTimeMillis();
    }

    public K getKey() {
        return key;
    }

    public V getValue() {
        return value;
    }

    public CacheEventType getEventType() {
        return eventType;
    }

    public long getTimestamp() {
        return timestamp;
    }

    @Override
    public String toString() {
        return "CacheEvent{" +
                "type=" + eventType +
                ", key=" + key +
                ", value=" + value +
                ", timestamp=" + timestamp +
                '}';
    }
}
