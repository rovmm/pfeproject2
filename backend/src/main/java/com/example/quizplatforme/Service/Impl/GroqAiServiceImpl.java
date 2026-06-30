package com.example.quizplatforme.Service.Impl;

import com.example.quizplatforme.Service.IGroqAiService;
import com.example.quizplatforme.exception.BadRequestException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.util.List;
import java.util.Map;

/**
 * Implémentation du service d'analyse pédagogique de code via l'API Groq.
 *
 * <p>Utilise le modèle {@code llama-3.3-70b-versatile} exposé par Groq
 * ({@code https://api.groq.com/openai/v1}) pour analyser les erreurs de code
 * étudiant et fournir une explication structurée en français.
 *
 * <p>Configuration requise dans {@code application.properties} :
 * <ul>
 *   <li>{@code grok.api.url} — URL de base de l'API Groq</li>
 *   <li>{@code grok.api.key} — clé API Groq (via variable d'environnement {@code GROQ_API_KEY})</li>
 * </ul>
 */
@Slf4j
@Service
public class GroqAiServiceImpl implements IGroqAiService {

    private final WebClient webClient;

    @Value("${grok.api.key}")
    private String apiKey;

    public GroqAiServiceImpl(@Value("${grok.api.url}") String apiUrl) {
        this.webClient = WebClient.builder()
                .baseUrl(apiUrl)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    // ── API publique ───────────────────────────────────────────────────────────

    /**
     * {@inheritDoc}
     *
     * <p>Structure du prompt envoyé à Groq :
     * <ol>
     *   <li>Message système : rôle d'assistant pédagogique francophone</li>
     *   <li>Message utilisateur : code, erreur, sortie et langage fournis en contexte</li>
     * </ol>
     *
     * <p>La réponse suit un format pédagogique structuré en 4 points :
     * cause, détail technique, solution, conseil.
     */
    @Override
    public String analyzeError(String code, String error, String output, String language) {

        if (code == null || code.isBlank()) {
            throw new BadRequestException("Le code à analyser ne peut pas être vide.");
        }

        String userMessage = String.format("""
                Tu es un assistant pédagogique expert en programmation.
                Analyse le code %s suivant et explique l'erreur en français de manière claire.

                **Code :**
                ```%s
                %s
                ```

                **Erreur obtenue :**
                %s

                **Sortie du programme :**
                %s

                Réponds en français avec :
                1. 📌 **Cause de l'erreur** : explication simple
                2. 🔍 **Détail technique** : ce qui se passe exactement
                3. ✅ **Solution** : comment corriger le code
                4. 💡 **Conseil** : bonne pratique à retenir
                """,
                language, language,
                code,
                error  != null ? error  : "Aucune erreur explicite",
                output != null ? output : "Aucune sortie"
        );

        Map<String, Object> requestBody = Map.of(
                "model",    "deepseek-r1:14b",
                "messages", List.of(
                        Map.of("role",    "system",
                               "content", "Tu es un assistant pédagogique expert en programmation. "
                                        + "Tu analyses les erreurs de code et tu réponds toujours en français "
                                        + "de manière claire et structurée pour aider les étudiants."),
                        Map.of("role",    "user",
                               "content", userMessage)
                ),
                "max_tokens",  1024,
                "temperature", 0.3
        );

        try {
            log.info("Envoi du code à l'API Groq pour analyse — langage : {}", language);

            Map<?, ?> response = webClient.post()
                    .uri("/chat/completions")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response == null) {
                throw new BadRequestException("Aucune réponse reçue de l'API Groq.");
            }

            List<?> choices = (List<?>) response.get("choices");
            if (choices == null || choices.isEmpty()) {
                throw new BadRequestException("La réponse de l'API Groq ne contient pas de résultat.");
            }

            Map<?, ?> firstChoice = (Map<?, ?>) choices.get(0);
            Map<?, ?> message     = (Map<?, ?>) firstChoice.get("message");
            String    analysis    = (String) message.get("content");

            log.info("Analyse Groq terminée avec succès — langage : {}", language);
            return analysis;

        } catch (WebClientResponseException e) {
            log.error("Erreur API Groq — statut : {}, corps : {}",
                    e.getStatusCode(), e.getResponseBodyAsString());
            throw new BadRequestException(
                    "Erreur lors de l'appel à l'API Groq : "
                    + e.getStatusCode() + " — " + e.getResponseBodyAsString());
        } catch (BadRequestException e) {
            throw e; // relayer les exceptions métier sans les envelopper
        } catch (Exception e) {
            log.error("Erreur inattendue lors de la communication avec l'API Groq", e);
            throw new BadRequestException(
                    "Une erreur inattendue s'est produite lors de la communication avec l'API Groq.");
        }
    }
}
