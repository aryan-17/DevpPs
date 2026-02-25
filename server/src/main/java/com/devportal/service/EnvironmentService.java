package com.devportal.service;

import com.devportal.model.Environment;
import com.devportal.repository.EnvironmentRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class EnvironmentService {

    private final EnvironmentRepository environmentRepository;

    public EnvironmentService(EnvironmentRepository environmentRepository) {
        this.environmentRepository = environmentRepository;
    }

    public List<Environment> getAll() {
        return environmentRepository.findAll();
    }

    public Environment getById(UUID id) {
        return environmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Environment not found"));
    }

    public Environment create(Environment env) {
        if (environmentRepository.existsByNameIgnoreCase(env.getName())) {
            throw new IllegalArgumentException("Environment name already exists");
        }
        env.setId(null);
        return environmentRepository.save(env);
    }

    public Environment update(UUID id, Environment updated) {
        Environment existing = getById(id);
        existing.setName(updated.getName());
        existing.setColorCode(updated.getColorCode());
        return environmentRepository.save(existing);
    }

    public void delete(UUID id) {
        environmentRepository.deleteById(id);
    }
}
