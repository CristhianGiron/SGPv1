/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          NotificationWebSocketConfig.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Implementa el componente NotificationWebSocketConfig del backend del SGP.
 */

package com.sgp.systemsgp.websocket;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Slf4j
@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class NotificationWebSocketConfig implements WebSocketConfigurer {

    private final NotificationWebSocketHandler notificationWebSocketHandler;
    private final WebSocketAuthInterceptor webSocketAuthInterceptor;

    @Value("${app.network.host:localhost}")
    private String networkHost;

    @Value("${app.network.frontend-port:3000}")
    private String frontendPort;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        log.info("Registering WebSocket handler at /ws/notifications");
        registry
                .addHandler(notificationWebSocketHandler, "/ws/notifications")
                .addInterceptors(webSocketAuthInterceptor)
                .setAllowedOrigins(
                        "http://localhost:" + frontendPort,
                        "http://127.0.0.1:" + frontendPort,
                        "http://" + networkHost + ":" + frontendPort,
                        "https://sgpv1.netlify.app");
    }
}
