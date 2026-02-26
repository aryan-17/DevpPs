package com.devportal.service;

import com.devportal.model.Credential;
import com.devportal.model.CredentialType;
import com.devportal.model.Project;
import com.devportal.model.User;
import com.devportal.repository.CredentialRepository;
import com.devportal.repository.ProjectRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class CredentialService {

    private final CredentialRepository credentialRepository;
    private final ProjectRepository projectRepository;
    private final EncryptionService encryptionService;
    private final AuditService auditService;

    public CredentialService(CredentialRepository credentialRepository,
                             ProjectRepository projectRepository,
                             EncryptionService encryptionService,
                             AuditService auditService) {
        this.credentialRepository = credentialRepository;
        this.projectRepository = projectRepository;
        this.encryptionService = encryptionService;
        this.auditService = auditService;
    }

    public List<Credential> listByProject(UUID envId, UUID projectId) {
        Project project = getProjectInEnv(envId, projectId);
        return credentialRepository.findByProject(project);
    }

    public Credential create(UUID envId, UUID projectId, String key, String valuePlain, CredentialType type, String description, User user, String ip) {
        Project project = getProjectInEnv(envId, projectId);
        if (credentialRepository.existsByProjectAndKeyIgnoreCase(project, key)) {
            throw new IllegalArgumentException("Credential key already exists for this project in this environment");
        }
        CredentialType resolvedType = type != null ? type : CredentialType.SECRET;
        String encrypted = encryptionService.encrypt(valuePlain);
        Credential credential = Credential.builder()
                .project(project)
                .key(key)
                .valueEncrypted(encrypted)
                .type(resolvedType)
                .description(description)
                .updatedBy(user)
                .updatedAt(Instant.now())
                .build();
        Credential saved = credentialRepository.save(credential);
        auditService.logCredentialChange(user, saved, "CREATE_CREDENTIAL", ip);
        return saved;
    }

    public Credential update(UUID envId, UUID projectId, UUID credentialId, String key, String valuePlain, CredentialType type, String description, User user, String ip) {
        Project project = getProjectInEnv(envId, projectId);
        Credential existing = credentialRepository.findById(credentialId)
                .orElseThrow(() -> new IllegalArgumentException("Credential not found"));
        if (!existing.getProject().getId().equals(projectId)) {
            throw new IllegalArgumentException("Credential does not belong to project");
        }
        if (!existing.getKey().equalsIgnoreCase(key)
                && credentialRepository.existsByProjectAndKeyIgnoreCase(project, key)) {
            throw new IllegalArgumentException("Credential key already exists for this project in this environment");
        }
        existing.setKey(key);
        if (valuePlain != null) {
            existing.setValueEncrypted(encryptionService.encrypt(valuePlain));
        }
        existing.setType(type != null ? type : CredentialType.SECRET);
        existing.setDescription(description);
        existing.setUpdatedBy(user);
        existing.setUpdatedAt(Instant.now());
        Credential saved = credentialRepository.save(existing);
        auditService.logCredentialChange(user, saved, "UPDATE_CREDENTIAL", ip);
        return saved;
    }

    public void delete(UUID envId, UUID projectId, UUID credentialId, User user, String ip) {
        getProjectInEnv(envId, projectId);
        Credential existing = credentialRepository.findById(credentialId)
                .orElseThrow(() -> new IllegalArgumentException("Credential not found"));
        if (!existing.getProject().getId().equals(projectId)) {
            throw new IllegalArgumentException("Credential does not belong to project");
        }
        credentialRepository.delete(existing);
        auditService.logCredentialChange(user, existing, "DELETE_CREDENTIAL", ip);
    }

    public String reveal(UUID envId, UUID projectId, UUID credentialId, User user, String ip) {
        getProjectInEnv(envId, projectId);
        Credential existing = credentialRepository.findById(credentialId)
                .orElseThrow(() -> new IllegalArgumentException("Credential not found"));
        if (!existing.getProject().getId().equals(projectId)) {
            throw new IllegalArgumentException("Credential does not belong to project");
        }
        String plaintext = encryptionService.decrypt(existing.getValueEncrypted());
        auditService.logCredentialView(user, existing, ip);
        return plaintext;
    }

    private Project getProjectInEnv(UUID envId, UUID projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));
        if (project.getEnvironment() == null || project.getEnvironment().getId() == null
                || !project.getEnvironment().getId().equals(envId)) {
            throw new IllegalArgumentException("Project does not belong to environment");
        }
        return project;
    }
}
