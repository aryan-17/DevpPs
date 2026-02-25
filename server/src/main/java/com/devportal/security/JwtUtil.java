package com.devportal.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Component
public class JwtUtil {

    private static final int MIN_KEY_BYTES = 32;

    private final Key key;
    private final long accessTokenExpirationMinutes;
    private final long refreshTokenExpirationDays;

    public JwtUtil(
            @Value("${devportal.jwt.secret}") String secret,
            @Value("${devportal.jwt.access-token-expiration-minutes}") long accessTokenExpirationMinutes,
            @Value("${devportal.jwt.refresh-token-expiration-days}") long refreshTokenExpirationDays
    ) {
        byte[] keyBytes = secretToKeyBytes(secret);
        this.key = Keys.hmacShaKeyFor(keyBytes);
        this.accessTokenExpirationMinutes = accessTokenExpirationMinutes;
        this.refreshTokenExpirationDays = refreshTokenExpirationDays;
    }

    public String generateAccessToken(String subject, Map<String, String> claims) {
        Instant now = Instant.now();
        Instant expiry = now.plus(accessTokenExpirationMinutes, ChronoUnit.MINUTES);
        Map<String, Object> payload = new HashMap<>();
        if (claims != null) {
            payload.putAll(claims);
        }
        return Jwts.builder()
                .setClaims(payload)
                .setSubject(subject)
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(expiry))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public String generateRefreshToken(String subject) {
        Instant now = Instant.now();
        Instant expiry = now.plus(refreshTokenExpirationDays, ChronoUnit.DAYS);
        return Jwts.builder()
                .setSubject(subject)
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(expiry))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public Claims parseToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    /**
     * Use Base64 if the string is valid Base64 and decodes to at least 32 bytes;
     * otherwise use UTF-8 bytes (padded/truncated to 32 bytes for HS256).
     */
    private static byte[] secretToKeyBytes(String secret) {
        if (secret == null || secret.isBlank()) {
            throw new IllegalArgumentException("JWT secret must not be blank");
        }
        try {
            byte[] decoded = Decoders.BASE64.decode(secret);
            if (decoded.length >= MIN_KEY_BYTES) {
                return decoded;
            }
            return Arrays.copyOf(decoded, MIN_KEY_BYTES);
        } catch (Exception e) {
            byte[] utf8 = secret.getBytes(StandardCharsets.UTF_8);
            return Arrays.copyOf(utf8, MIN_KEY_BYTES);
        }
    }
}

