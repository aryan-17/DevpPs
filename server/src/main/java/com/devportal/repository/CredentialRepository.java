package com.devportal.repository;

import com.devportal.model.Credential;
import com.devportal.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CredentialRepository extends JpaRepository<Credential, UUID> {

    List<Credential> findByProject(Project project);

    boolean existsByProjectAndKeyIgnoreCase(Project project, String key);
}
