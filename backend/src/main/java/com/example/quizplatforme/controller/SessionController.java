package com.example.quizplatforme.controller;

import com.example.quizplatforme.DTO.Request.CreateSessionRequest;
import com.example.quizplatforme.DTO.Request.DuplicateSessionRequest;
import com.example.quizplatforme.DTO.Request.SubmitCodeRequest;
import com.example.quizplatforme.DTO.Response.ParticipantPresenceResponse;
import com.example.quizplatforme.DTO.Response.SessionResponse;
import com.example.quizplatforme.DTO.Response.StudentSubmissionResponse;
import com.example.quizplatforme.Service.ISessionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class SessionController {

    private final ISessionService sessionService;

    /**
     * POST /api/sessions/create — PROF only
     */
    @PostMapping("/create")
    public ResponseEntity<SessionResponse> createSession(
            @Valid @RequestBody CreateSessionRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(sessionService.createSession(request, userDetails.getUsername()));
    }

    /**
     * GET /api/sessions/my — PROF only
     */
    @GetMapping("/my")
    public ResponseEntity<List<SessionResponse>> getMySessions(
            @AuthenticationPrincipal UserDetails userDetails) {

        return ResponseEntity.ok(sessionService.getMySessions(userDetails.getUsername()));
    }

    /**
     * GET /api/sessions/my/student — STUDENT only
     */
    @GetMapping("/my/student")
    public ResponseEntity<List<SessionResponse>> getMyStudentSessions(
            @AuthenticationPrincipal UserDetails userDetails) {

        return ResponseEntity.ok(sessionService.getMyStudentSessions(userDetails.getUsername()));
    }

    /**
     * POST /api/sessions/join/{code} — STUDENT only
     */
    @PostMapping("/join/{code}")
    public ResponseEntity<SessionResponse> joinSession(
            @PathVariable String code,
            @AuthenticationPrincipal UserDetails userDetails) {

        return ResponseEntity.ok(sessionService.joinSession(code, userDetails.getUsername()));
    }

    /**
     * GET /api/sessions/{id} — any authenticated user
     */
    @GetMapping("/{id}")
    public ResponseEntity<SessionResponse> getSessionById(@PathVariable Long id) {
        return ResponseEntity.ok(sessionService.getSessionById(id));
    }

    /**
     * PUT /api/sessions/{id}/close — PROF only (ownership checked in service)
     */
    @PutMapping("/{id}/close")
    public ResponseEntity<SessionResponse> closeSession(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        return ResponseEntity.ok(sessionService.closeSession(id, userDetails.getUsername()));
    }

    /**
     * POST /api/sessions/{id}/submit — STUDENT only
     */
    @PostMapping("/{id}/submit")
    public ResponseEntity<StudentSubmissionResponse> submitCode(
            @PathVariable Long id,
            @Valid @RequestBody SubmitCodeRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        return ResponseEntity.ok(
                sessionService.submitCode(id, request, userDetails.getUsername()));
    }

    /**
     * GET /api/sessions/{id}/submissions — PROF only
     */
    @GetMapping("/{id}/submissions")
    public ResponseEntity<List<StudentSubmissionResponse>> getSubmissions(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        return ResponseEntity.ok(
                sessionService.getSubmissions(id, userDetails.getUsername()));
    }

    /**
     * POST /api/sessions/{id}/heartbeat — STUDENT only
     *
     * <p>Signale que l'étudiant est toujours actif sur la session live. Appelé
     * périodiquement par le client pendant qu'il a la page ouverte.
     */
    @PostMapping("/{id}/heartbeat")
    public ResponseEntity<Void> heartbeat(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        sessionService.heartbeat(id, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }

    /**
     * GET /api/sessions/{id}/presence — PROF only
     *
     * <p>Retourne, pour chaque étudiant ayant rejoint la session, son statut de
     * présence (en ligne / parti) déduit de son dernier heartbeat.
     */
    @GetMapping("/{id}/presence")
    public ResponseEntity<List<ParticipantPresenceResponse>> getPresence(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        return ResponseEntity.ok(
                sessionService.getPresence(id, userDetails.getUsername()));
    }

    /**
     * POST /api/sessions/{id}/duplicate — PROF only
     */
    @PostMapping("/{id}/duplicate")
    public ResponseEntity<SessionResponse> duplicateSession(
            @PathVariable Long id,
            @RequestBody(required = false) DuplicateSessionRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        DuplicateSessionRequest req = request != null ? request : new DuplicateSessionRequest();
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(sessionService.duplicateSession(id, req, userDetails.getUsername()));
    }

    /**
     * DELETE /api/sessions/{id} — PROF only (ownership checked in service)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSession(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        sessionService.deleteSession(id, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }
}
