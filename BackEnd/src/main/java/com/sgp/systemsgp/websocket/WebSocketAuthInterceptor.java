package com.sgp.systemsgp.websocket;

import com.sgp.systemsgp.config.JwtService;
import com.sgp.systemsgp.service.CustomUserDetailsService;
import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketAuthInterceptor implements HandshakeInterceptor {

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;

    @Override
    public boolean beforeHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Map<String, Object> attributes) {

        String query = request.getURI().getQuery();
        String token = extractTokenFromQuery(query);
        var origin = request.getHeaders().getOrigin();
        var protocols = request.getHeaders().get("Sec-WebSocket-Protocol");
        log.debug("WebSocket handshake origin={}, protocols={}, query={}, tokenPresent={}",
                origin,
                protocols,
                query,
                token != null && !token.isBlank());

        if ((token == null || token.isBlank()) && request instanceof ServletServerHttpRequest servletRequest) {
            List<String> authHeaders = servletRequest.getServletRequest().getHeaders("Authorization") != null
                    ? java.util.Collections.list(servletRequest.getServletRequest().getHeaders("Authorization"))
                    : List.of();
            if (!authHeaders.isEmpty()) {
                token = authHeaders.get(0);
            }
        }

        if ((token == null || token.isBlank()) && protocols != null && !protocols.isEmpty()) {
            token = protocols.get(0);
            log.debug("Using Sec-WebSocket-Protocol as token fallback");
        }

        if (token == null || token.isBlank()) {
            log.warn("WebSocket handshake rejected because token is missing");
            return false;
        }

        if (token.startsWith("Bearer ")) {
            token = token.substring(7);
        }

        try {
            String username = jwtService.extractUsername(token);
            if (username == null || username.isBlank()) {
                log.warn("WebSocket handshake rejected because username could not be extracted from token");
                return false;
            }

            var userDetails = userDetailsService.loadUserByUsername(username);
            if (!jwtService.isValid(token, userDetails)) {
                log.warn("WebSocket handshake rejected because token validation failed for username={}", username);
                return false;
            }

            attributes.put("username", username);
            log.info("WebSocket handshake accepted for username={}", username);
            return true;
        } catch (JwtException | IllegalArgumentException ex) {
            log.warn("WebSocket handshake rejected due to JWT exception", ex);
            return false;
        }
    }

    @Override
    public void afterHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Exception exception) {
    }

    private String extractTokenFromQuery(String query) {
        if (query == null || query.isBlank()) {
            return null;
        }

        for (String param : query.split("&")) {
            int equalsIndex = param.indexOf('=');
            if (equalsIndex > 0) {
                String name = param.substring(0, equalsIndex);
                String value = param.substring(equalsIndex + 1);
                if ("token".equals(name)) {
                    return URLDecoder.decode(value, StandardCharsets.UTF_8);
                }
            }
        }

        return null;
    }
}
