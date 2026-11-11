/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          NotificationSessionRevocationTest.java
 * @fecha         2026-11-10 21:24:04
 * @nota          Comprueba el comportamiento de las notificaciones mediante pruebas de regresión.
 */

package com.sgp.systemsgp.websocket;
import com.sgp.systemsgp.service.AuthSessionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.web.socket.*;
import java.util.*;
import static org.mockito.Mockito.*;
class NotificationSessionRevocationTest {
 @Test void aRevokedConnectionIsClosedBeforeAnyNotificationIsSent()throws Exception{
  var auth=mock(AuthSessionService.class);var socket=mock(WebSocketSession.class);
  when(socket.getAttributes()).thenReturn(Map.of("username","ana","accessToken","revoked-token"));
  when(socket.isOpen()).thenReturn(true);when(auth.isAccessAllowed("revoked-token")).thenReturn(false);
  var handler=new NotificationWebSocketHandler(new ObjectMapper(),auth);handler.afterConnectionEstablished(socket);
  handler.sendNotification("ana",Map.of("message","Contenido reservado"));
  verify(socket,never()).sendMessage(any());verify(socket).close(any(CloseStatus.class));
 }
}
