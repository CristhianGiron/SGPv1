package com.sgp.systemsgp.config;

import java.io.IOException;
import java.time.Duration;
import java.util.Iterator;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final Map<String, RateLimitRule> RULES = Map.of(
            "POST /api/auth/login", new RateLimitRule(8, Duration.ofMinutes(1)),
            "POST /api/auth/register", new RateLimitRule(5, Duration.ofMinutes(10)),
            "POST /api/admin/accounts", new RateLimitRule(20, Duration.ofMinutes(10)),
            "POST /api/bootstrap/admin", new RateLimitRule(3, Duration.ofHours(1)),
            "PATCH /api/account/me/password", new RateLimitRule(6, Duration.ofMinutes(5)));

    private final Map<String, WindowCounter> counters = new ConcurrentHashMap<>();
    private long lastCleanupAt = System.currentTimeMillis();

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        RateLimitRule rule = resolveRule(request);

        if (rule == null) {
            filterChain.doFilter(request, response);
            return;
        }

        cleanupExpiredCounters();

        String key = request.getMethod() + " " + request.getRequestURI() + " " + clientIp(request);
        WindowCounter counter = counters.computeIfAbsent(
                key,
                ignored -> new WindowCounter(rule.window().toMillis()));

        if (!counter.tryConsume(rule)) {
            long retryAfterSeconds = Math.max(1, counter.retryAfterSeconds());
            response.setStatus(429);
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            response.setHeader("Retry-After", String.valueOf(retryAfterSeconds));
            response.getWriter().write("""
                    {"message":"Demasiados intentos. Espera un momento antes de volver a intentar."}
                    """);
            return;
        }

        filterChain.doFilter(request, response);
    }

    private RateLimitRule resolveRule(HttpServletRequest request) {
        if (HttpMethod.OPTIONS.matches(request.getMethod())) {
            return null;
        }

        return RULES.get(request.getMethod() + " " + request.getRequestURI());
    }

    private String clientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");

        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }

        String realIp = request.getHeader("X-Real-IP");

        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }

        return request.getRemoteAddr();
    }

    private void cleanupExpiredCounters() {
        long now = System.currentTimeMillis();

        if (now - lastCleanupAt < Duration.ofMinutes(5).toMillis()) {
            return;
        }

        lastCleanupAt = now;
        Iterator<Map.Entry<String, WindowCounter>> iterator = counters.entrySet().iterator();

        while (iterator.hasNext()) {
            if (iterator.next().getValue().isExpired(now)) {
                iterator.remove();
            }
        }
    }

    private record RateLimitRule(int maxRequests, Duration window) {
    }

    private static final class WindowCounter {
        private final long windowMillis;
        private long windowStartedAt;
        private int requests;

        private WindowCounter(long windowMillis) {
            this.windowMillis = windowMillis;
            this.windowStartedAt = System.currentTimeMillis();
        }

        private synchronized boolean tryConsume(RateLimitRule rule) {
            long now = System.currentTimeMillis();

            if (now - windowStartedAt >= windowMillis) {
                windowStartedAt = now;
                requests = 0;
            }

            if (requests >= rule.maxRequests()) {
                return false;
            }

            requests++;
            return true;
        }

        private synchronized long retryAfterSeconds() {
            long elapsed = System.currentTimeMillis() - windowStartedAt;
            return (windowMillis - elapsed + 999) / 1000;
        }

        private synchronized boolean isExpired(long now) {
            return now - windowStartedAt >= windowMillis * 2;
        }
    }
}
