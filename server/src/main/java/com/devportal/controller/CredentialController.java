package com.devportal.controller;

import com.devportal.dto.CredentialRequest;
import com.devportal.dto.CredentialResponse;
import com.devportal.model.Credential;
import com.devportal.model.User;
import com.devportal.repository.UserRepository;
import com.devportal.service.CredentialService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/envs/{envId}/projects/{projectId}/credentials")
public class CredentialController extends BaseController {

    private final CredentialService credentialService;
    private final UserRepository userRepository;

    public CredentialController(CredentialService credentialService,
                                UserRepository userRepository) {
        this.credentialService = credentialService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<List<CredentialResponse>> list(@PathVariable UUID envId,
                                                         @PathVariable UUID projectId) {
        List<Credential> creds = credentialService.listByProject(envId, projectId);
        List<CredentialResponse> response = creds.stream()
                .map(this::toResponseMasked)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{credentialId}/reveal")
    public ResponseEntity<CredentialResponse> reveal(@PathVariable UUID envId,
                                                     @PathVariable UUID projectId,
                                                     @PathVariable UUID credentialId,
                                                     HttpServletRequest request) {
        User user = currentUser();
        String ip = request.getRemoteAddr();
        String value = credentialService.reveal(envId, projectId, credentialId, user, ip);

        List<Credential> creds = credentialService.listByProject(envId, projectId);
        Credential cred = creds.stream()
                .filter(c -> c.getId().equals(credentialId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Credential not found"));

        CredentialResponse r = toResponseMasked(cred);
        r.setValue(value);
        return ResponseEntity.ok(r);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<CredentialResponse> create(@PathVariable UUID envId,
                                                     @PathVariable UUID projectId,
                                                     @Valid @RequestBody CredentialRequest request,
                                                     HttpServletRequest httpRequest) {
        User user = currentUser();
        String ip = httpRequest.getRemoteAddr();
        Credential c = credentialService.create(envId, projectId, request.getKey(), request.getValue(),
                request.getType(), request.getDescription(), user, ip);
        return ResponseEntity.ok(toResponseMasked(c));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{credentialId}")
    public ResponseEntity<CredentialResponse> update(@PathVariable UUID envId,
                                                     @PathVariable UUID projectId,
                                                     @PathVariable UUID credentialId,
                                                     @Valid @RequestBody CredentialRequest request,
                                                     HttpServletRequest httpRequest) {
        User user = currentUser();
        String ip = httpRequest.getRemoteAddr();
        Credential c = credentialService.update(envId, projectId, credentialId, request.getKey(), request.getValue(),
                request.getType(), request.getDescription(), user, ip);
        return ResponseEntity.ok(toResponseMasked(c));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{credentialId}")
    public ResponseEntity<Void> delete(@PathVariable UUID envId,
                                       @PathVariable UUID projectId,
                                       @PathVariable UUID credentialId,
                                       HttpServletRequest httpRequest) {
        User user = currentUser();
        String ip = httpRequest.getRemoteAddr();
        credentialService.delete(envId, projectId, credentialId, user, ip);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Integer> importCsv(@PathVariable UUID envId,
                                             @PathVariable UUID projectId,
                                             @RequestParam("file") MultipartFile file,
                                             HttpServletRequest httpRequest) throws Exception {
        User user = currentUser();
        String ip = httpRequest.getRemoteAddr();
        int count = 0;
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                if (line.isBlank() || line.startsWith("#")) {
                    continue;
                }
                String[] parts = line.split(",", -1);
                if (parts.length < 2) {
                    continue;
                }
                String key = parts[0].trim();
                String value = parts[1].trim();
                String type = parts.length > 2 ? parts[2].trim() : null;
                String description = parts.length > 3 ? parts[3].trim() : null;
                credentialService.create(envId, projectId, key, value, type, description, user, ip);
                count++;
            }
        }
        return ResponseEntity.ok(count);
    }

    private CredentialResponse toResponseMasked(Credential c) {
        CredentialResponse r = new CredentialResponse();
        r.setId(c.getId());
        r.setProjectId(c.getProject().getId());
        r.setKey(c.getKey());
        r.setValue("***");
        r.setType(c.getType());
        r.setDescription(c.getDescription());
        if (c.getUpdatedBy() != null) {
            r.setUpdatedByUserId(c.getUpdatedBy().getId());
        }
        r.setUpdatedAt(c.getUpdatedAt());
        return r;
    }

    private User currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }
}
