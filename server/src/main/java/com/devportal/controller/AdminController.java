package com.devportal.controller;

import com.devportal.model.AuditLog;
import com.devportal.model.User;
import com.devportal.service.AdminService;
import com.devportal.service.AuditService;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController extends BaseController{

    private final AdminService adminService;
    private final AuditService auditService;

    public AdminController(AdminService adminService, AuditService auditService) {
        this.adminService = adminService;
        this.auditService = auditService;
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> listUsers() {
        return ResponseEntity.ok(adminService.listUsers());
    }

    public record InviteUserRequest(
            @NotBlank String name,
            @NotBlank @Email String email,
            @NotBlank String role
    ) {
    }

    public record InviteUserResponse(UUID userId, String temporaryPassword) {
    }

    @PostMapping("/users/invite")
    public ResponseEntity<InviteUserResponse> invite(@RequestBody InviteUserRequest request) {
        User.Role role = User.Role.valueOf(request.role().toUpperCase());
        AdminService.InviteResult result = adminService.inviteUser(request.name(), request.email(), role);
        return ResponseEntity.ok(new InviteUserResponse(result.userId(), result.temporaryPassword()));
    }

    public record UpdateUserRequest(
            @NotBlank String role,
            boolean active
    ) {
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<User> updateUser(@PathVariable UUID id,
                                           @RequestBody UpdateUserRequest request) {
        User.Role role = User.Role.valueOf(request.role().toUpperCase());
        return ResponseEntity.ok(adminService.updateUser(id, role, request.active()));
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<List<AuditLog>> auditLogs() {
        return ResponseEntity.ok(auditService.listAll());
    }
}

