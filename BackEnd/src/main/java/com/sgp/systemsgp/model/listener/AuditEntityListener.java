package com.sgp.systemsgp.model.listener;

import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;

import java.lang.reflect.Field;
import java.time.LocalDateTime;
import java.util.Optional;

public class AuditEntityListener {

    @PrePersist
    public void prePersist(Object entity) {

        LocalDateTime now = LocalDateTime.now();

        setIfNull(entity, "createdAt", now);
        setIfNull(entity, "updatedAt", now);
        setDeletedAtIfNeeded(entity, now);
    }

    @PreUpdate
    public void preUpdate(Object entity) {

        LocalDateTime now = LocalDateTime.now();

        setIfNull(entity, "createdAt", now);
        setValue(entity, "updatedAt", now);
        setDeletedAtIfNeeded(entity, now);
    }

    private void setDeletedAtIfNeeded(
            Object entity,
            LocalDateTime now) {

        Optional<Field> deletedField = findField(
                entity.getClass(),
                "deleted");

        if (deletedField.isEmpty()) {

            return;
        }

        try {

            Field field = deletedField.get();
            field.setAccessible(true);

            Object value = field.get(entity);

            if (Boolean.TRUE.equals(value)
                    || (field.getType().equals(boolean.class)
                            && Boolean.TRUE.equals(value))) {

                setIfNull(entity, "deletedAt", now);
            }

        } catch (IllegalAccessException ignored) {
        }
    }

    private void setIfNull(
            Object entity,
            String fieldName,
            LocalDateTime value) {

        Optional<Field> field = findField(
                entity.getClass(),
                fieldName);

        if (field.isEmpty()) {

            return;
        }

        try {

            Field target = field.get();
            target.setAccessible(true);

            if (target.get(entity) == null) {

                target.set(entity, value);
            }

        } catch (IllegalAccessException ignored) {
        }
    }

    private void setValue(
            Object entity,
            String fieldName,
            LocalDateTime value) {

        Optional<Field> field = findField(
                entity.getClass(),
                fieldName);

        if (field.isEmpty()) {

            return;
        }

        try {

            Field target = field.get();
            target.setAccessible(true);
            target.set(entity, value);

        } catch (IllegalAccessException ignored) {
        }
    }

    private Optional<Field> findField(
            Class<?> type,
            String fieldName) {

        Class<?> current = type;

        while (current != null) {

            try {

                return Optional.of(
                        current.getDeclaredField(fieldName));

            } catch (NoSuchFieldException ignored) {

                current = current.getSuperclass();
            }
        }

        return Optional.empty();
    }
}
