package com.devportal.security;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

@Component
public class CookieUtil {

    public static final String ACCESS_TOKEN_COOKIE = "accessToken";
    public static final String REFRESH_TOKEN_COOKIE = "refreshToken";

    private final boolean secure;
    private final long accessTokenExpirationMinutes;
    private final long refreshTokenExpirationDays;

    public CookieUtil(
            @Value("${devportal.cookie.secure:false}") boolean secure,
            @Value("${devportal.jwt.access-token-expiration-minutes}") long accessTokenExpirationMinutes,
            @Value("${devportal.jwt.refresh-token-expiration-days}") long refreshTokenExpirationDays
    ) {
        this.secure = secure;
        this.accessTokenExpirationMinutes = accessTokenExpirationMinutes;
        this.refreshTokenExpirationDays = refreshTokenExpirationDays;
    }

    public void addTokenCookies(HttpServletResponse response,
                                String accessToken,
                                String refreshToken) {
        int accessTokenMaxAgeSeconds = (int) (accessTokenExpirationMinutes * 60);
        int refreshTokenMaxAgeSeconds = (int) (refreshTokenExpirationDays * 24 * 60 * 60);
        response.addHeader("Set-Cookie", buildCookie(ACCESS_TOKEN_COOKIE, accessToken, accessTokenMaxAgeSeconds));
        response.addHeader("Set-Cookie", buildCookie(REFRESH_TOKEN_COOKIE, refreshToken, refreshTokenMaxAgeSeconds));
    }


    public void clearTokenCookies(HttpServletResponse response) {
        response.addHeader("Set-Cookie", buildCookie(ACCESS_TOKEN_COOKIE, "", 0));
        response.addHeader("Set-Cookie", buildCookie(REFRESH_TOKEN_COOKIE, "", 0));
    }

    private String buildCookie(String name, String value, int maxAgeSeconds) {
        ResponseCookie cookie = ResponseCookie.from(name, value)
                .path("/")
                .httpOnly(true)
                .secure(secure)
                .sameSite("Strict")
                .maxAge(maxAgeSeconds)
                .build();
        return cookie.toString();
    }
}
