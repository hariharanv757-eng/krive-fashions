package com.krive.fashions.common;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Hands out sequential numbers. The row is locked while the number is taken, so two simultaneous
 * requests can never receive the same id.
 */
@Service
public class SequenceService {

    private final SequenceRepository repository;

    public SequenceService(SequenceRepository repository) {
        this.repository = repository;
    }

    /** Creates the counter row if it is missing. Called once at startup, before any traffic. */
    @Transactional
    public void ensure(String name) {
        if (repository.findById(name).isEmpty()) {
            repository.save(new SequenceCounter(name, Sequences.initialValue(name)));
        }
    }

    @Transactional
    public long next(String name) {
        SequenceCounter counter = repository.lockByName(name)
                .orElseGet(() -> repository.save(new SequenceCounter(name, Sequences.initialValue(name))));
        return counter.takeNext();
    }
}
