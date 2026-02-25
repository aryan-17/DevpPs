package com.devportal.controller;

import com.devportal.dto.AuthResult;
import com.devportal.dto.AuthUserResponse;
import com.devportal.dto.BootstrapAdminRequest;
import com.devportal.dto.LoginRequest;
import com.devportal.model.User;
import com.devportal.security.CookieUtil;
import com.devportal.service.AuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController extends BaseController {

    private final AuthService authService;
    private final CookieUtil cookieUtil;

    public AuthController(AuthService authService, CookieUtil cookieUtil) {
        this.authService = authService;
        this.cookieUtil = cookieUtil;
    }

    /**
     * One-time bootstrap: create the first admin. No auth required.
     * Returns 201 on success, 409 if an admin already exists, 400 if email already used.
     */
    @PostMapping("/bootstrap-admin")
    public ResponseEntity<?> bootstrapAdmin(@Valid @RequestBody BootstrapAdminRequest request) {
        try {
            User user = authService.createBootstrapAdmin(
                    request.getName(),
                    request.getEmail(),
                    request.getPassword()
            );
            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(Map.of(
                            "id", user.getId().toString(),
                            "email", user.getEmail(),
                            "message", "Admin created. Use /api/auth/login with this email and password."
                    ));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<AuthUserResponse> login(@Valid @RequestBody LoginRequest request,
                                                  HttpServletResponse response) {
        AuthResult result = authService.login(request);
        cookieUtil.addTokenCookies(response, result.accessToken(), result.refreshToken());
        return ResponseEntity.ok(new AuthUserResponse(result.email(), result.role()));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthUserResponse> refresh(
            @CookieValue(name = CookieUtil.REFRESH_TOKEN_COOKIE, required = false) String refreshTokenFromCookie,
            HttpServletRequest request,
            HttpServletResponse response) {
        String refreshToken = refreshTokenFromCookie;
        if (!org.springframework.util.StringUtils.hasText(refreshToken)) {
            refreshToken = getCookieValue(request, CookieUtil.REFRESH_TOKEN_COOKIE).orElse(null);
        }
        if (refreshToken == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        AuthResult result = authService.refresh(refreshToken);
        cookieUtil.addTokenCookies(response, result.accessToken(), result.refreshToken());
        return ResponseEntity.ok(new AuthUserResponse(result.email(), result.role()));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletResponse response) {
        cookieUtil.clearTokenCookies(response);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public ResponseEntity<AuthUserResponse> me() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String email = auth.getName();
        String role = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(a -> a.startsWith("ROLE_"))
                .map(a -> a.substring(5))
                .findFirst()
                .orElse("DEVELOPER");
        return ResponseEntity.ok(new AuthUserResponse(email, role));
    }

    private Optional<String> getCookieValue(HttpServletRequest request, String name) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) return Optional.empty();
        return Arrays.stream(cookies)
                .filter(c -> name.equals(c.getName()))
                .map(Cookie::getValue)
                .findFirst();
    }
}
