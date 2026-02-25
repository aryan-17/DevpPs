package com.devportal.service;

import com.devportal.model.User;
import com.devportal.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom secureRandom = new SecureRandom();

    public AdminService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<User> listUsers() {
        return userRepository.findAll();
    }

    public InviteResult inviteUser(String name, String email, User.Role role) {
        String rawPassword = generateRandomPassword();
        User user = User.builder()
                .name(name)
                .email(email)
                .role(role)
                .passwordHash(passwordEncoder.encode(rawPassword))
                .active(true)
                .build();
        User saved = userRepository.save(user);
        return new InviteResult(saved.getId(), rawPassword);
    }

    public User updateUser(UUID id, User.Role role, boolean active) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setRole(role);
        user.setActive(active);
        return userRepository.save(user);
    }

    private String generateRandomPassword() {
        byte[] bytes = new byte[12];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    public record InviteResult(UUID userId, String temporaryPassword) {
    }
}

