package com.sgp.systemsgp.exception;

import com.sgp.systemsgp.dto.error.ErrorResponse;

import org.springframework.http.HttpStatus;

import org.springframework.security.access.AccessDeniedException;

import org.springframework.security.core.AuthenticationException;

import org.springframework.security.authentication.BadCredentialsException;

import org.springframework.security.authentication.DisabledException;

import org.springframework.security.authentication.LockedException;

import org.springframework.security.core.userdetails.UsernameNotFoundException;

import org.springframework.web.bind.MethodArgumentNotValidException;

import org.springframework.web.HttpRequestMethodNotSupportedException;

import org.springframework.web.bind.annotation.*;

import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.time.LocalDateTime;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

        /*
         * VALIDACIONES DTO
         */
        @ExceptionHandler(MethodArgumentNotValidException.class)

        @ResponseStatus(HttpStatus.BAD_REQUEST)

        public ErrorResponse handleValidation(
                        MethodArgumentNotValidException ex) {

                return ErrorResponse.builder()

                                .status(400)

                                .error("Error de validación")

                                .message(ex.getBindingResult()
                                                .getAllErrors()
                                                .stream()
                                                .map(error -> error.getDefaultMessage())
                                                .filter(message -> message != null && !message.isBlank())
                                                .distinct()
                                                .collect(Collectors.joining("; ")))

                                .timestamp(LocalDateTime.now())

                                .build();
        }

        /*
         * BAD REQUEST PERSONALIZADO
         */
        @ExceptionHandler(BadRequestException.class)

        @ResponseStatus(HttpStatus.BAD_REQUEST)

        public ErrorResponse handleBadRequest(
                        BadRequestException ex) {

                return build(
                                400,
                                "Solicitud inválida",
                                ex.getMessage());
        }

        /*
         * RECURSO NO ENCONTRADO
         */
        @ExceptionHandler(NotFoundException.class)

        @ResponseStatus(HttpStatus.NOT_FOUND)

        public ErrorResponse handleNotFound(
                        NotFoundException ex) {

                return build(
                                404,
                                "No encontrado",
                                ex.getMessage());
        }

        /*
         * LOGIN INCORRECTO
         */
        @ExceptionHandler(BadCredentialsException.class)

        @ResponseStatus(HttpStatus.UNAUTHORIZED)

        public ErrorResponse handleBadCredentials(
                        BadCredentialsException ex) {

                return build(
                                401,
                                "No autorizado",
                                "Credenciales incorrectas");
        }

        /*
         * CUENTA DESACTIVADA
         */
        @ExceptionHandler(DisabledException.class)

        @ResponseStatus(HttpStatus.FORBIDDEN)

        public ErrorResponse handleDisabled(
                        DisabledException ex) {

                return build(
                                403,
                                "Prohibido",
                                "Cuenta desactivada");
        }

        /*
         * CUENTA BLOQUEADA
         */
        @ExceptionHandler(LockedException.class)

        @ResponseStatus(HttpStatus.FORBIDDEN)

        public ErrorResponse handleLocked(
                        LockedException ex) {

                return build(
                                403,
                                "Prohibido",
                                "Cuenta bloqueada");
        }

        /*
         * USUARIO NO ENCONTRADO
         */
        @ExceptionHandler(UsernameNotFoundException.class)

        @ResponseStatus(HttpStatus.NOT_FOUND)

        public ErrorResponse handleUserNotFound(
                        UsernameNotFoundException ex) {

                return build(
                                404,
                                "No encontrado",
                                ex.getMessage());
        }

        /*
         * SIN AUTENTICACIÓN
         */
        @ExceptionHandler(AuthenticationException.class)

        @ResponseStatus(HttpStatus.UNAUTHORIZED)

        public ErrorResponse handleAuthentication(
                        AuthenticationException ex) {

                return build(
                                401,
                                "No autorizado",
                                "No autenticado");
        }

        /*
         * SIN PERMISOS
         */
        @ExceptionHandler(AccessDeniedException.class)

        @ResponseStatus(HttpStatus.FORBIDDEN)

        public ErrorResponse handleAccessDenied(
                        AccessDeniedException ex) {

                return build(
                                403,
                                "Prohibido",
                                "Acceso denegado");
        }

        /*
         * METODO HTTP NO SOPORTADO
         */
        @ExceptionHandler(HttpRequestMethodNotSupportedException.class)

        @ResponseStatus(HttpStatus.METHOD_NOT_ALLOWED)

        public ErrorResponse handleMethodNotSupported(
                        HttpRequestMethodNotSupportedException ex) {

                return build(
                                405,
                                "Método no permitido",
                                "Método HTTP no soportado para esta ruta");
        }

        /*
         * RUTA NO ENCONTRADA
         */
        @ExceptionHandler(NoResourceFoundException.class)

        @ResponseStatus(HttpStatus.NOT_FOUND)

        public ErrorResponse handleNoResourceFound(
                        NoResourceFoundException ex) {

                return build(
                                404,
                                "No encontrado",
                                "Ruta no encontrada");
        }

        /*
         * EXCEPCIÓN GENERAL
         */
        @ExceptionHandler(Exception.class)

        @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)

        public ErrorResponse handleException(
                        Exception ex) {

                return build(
                                500,
                                "Error interno del servidor",
                                ex.getMessage());
        }

        /*
         * HELPER
         */
        private ErrorResponse build(

                        int status,

                        String error,

                        String message) {

                return ErrorResponse.builder()

                                .status(status)

                                .error(error)

                                .message(message)

                                .timestamp(LocalDateTime.now())

                                .build();
        }
}
