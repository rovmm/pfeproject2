package com.example.quizplatforme.controller;

import com.example.quizplatforme.DTO.Request.AiChatRequest;
import com.example.quizplatforme.DTO.Response.AiAnalysisResponse;
import com.example.quizplatforme.DTO.Response.AiChatResponse;
import com.example.quizplatforme.Model.Entity.Session;
import com.example.quizplatforme.Model.Enum.SessionStatus;
import com.example.quizplatforme.Model.ExecutionResult;
import com.example.quizplatforme.Repository.ExecutionResultRepository;
import com.example.quizplatforme.Repository.SessionRepository;
import com.example.quizplatforme.Service.IAiService;
import com.example.quizplatforme.exception.ForbiddenException;
import com.example.quizplatforme.exception.ResourceNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoints d'intelligence artificielle : analyse pédagogique de code et
 * assistant conversationnel, tous deux via l'API Grok.
 */
@Slf4j
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private static final String CHAT_SYSTEM_PROMPT =
            "You are an expert programming tutor for university students in Computer Science. "
            + "You ONLY answer questions about: programming languages (C, C++, Java, Python, JavaScript, "
            + "TypeScript, PHP, C#, Go, Rust), web development (HTML, CSS, React, Node.js, Express, Next.js), "
            + "databases (SQL, MySQL, PostgreSQL, MongoDB), data structures, algorithms, OOP, operating systems, "
            + "computer networks, and cybersecurity. If the user asks about anything outside of Computer Science "
            + "and programming, politely refuse and redirect them to a programming topic. Always respond in the "
            + "same language the user used (French or English). Format code blocks with proper markdown.";

    private final IAiService                aiService;
    private final ExecutionResultRepository executionResultRepository;
    private final SessionRepository         sessionRepository;

    /**
     * GET /api/ai/analyze/{executionId}
     *
     * <p>Récupère un résultat d'exécution par son identifiant et demande à Grok
     * d'en générer une analyse pédagogique structurée en français.
     *
     * <p>Si l'exécution est liée à une session dont {@code allowAI == false} et qui est
     * encore {@code OPEN}, l'analyse est refusée (403) — la restriction est levée
     * une fois la session fermée.
     *
     * @param executionId identifiant du résultat d'exécution à analyser
     * @param userDetails principal Spring Security de l'utilisateur authentifié
     * @return {@link AiAnalysisResponse} contenant le code, l'erreur et l'analyse
     * @throws ResourceNotFoundException (404) si l'identifiant est inconnu
     * @throws ForbiddenException        (403) si l'IA est désactivée pour la session en cours
     */
    @GetMapping("/analyze/{executionId}")
    public ResponseEntity<AiAnalysisResponse> analyzeExecution(
            @PathVariable Long executionId,
            @AuthenticationPrincipal UserDetails userDetails) {

        log.info("Demande d'analyse IA — executionId : {}, utilisateur : '{}'",
                executionId, userDetails.getUsername());

        ExecutionResult result = executionResultRepository.findById(executionId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Résultat d'exécution", "id", executionId));

        Session session = result.getSession();
        if (session != null && !session.isAllowAI() && session.getStatus() == SessionStatus.OPEN) {
            throw new ForbiddenException("AI Assistant is disabled during this session.");
        }

        String analysis = aiService.analyzeError(
                result.getCode(),
                result.getError(),
                result.getOutput(),
                result.getLanguage()
        );

        AiAnalysisResponse response = AiAnalysisResponse.builder()
                .executionId(executionId)
                .language(result.getLanguage())
                .code(result.getCode())
                .error(result.getError())
                .analysis(analysis)
                .build();

        log.info("Analyse IA terminée — executionId : {}", executionId);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/ai/chat — STUDENT et PROF (rôles imposés par {@code SecurityConfig})
     *
     * <p>Assistant IA conversationnel, restreint aux sujets d'informatique/programmation
     * par le prompt système. Si {@code sessionId} est fourni et que la session associée
     * a {@code allowAI == false} et est encore {@code OPEN}, la requête est refusée (403).
     *
     * @param request     message, historique de conversation et session optionnelle
     * @param userDetails principal Spring Security de l'utilisateur authentifié
     * @return {@link AiChatResponse} contenant la réponse de l'IA
     * @throws ForbiddenException (403) si l'IA est désactivée pour la session en cours
     */
    @PostMapping("/chat")
    public ResponseEntity<AiChatResponse> chat(
            @Valid @RequestBody AiChatRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        log.info("Demande de chat IA — utilisateur : '{}', sessionId : {}",
                userDetails.getUsername(), request.getSessionId());

        if (request.getSessionId() != null) {
            Session session = sessionRepository.findById(request.getSessionId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Session", "id", request.getSessionId()));

            if (!session.isAllowAI() && session.getStatus() == SessionStatus.OPEN) {
                throw new ForbiddenException("AI Assistant is disabled during this session.");
            }
        }

        String reply = aiService.chat(
                CHAT_SYSTEM_PROMPT,
                request.getConversationHistory(),
                request.getMessage()
        );

        return ResponseEntity.ok(
                AiChatResponse.builder()
                        .reply(reply)
                        .blocked(false)
                        .build());
    }
}
