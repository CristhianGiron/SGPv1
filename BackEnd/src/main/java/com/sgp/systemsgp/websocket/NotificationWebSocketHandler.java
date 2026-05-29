package com.sgp.systemsgp.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationWebSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper objectMapper;

    private final Map<String, Set<WebSocketSession>> sessionsByUsername = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        String username = (String) session.getAttributes().get("username");
        log.info("WebSocket connection established, username={}", username);
        if (username == null) {
            closeSession(session);
            return;
        }

        sessionsByUsername
                .computeIfAbsent(username, key -> new CopyOnWriteArraySet<>())
                .add(session);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        String username = (String) session.getAttributes().get("username");
        log.info("WebSocket connection closed, username={}, status={}", username, status);
        if (username != null) {
            Set<WebSocketSession> sessions = sessionsByUsername.get(username);
            if (sessions != null) {
                sessions.remove(session);
                if (sessions.isEmpty()) {
                    sessionsByUsername.remove(username);
                }
            }
        }
    }

    public void sendNotification(String username, Object payload) {
        Set<WebSocketSession> sessions = sessionsByUsername.get(username);
        if (sessions == null || sessions.isEmpty()) {
            return;
        }

        try {
            String message = objectMapper.writeValueAsString(payload);
            TextMessage textMessage = new TextMessage(message);

            for (WebSocketSession session : sessions) {
                if (session.isOpen()) {
                    session.sendMessage(textMessage);
                }
            }
        } catch (IOException ignored) {
        }
    }

    private void closeSession(WebSocketSession session) {
        try {
            session.close(CloseStatus.NOT_ACCEPTABLE.withReason("No autorizado"));
        } catch (IOException ignored) {
        }
    }
}
