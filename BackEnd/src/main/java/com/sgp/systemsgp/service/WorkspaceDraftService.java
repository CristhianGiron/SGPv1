/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          WorkspaceDraftService.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Implementa la lógica de aplicación de los borradores de trabajo.
 */

package com.sgp.systemsgp.service;

import com.sgp.systemsgp.model.WorkspaceDraft;
import com.sgp.systemsgp.repository.AccountRepository;
import com.sgp.systemsgp.repository.WorkspaceDraftRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDateTime;

@Service @RequiredArgsConstructor @Transactional(readOnly = true)
public class WorkspaceDraftService {
    private final WorkspaceDraftRepository drafts;
    private final AccountRepository accounts;
    public record Snapshot(String scope, String content, long revision, LocalDateTime savedAt) {}

    public Snapshot get(String username, String scope) {
        validateScope(scope);
        var owner = accounts.findByUsernameAndDeletedFalse(username).orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN));
        return drafts.findByOwner_IdAndScope(owner.getId(), scope).map(this::snapshot).orElse(new Snapshot(scope, null, 0, null));
    }

    @Transactional
    public Snapshot save(String username, String scope, long revision, String content) {
        validateScope(scope);
        if (content != null) {
            if (content.length() > 500_000) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El borrador supera el tamaño permitido");
            try {
                if (!new com.fasterxml.jackson.databind.ObjectMapper().readTree(content).isObject()) throw new IllegalArgumentException();
            } catch (Exception exception) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El borrador debe contener un objeto JSON válido");
            }
        }
        // Serialize writes for this owner, including first creation and clearing a draft.
        var owner = accounts.lockDraftOwner(username).orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN));
        var draft = drafts.findByOwner_IdAndScope(owner.getId(), scope).orElseGet(() -> {
            var created = new WorkspaceDraft(); created.setOwner(owner); created.setScope(scope); return created;
        });
        if (revision != draft.getRevision()) throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Este borrador cambió en otra pestaña o dispositivo. Recupera la versión del servidor antes de continuar.");
        draft.setContent(content); draft.setRevision(revision + 1); draft.setSavedAt(LocalDateTime.now());
        return snapshot(drafts.saveAndFlush(draft));
    }

    private void validateScope(String scope) {
        if (scope == null || scope.length() > 200 || !scope.matches("[a-z][a-z0-9-]*(?::[a-zA-Z0-9-]+){2,4}"))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Identificador de borrador inválido");
    }
    private Snapshot snapshot(WorkspaceDraft draft) {
        return new Snapshot(draft.getScope(), draft.getContent(), draft.getRevision(), draft.getSavedAt());
    }
}
