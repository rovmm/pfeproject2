package com.example.quizplatforme.controller;

import com.example.quizplatforme.DTO.Response.AiAnalysisResponse;
import com.example.quizplatforme.Model.ExecutionResult;
import com.example.quizplatforme.Repository.ExecutionResultRepository;
import com.example.quizplatforme.Service.IGroqAiService;
import com.example.quizplatforme.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoint d'analyse pédagogique de code via l'IA Groq.
 *
 * <p>Permet à un utilisateur authentifié d'obtenir une explication en français
 * d'une erreur d'exécution précédemment enregistrée dans l'historique.
 */
@Slf4j
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final IGroqAiService            groqAiService;
    private final ExecutionResultRepository executionResultRepository;

    /**
     * GET /api/ai/analyze/{executionId}
     *
     * <p>Récupère un résultat d'exécution par son identifiant et demande à Groq
     * d'en générer une analyse pédagogique structurée en français.
     *
     * @param executionId identifiant du résultat d'exécution à analyser
     * @param userDetails principal Spring Security de l'utilisateur authentifié
     * @return {@link AiAnalysisResponse} contenant le code, l'erreur et l'analyse
     * @throws ResourceNotFoundException (404) si l'identifiant est inconnu
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

        String analysis = groqAiService.analyzeError(
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
}
