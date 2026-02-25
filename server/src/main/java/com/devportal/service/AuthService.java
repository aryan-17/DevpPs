package com.devportal.service;

import com.devportal.dto.AuthResult;
import com.devportal.dto.LoginRequest;
import com.devportal.model.User;
import com.devportal.repository.UserRepository;
import com.devportal.security.JwtUtil;
import io.jsonwebtoken.Claims;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    public AuthService(AuthenticationManager authenticationManager,
                       UserRepository userRepository,
                       JwtUtil jwtUtil,
                       PasswordEncoder passwordEncoder) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = passwordEncoder;
    }

    public AuthResult login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmailIgnoreCase(request.getEmail())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        Map<String, String> claims = new HashMap<>();
        claims.put("role", user.getRole().name());

        String accessToken = jwtUtil.generateAccessToken(user.getEmail(), claims);
        String refreshToken = jwtUtil.generateRefreshToken(user.getEmail());
        return new AuthResult(accessToken, refreshToken, user.getEmail(), user.getRole().name());
    }

    public AuthResult refresh(String refreshToken) {
        Claims claims = jwtUtil.parseToken(refreshToken);
        String email = claims.getSubject();
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        Map<String, String> newClaims = new HashMap<>();
        newClaims.put("role", user.getRole().name());

        String newAccessToken = jwtUtil.generateAccessToken(user.getEmail(), newClaims);
        String newRefreshToken = jwtUtil.generateRefreshToken(user.getEmail());
        return new AuthResult(newAccessToken, newRefreshToken, user.getEmail(), user.getRole().name());
    }

    /**
     * One-time bootstrap: create an admin only if no admin exists yet.
     *
     * @throws IllegalStateException if an admin already exists
     * @throws IllegalArgumentException if email is already registered
     */
    public User createBootstrapAdmin(String name, String email, String rawPassword) {
        if (userRepository.existsByRole(User.Role.ADMIN)) {
            throw new IllegalStateException("An admin already exists. Bootstrap is only allowed once.");
        }
        if (userRepository.findByEmailIgnoreCase(email).isPresent()) {
            throw new IllegalArgumentException("User with this email already exists.");
        }
        User user = User.builder()
                .name(name)
                .email(email)
                .passwordHash(passwordEncoder.encode(rawPassword))
                .role(User.Role.ADMIN)
                .active(true)
                .build();
        return userRepository.save(user);
    }

    /**
     * Utility method to easily bootstrap an admin user if none exists.
     */
    public void ensureDefaultAdmin(String name, String email, String rawPassword) {
        userRepository.findByEmailIgnoreCase(email).orElseGet(() -> {
            User user = User.builder()
                    .name(name)
                    .email(email)
                    .passwordHash(passwordEncoder.encode(rawPassword))
                    .role(User.Role.ADMIN)
                    .active(true)
                    .build();
            return userRepository.save(user);
        });
    }
}

