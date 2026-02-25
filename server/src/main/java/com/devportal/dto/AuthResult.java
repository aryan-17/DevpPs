package com.devportal.dto;

/**
 * Internal result of login/refresh containing tokens and user info.
 * Tokens are set as cookies; user info is returned in response body.
 */
public record AuthResult(String accessToken, String refreshToken, String email, String role) {
}
