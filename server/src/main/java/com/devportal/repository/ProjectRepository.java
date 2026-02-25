package com.devportal.repository;

import com.devportal.model.Environment;
import com.devportal.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ProjectRepository extends JpaRepository<Project, UUID> {

    List<Project> findByEnvironment(Environment environment);

    boolean existsByEnvironmentAndNameIgnoreCase(Environment environment, String name);
}
