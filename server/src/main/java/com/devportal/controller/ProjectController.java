package com.devportal.controller;

import com.devportal.model.Project;
import com.devportal.service.ProjectService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/envs/{envId}/projects")
public class ProjectController extends BaseController{

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @GetMapping
    public ResponseEntity<List<Project>> list(@PathVariable UUID envId) {
        return ResponseEntity.ok(projectService.listByEnvironment(envId));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<Project> create(@PathVariable UUID envId, @RequestBody Project project) {
        return ResponseEntity.ok(projectService.create(envId, project));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{projectId}")
    public ResponseEntity<Project> update(@PathVariable UUID envId,
                                          @PathVariable UUID projectId,
                                          @RequestBody Project project) {
        return ResponseEntity.ok(projectService.update(envId, projectId, project));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{projectId}")
    public ResponseEntity<Void> delete(@PathVariable UUID envId, @PathVariable UUID projectId) {
        projectService.delete(envId, projectId);
        return ResponseEntity.noContent().build();
    }
}
