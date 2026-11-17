package com.krive.fashions.common;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** A named, database-backed counter used to hand out KF-001 / ORD-1043 style ids safely. */
@Entity
@Table(name = "id_sequences")
public class SequenceCounter {

    @Id
    @Column(length = 40)
    private String name;

    @Column(nullable = false)
    private long nextValue;

    protected SequenceCounter() {
    }

    public SequenceCounter(String name, long nextValue) {
        this.name = name;
        this.nextValue = nextValue;
    }

    public String getName() {
        return name;
    }

    public long getNextValue() {
        return nextValue;
    }

    /** Returns the current value and advances the counter. */
    public long takeNext() {
        long value = nextValue;
        nextValue++;
        return value;
    }
}
