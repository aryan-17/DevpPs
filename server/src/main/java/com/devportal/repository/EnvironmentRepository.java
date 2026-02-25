package com.devportal.repository;

import com.devportal.model.Environment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface EnvironmentRepository extends JpaRepository<Environment, UUID> {

    boolean existsByNameIgnoreCase(String name);
}
