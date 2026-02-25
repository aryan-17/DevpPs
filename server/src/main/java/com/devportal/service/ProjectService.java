package com.devportal.service;

import com.devportal.model.Environment;
import com.devportal.model.Project;
import com.devportal.repository.EnvironmentRepository;
import com.devportal.repository.ProjectRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final EnvironmentRepository environmentRepository;

    public ProjectService(ProjectRepository projectRepository,
                         EnvironmentRepository environmentRepository) {
        this.projectRepository = projectRepository;
        this.environmentRepository = environmentRepository;
    }

    public List<Project> listByEnvironment(UUID envId) {
        Environment env = environmentRepository.findById(envId)
                .orElseThrow(() -> new IllegalArgumentException("Environment not found"));
        return projectRepository.findByEnvironment(env);
    }

    public Project getById(UUID id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));
    }

    public Project create(UUID envId, Project project) {
        Environment env = environmentRepository.findById(envId)
                .orElseThrow(() -> new IllegalArgumentException("Environment not found"));
        if (projectRepository.existsByEnvironmentAndNameIgnoreCase(env, project.getName())) {
            throw new IllegalArgumentException("Project name already exists in this environment");
        }
        project.setId(null);
        project.setEnvironment(env);
        return projectRepository.save(project);
    }

    public Project update(UUID envId, UUID projectId, Project updated) {
        Project existing = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));
        if (!existing.getEnvironment().getId().equals(envId)) {
            throw new IllegalArgumentException("Project does not belong to environment");
        }
        if (!existing.getName().equalsIgnoreCase(updated.getName())
                && projectRepository.existsByEnvironmentAndNameIgnoreCase(existing.getEnvironment(), updated.getName())) {
            throw new IllegalArgumentException("Project name already exists in this environment");
        }
        existing.setName(updated.getName());
        existing.setDescription(updated.getDescription());
        existing.setTeam(updated.getTeam());
        existing.setStatus(updated.getStatus());
        return projectRepository.save(existing);
    }

    public void delete(UUID envId, UUID projectId) {
        Project existing = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));
        if (!existing.getEnvironment().getId().equals(envId)) {
            throw new IllegalArgumentException("Project does not belong to environment");
        }
        projectRepository.delete(existing);
    }
}
