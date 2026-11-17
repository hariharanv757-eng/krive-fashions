package com.krive.fashions.common;

import java.util.Optional;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SequenceRepository extends JpaRepository<SequenceCounter, String> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from SequenceCounter s where s.name = :name")
    Optional<SequenceCounter> lockByName(@Param("name") String name);
}
