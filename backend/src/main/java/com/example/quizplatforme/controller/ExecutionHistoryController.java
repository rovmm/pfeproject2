package com.example.quizplatforme.controller;

import com.example.quizplatforme.DTO.Response.ExecutionResultResponse;
import com.example.quizplatforme.Model.ExecutionResult;
import com.example.quizplatforme.Model.Entity.User;
import com.example.quizplatforme.Repository.ExecutionResultRepository;
import com.example.quizplatforme.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Expose l'historique des exécutions de code de l'utilisateur authentifié.
 *
 * <h3>Sécurité de sérialisation</h3>
 * {@link ExecutionResult} contient une relation {@code @ManyToOne(LAZY)} vers {@link User}
 * et, transitif, le hash BCrypt du mot de passe. Ce contrôleur ne retourne jamais
 * l'entité brute : chaque résultat est converti en {@link ExecutionResultResponse}
 * <em>sans accéder</em> au champ {@code user}, éliminant ainsi tout risque de
 * {@code LazyInitializationException} et d'exposition de données sensibles.
 */
@RestController
@RequestMapping("/api/code")
@RequiredArgsConstructor
public class ExecutionHistoryController {

    private static final Logger log = LoggerFactory.getLogger(ExecutionHistoryController.class);

    /** Longueur maximale de l'extrait de code renvoyé dans la réponse. */
    private static final int CODE_PREVIEW_LENGTH = 200;

    private final ExecutionResultRepository executionResultRepository;
    private final UserRepository userRepository;

    // ── Endpoints ─────────────────────────────────────────────────────────────

    /**
     * GET /api/code/history
     *
     * <p>Retourne l'historique des exécutions de l'utilisateur authentifié,
     * triées de la plus récente à la plus ancienne.
     *
     * <p>La projection vers {@link ExecutionResultResponse} est effectuée
     * sans accéder à {@code ExecutionResult.user} — aucun risque de
     * {@code LazyInitializationException}.
     *
     * @param userDetails principal injecté par Spring Security
     * @return liste (éventuellement vide) des résultats d'exécution
     */
    @GetMapping("/history")
    public ResponseEntity<List<ExecutionResultResponse>> getHistory(
            @AuthenticationPrincipal UserDetails userDetails) {

        String email = userDetails.getUsername();
        log.debug("Demande d'historique d'exécution — utilisateur : {}", email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "Utilisateur introuvable : " + email));

        List<ExecutionResultResponse> history = executionResultRepository
                .findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::toResponse)
                .toList();

        return ResponseEntity.ok(history);
    }

    // ── Mapping ───────────────────────────────────────────────────────────────

    /**
     * Convertit un {@link ExecutionResult} en {@link ExecutionResultResponse}.
     *
     * <p>Règles de mapping :
     * <ul>
     *   <li>{@code code}     → tronqué à {@value CODE_PREVIEW_LENGTH} caractères</li>
     *   <li>{@code stdout}   → {@code ExecutionResult.output}</li>
     *   <li>{@code stderr}   → {@code ExecutionResult.error}</li>
     *   <li>{@code exitCode} → dérivé du statut : SUCCESS → 0, ERROR/TIMEOUT → -1</li>
     * </ul>
     *
     * Le champ {@code user} n'est <strong>jamais</strong> accédé : la relation
     * LAZY reste non initialisée, évitant LazyInitializationException.
     */
    private ExecutionResultResponse toResponse(ExecutionResult r) {
        String fullCode = r.getCode();
        String preview  = fullCode != null && fullCode.length() > CODE_PREVIEW_LENGTH
                ? fullCode.substring(0, CODE_PREVIEW_LENGTH)
                : fullCode;

        int exitCode = (r.getStatus() == ExecutionResult.ExecutionStatus.SUCCESS) ? 0 : -1;

        return ExecutionResultResponse.builder()
                .id(r.getId())
                .language(r.getLanguage())
                .code(preview)
                .stdout(r.getOutput())
                .stderr(r.getError())
                .exitCode(exitCode)
                .executionTimeMs(r.getExecutionTimeMs())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
