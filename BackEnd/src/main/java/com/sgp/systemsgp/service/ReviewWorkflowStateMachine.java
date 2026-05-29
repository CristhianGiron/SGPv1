package com.sgp.systemsgp.service;

import com.sgp.systemsgp.exception.BadRequestException;

import java.util.Map;
import java.util.Set;

final class ReviewWorkflowStateMachine {

    private static final String DRAFT = "DRAFT";
    private static final String SUBMITTED = "SUBMITTED";
    private static final String NEEDS_CORRECTION = "NEEDS_CORRECTION";
    private static final String APPROVED = "APPROVED";

    private static final Map<String, Set<String>> ALLOWED_TRANSITIONS = Map.of(
            DRAFT, Set.of(SUBMITTED),
            SUBMITTED, Set.of(DRAFT, SUBMITTED, NEEDS_CORRECTION, APPROVED),
            NEEDS_CORRECTION, Set.of(SUBMITTED),
            APPROVED, Set.of());

    private ReviewWorkflowStateMachine() {
    }

    static void ensureEditable(
            Enum<?> status,
            String message) {

        if (is(status, APPROVED)) {
            throw new BadRequestException(message);
        }
    }

    static void ensureReviewable(
            Enum<?> status,
            String message) {

        if (!is(status, SUBMITTED)) {
            throw new BadRequestException(message);
        }
    }

    static <T extends Enum<T>> T transition(
            Enum<?> currentStatus,
            T nextStatus,
            String documentName) {

        String current = statusName(currentStatus);
        String next = statusName(nextStatus);

        if (!ALLOWED_TRANSITIONS.getOrDefault(current, Set.of()).contains(next)) {
            throw new BadRequestException(
                    "Transicion de estado no permitida para "
                            + documentName
                            + ": "
                            + current
                            + " -> "
                            + next);
        }

        return nextStatus;
    }

    static int nextCycle(Integer currentCycle) {
        return currentCycle != null ? currentCycle + 1 : 1;
    }

    private static boolean is(
            Enum<?> status,
            String expectedStatus) {

        return expectedStatus.equals(statusName(status));
    }

    private static String statusName(Enum<?> status) {
        return status != null ? status.name() : "UNKNOWN";
    }
}
