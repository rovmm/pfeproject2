package com.example.quizplatforme.controller;

import com.example.quizplatforme.DTO.Request.CodeSnapshot;
import com.example.quizplatforme.DTO.Request.SaveCodingHistoryRequest;
import com.example.quizplatforme.DTO.Response.CodingHistoryResponse;
import com.example.quizplatforme.Model.Entity.CodingHistory;
import com.example.quizplatforme.Model.Entity.Session;
import com.example.quizplatforme.Model.Entity.User;
import com.example.quizplatforme.Repository.CodingHistoryRepository;
import com.example.quizplatforme.Repository.SessionRepository;
import com.example.quizplatforme.Repository.UserRepository;
import com.example.quizplatforme.exception.BadRequestException;
import com.example.quizplatforme.exception.ForbiddenException;
import com.example.quizplatforme.exception.ResourceNotFoundException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Historique de codage par étudiant/session — capture le nombre de modifications,
 * les horodatages et des instantanés périodiques du code.
 *
 * <p>N'est enregistré/exposé que si {@code Session.recordCodingHistory == true}
 * pour la lecture côté professeur ; l'enregistrement côté étudiant est toujours
 * accepté (le frontend ne l'appelle que si l'option est activée pour la session).
 */
@Slf4j
@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class CodingHistoryController {

    private final CodingHistoryRepository codingHistoryRepository;
    private final SessionRepository       sessionRepository;
    private final UserRepository          userRepository;
    private final ObjectMapper            objectMapper;

    /**
     * POST /api/sessions/{sessionId}/history/save — STUDENT only
     *
     * <p>Upsert : une seule ligne par (session, étudiant), ré-écrite à chaque appel.
     */
    @PostMapping("/{sessionId}/history/save")
    @Transactional
    public ResponseEntity<Void> saveHistory(
            @PathVariable Long sessionId,
            @Valid @RequestBody SaveCodingHistoryRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session", "id", sessionId));

        User student = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Utilisateur", "email", userDetails.getUsername()));

        boolean isMember = session.getStudents().stream()
                .anyMatch(s -> s.getId().equals(student.getId()));
        if (!isMember) {
            throw new ForbiddenException("Vous n'êtes pas inscrit à cette session.");
        }

        String snapshotsJson = toJson(request.getSnapshots());

        CodingHistory history = codingHistoryRepository
                .findBySessionIdAndStudentId(sessionId, student.getId())
                .orElseGet(() -> CodingHistory.builder()
                        .session(session)
                        .student(student)
                        .build());

        history.setEditCount(request.getEditCount());
        history.setStartedAt(request.getStartedAt());
        history.setSubmittedAt(LocalDateTime.now());
        history.setSnapshots(snapshotsJson);

        codingHistoryRepository.save(history);

        log.debug("Historique de codage enregistré — sessionId : {}, étudiant : {}",
                sessionId, student.getEmail());

        return ResponseEntity.ok().build();
    }

    /**
     * GET /api/sessions/{sessionId}/history — PROF only (propriétaire de la session)
     *
     * <p>Disponible uniquement si {@code Session.recordCodingHistory == true}.
     */
    @GetMapping("/{sessionId}/history")
    @Transactional(readOnly = true)
    public ResponseEntity<List<CodingHistoryResponse>> getHistory(
            @PathVariable Long sessionId,
            @AuthenticationPrincipal UserDetails userDetails) {

        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session", "id", sessionId));

        User prof = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Utilisateur", "email", userDetails.getUsername()));

        if (!session.getProf().getId().equals(prof.getId())) {
            throw new ForbiddenException(
                    "Accès refusé. Vous n'êtes pas le propriétaire de cette session.");
        }

        if (!session.isRecordCodingHistory()) {
            throw new ForbiddenException(
                    "L'enregistrement de l'historique de code n'est pas activé pour cette session.");
        }

        List<CodingHistoryResponse> response = codingHistoryRepository
                .findBySessionId(sessionId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    // ── Helpers privés ─────────────────────────────────────────────────────────

    private String toJson(List<CodeSnapshot> snapshots) {
        try {
            return objectMapper.writeValueAsString(snapshots != null ? snapshots : List.of());
        } catch (JsonProcessingException e) {
            throw new BadRequestException("Impossible de sérialiser les instantanés de code.");
        }
    }

    private List<CodeSnapshot> fromJson(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<CodeSnapshot>>() { });
        } catch (JsonProcessingException e) {
            log.warn("Impossible de désérialiser les instantanés de code : {}", e.getMessage());
            return List.of();
        }
    }

    private CodingHistoryResponse toResponse(CodingHistory history) {
        return CodingHistoryResponse.builder()
                .studentId(history.getStudent().getId())
                .studentName(history.getStudent().getFullName())
                .studentEmail(history.getStudent().getEmail())
                .editCount(history.getEditCount())
                .startedAt(history.getStartedAt())
                .submittedAt(history.getSubmittedAt())
                .snapshots(fromJson(history.getSnapshots()))
                .build();
    }
}
