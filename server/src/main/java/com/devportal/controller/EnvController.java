package com.devportal.controller;

import com.devportal.model.Environment;
import com.devportal.service.EnvironmentService;
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
@RequestMapping("/api/envs")
public class EnvController extends BaseController{

    private final EnvironmentService environmentService;

    public EnvController(EnvironmentService environmentService) {
        this.environmentService = environmentService;
    }

    @GetMapping
    public ResponseEntity<List<Environment>> list() {
        return ResponseEntity.ok(environmentService.getAll());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<Environment> create(@RequestBody Environment env) {
        return ResponseEntity.ok(environmentService.create(env));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<Environment> update(@PathVariable UUID id, @RequestBody Environment env) {
        return ResponseEntity.ok(environmentService.update(id, env));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        environmentService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
