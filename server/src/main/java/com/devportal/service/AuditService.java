package com.devportal.service;

import com.devportal.model.AuditLog;
import com.devportal.model.Credential;
import com.devportal.model.Environment;
import com.devportal.model.Project;
import com.devportal.model.User;
import com.devportal.repository.AuditLogRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public void logCredentialView(User user, Credential credential, String ipAddress) {
        Project project = credential.getProject();
        Environment env = project != null ? project.getEnvironment() : null;
        AuditLog log = AuditLog.builder()
                .user(user)
                .environment(env)
                .project(project)
                .action("VIEW_CREDENTIAL")
                .credentialKey(credential.getKey())
                .ipAddress(ipAddress)
                .createdAt(Instant.now())
                .build();
        auditLogRepository.save(log);
    }

    public void logCredentialChange(User user, Credential credential, String action, String ipAddress) {
        Project project = credential.getProject();
        Environment env = project != null ? project.getEnvironment() : null;
        AuditLog log = AuditLog.builder()
                .user(user)
                .environment(env)
                .project(project)
                .action(action)
                .credentialKey(credential.getKey())
                .ipAddress(ipAddress)
                .createdAt(Instant.now())
                .build();
        auditLogRepository.save(log);
    }

    public List<AuditLog> listAll() {
        return auditLogRepository.findAllWithDetails();
    }
}
