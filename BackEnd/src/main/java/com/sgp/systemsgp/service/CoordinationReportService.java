package com.sgp.systemsgp.service;

import com.sgp.systemsgp.dto.report.CoordinationMetricResponse;
import com.sgp.systemsgp.dto.report.CoordinationReportResponse;
import com.sgp.systemsgp.dto.report.CourseApprovalReportResponse;
import com.sgp.systemsgp.dto.report.DocumentTypeStatusReportResponse;
import com.sgp.systemsgp.dto.report.ReviewTimeReportResponse;
import com.sgp.systemsgp.model.ActivityPlan;
import com.sgp.systemsgp.model.CompletedActivityRecord;
import com.sgp.systemsgp.model.FinalReport;
import com.sgp.systemsgp.model.PracticeReport;
import com.sgp.systemsgp.repository.ActivityPlanRepository;
import com.sgp.systemsgp.repository.CompletedActivityRecordRepository;
import com.sgp.systemsgp.repository.FinalReportRepository;
import com.sgp.systemsgp.repository.PracticeReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CoordinationReportService {

    private static final String STATUS_DRAFT = "DRAFT";
    private static final String STATUS_SUBMITTED = "SUBMITTED";
    private static final String STATUS_NEEDS_CORRECTION = "NEEDS_CORRECTION";
    private static final String STATUS_APPROVED = "APPROVED";

    private final ActivityPlanRepository activityPlanRepository;
    private final PracticeReportRepository practiceReportRepository;
    private final FinalReportRepository finalReportRepository;
    private final CompletedActivityRecordRepository completedActivityRecordRepository;

    public CoordinationReportResponse coordinationReport() {

        List<ReviewDocumentSnapshot> documents = loadDocuments();

        long pending = countByStatus(documents, STATUS_SUBMITTED);
        long needsCorrection = countByStatus(documents, STATUS_NEEDS_CORRECTION);
        long approved = countByStatus(documents, STATUS_APPROVED);
        long studentsWithCorrections = documents.stream()
                .filter(document -> STATUS_NEEDS_CORRECTION.equals(document.status()))
                .map(ReviewDocumentSnapshot::studentUsername)
                .filter(Objects::nonNull)
                .distinct()
                .count();

        return CoordinationReportResponse.builder()
                .summary(List.of(
                        metric("pending", "Pendientes", pending),
                        metric("needsCorrection", "Con correcciones", needsCorrection),
                        metric("approved", "Aprobados", approved),
                        metric("studentsWithCorrections", "Estudiantes con correcciones", studentsWithCorrections),
                        metric("averageReviewHours", "Horas promedio de revision", averageReviewHours(documents))))
                .documentsByType(buildDocumentsByType(documents))
                .approvalsByCourse(buildApprovalsByCourse(documents))
                .reviewTimes(buildReviewTimes(documents))
                .build();
    }

    private List<ReviewDocumentSnapshot> loadDocuments() {

        List<ReviewDocumentSnapshot> documents = new ArrayList<>();

        activityPlanRepository.findByDeletedFalse().forEach(plan -> documents.add(
                new ReviewDocumentSnapshot(
                        "Plan de actividades",
                        courseName(plan.getCourse() != null ? plan.getCourse().getName() : null),
                        plan.getStudent() != null ? plan.getStudent().getUsername() : null,
                        plan.getStatus() != null ? plan.getStatus().name() : STATUS_DRAFT,
                        plan.getSubmittedAt(),
                        plan.getApprovedAt())));

        practiceReportRepository.findByDeletedFalse().forEach(report -> documents.add(
                new ReviewDocumentSnapshot(
                        "Informe de practicas",
                        courseName(report.getCourse() != null ? report.getCourse().getName() : null),
                        report.getStudent() != null ? report.getStudent().getUsername() : null,
                        report.getStatus() != null ? report.getStatus().name() : STATUS_DRAFT,
                        report.getSubmittedAt(),
                        report.getApprovedAt())));

        finalReportRepository.findByDeletedFalse().forEach(report -> documents.add(
                new ReviewDocumentSnapshot(
                        "Informe final",
                        courseName(report.getCourse() != null ? report.getCourse().getName() : null),
                        report.getStudent() != null ? report.getStudent().getUsername() : null,
                        report.getStatus() != null ? report.getStatus().name() : STATUS_DRAFT,
                        report.getSubmittedAt(),
                        report.getApprovedAt())));

        completedActivityRecordRepository.findByDeletedFalse().forEach(record -> documents.add(
                new ReviewDocumentSnapshot(
                        "Actividades cumplidas",
                        courseName(record.getCourse() != null ? record.getCourse().getName() : null),
                        record.getStudent() != null ? record.getStudent().getUsername() : null,
                        record.getStatus() != null ? record.getStatus().name() : STATUS_DRAFT,
                        record.getSubmittedAt(),
                        record.getApprovedAt())));

        return documents;
    }

    private List<DocumentTypeStatusReportResponse> buildDocumentsByType(
            List<ReviewDocumentSnapshot> documents) {

        Map<String, List<ReviewDocumentSnapshot>> byType = new LinkedHashMap<>();
        documents.forEach(document -> byType
                .computeIfAbsent(document.documentType(), ignored -> new ArrayList<>())
                .add(document));

        return byType.entrySet()
                .stream()
                .map(entry -> DocumentTypeStatusReportResponse.builder()
                        .documentType(entry.getKey())
                        .draft(countByStatus(entry.getValue(), STATUS_DRAFT))
                        .submitted(countByStatus(entry.getValue(), STATUS_SUBMITTED))
                        .needsCorrection(countByStatus(entry.getValue(), STATUS_NEEDS_CORRECTION))
                        .approved(countByStatus(entry.getValue(), STATUS_APPROVED))
                        .total(entry.getValue().size())
                        .build())
                .toList();
    }

    private List<CourseApprovalReportResponse> buildApprovalsByCourse(
            List<ReviewDocumentSnapshot> documents) {

        Map<String, List<ReviewDocumentSnapshot>> byCourse = new LinkedHashMap<>();
        documents.forEach(document -> byCourse
                .computeIfAbsent(document.courseName(), ignored -> new ArrayList<>())
                .add(document));

        return byCourse.entrySet()
                .stream()
                .map(entry -> CourseApprovalReportResponse.builder()
                        .courseName(entry.getKey())
                        .pending(countByStatus(entry.getValue(), STATUS_SUBMITTED))
                        .needsCorrection(countByStatus(entry.getValue(), STATUS_NEEDS_CORRECTION))
                        .approved(countByStatus(entry.getValue(), STATUS_APPROVED))
                        .averageReviewHours(averageReviewHours(entry.getValue()))
                        .build())
                .sorted(Comparator.comparing(CourseApprovalReportResponse::getCourseName))
                .toList();
    }

    private List<ReviewTimeReportResponse> buildReviewTimes(
            List<ReviewDocumentSnapshot> documents) {

        Map<String, List<ReviewDocumentSnapshot>> byType = new LinkedHashMap<>();
        documents.forEach(document -> byType
                .computeIfAbsent(document.documentType(), ignored -> new ArrayList<>())
                .add(document));

        return byType.entrySet()
                .stream()
                .map(entry -> ReviewTimeReportResponse.builder()
                        .documentType(entry.getKey())
                        .reviewedDocuments(countReviewedDocuments(entry.getValue()))
                        .averageReviewHours(averageReviewHours(entry.getValue()))
                        .build())
                .toList();
    }

    private CoordinationMetricResponse metric(
            String key,
            String label,
            long value) {

        return metric(key, label, String.valueOf(value));
    }

    private CoordinationMetricResponse metric(
            String key,
            String label,
            Double value) {

        return metric(key, label, value != null ? String.valueOf(value) : "0");
    }

    private CoordinationMetricResponse metric(
            String key,
            String label,
            String value) {

        return CoordinationMetricResponse.builder()
                .key(key)
                .label(label)
                .value(value)
                .build();
    }

    private long countByStatus(
            List<ReviewDocumentSnapshot> documents,
            String status) {

        return documents.stream()
                .filter(document -> status.equals(document.status()))
                .count();
    }

    private long countReviewedDocuments(List<ReviewDocumentSnapshot> documents) {

        return documents.stream()
                .filter(document -> reviewHours(document) != null)
                .count();
    }

    private Double averageReviewHours(List<ReviewDocumentSnapshot> documents) {

        List<Double> hours = documents.stream()
                .map(this::reviewHours)
                .filter(Objects::nonNull)
                .toList();

        if (hours.isEmpty()) {
            return null;
        }

        double average = hours.stream()
                .mapToDouble(Double::doubleValue)
                .average()
                .orElse(0);

        return Math.round(average * 10.0) / 10.0;
    }

    private Double reviewHours(ReviewDocumentSnapshot document) {

        if (document.submittedAt() == null || document.approvedAt() == null) {
            return null;
        }

        long minutes = Duration.between(
                        document.submittedAt(),
                        document.approvedAt())
                .toMinutes();

        if (minutes < 0) {
            return null;
        }

        return minutes / 60.0;
    }

    private String courseName(String value) {
        return value != null && !value.isBlank() ? value : "Sin curso";
    }

    private record ReviewDocumentSnapshot(
            String documentType,
            String courseName,
            String studentUsername,
            String status,
            LocalDateTime submittedAt,
            LocalDateTime approvedAt) {
    }
}
