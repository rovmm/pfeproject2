package com.example.quizplatforme.Service.Impl;

import com.example.quizplatforme.DTO.Request.ChatMessage;
import com.example.quizplatforme.Service.IAiService;
import com.example.quizplatforme.exception.BadRequestException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Implémentation unique du service d'intelligence artificielle de la plateforme,
 * via l'API Groq Cloud ({@code https://api.groq.com/openai/v1/chat/completions},
 * modèle {@code llama-3.3-70b-versatile} par défaut) — compatible avec le format OpenAI.
 *
 * <p>Regroupe ce qui était auparavant réparti sur trois clients HTTP dupliqués
 * (analyse de code, chat, résumé de PDF, génération de quiz), tous appelés avec
 * un modèle codé en dur et une configuration incohérente avec leur nom.
 *
 * <p>Configuration requise dans {@code application.properties} :
 * <ul>
 *   <li>{@code grok.api.url} — URL complète de l'endpoint chat/completions Groq</li>
 *   <li>{@code grok.api.key} — clé API (variable d'environnement {@code GROK_API_KEY})</li>
 *   <li>{@code grok.model} — nom du modèle (ex. : {@code llama-3.3-70b-versatile})</li>
 * </ul>
 */
@Slf4j
@Service
public class AiServiceImpl implements IAiService {

    private final WebClient webClient;
    private final String    apiUrl;

    @Value("${grok.api.key}")
    private String apiKey;

    @Value("${grok.model}")
    private String model;

    /**
     * Plafond de caractères d'historique envoyés à Grok. Le frontend renvoie tout
     * l'historique de la conversation à chaque tour sans le tronquer ; sans cette
     * limite, une conversation longue finit par dépasser la fenêtre de contexte du
     * modèle (erreur Grok {@code context_length_exceeded}).
     */
    private static final int MAX_HISTORY_CHARS = 20_000;

    public AiServiceImpl(@Value("${grok.api.url}") String apiUrl) {
        this.apiUrl = apiUrl;
        this.webClient = WebClient.builder()
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    // ── API publique ───────────────────────────────────────────────────────────

    /**
     * {@inheritDoc}
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
                1. **Cause de l'erreur** : explication simple
                2. **Détail technique** : ce qui se passe exactement
                3. **Solution** : comment corriger le code
                4. **Conseil** : bonne pratique à retenir
                """,
                language, language,
                code,
                error  != null ? error  : "Aucune erreur explicite",
                output != null ? output : "Aucune sortie"
        );

        List<Map<String, Object>> messages = List.of(
                Map.of("role",    "system",
                       "content", "Tu es un assistant pédagogique expert en programmation. "
                                + "Tu analyses les erreurs de code et tu réponds toujours en français "
                                + "de manière claire et structurée pour aider les étudiants."),
                Map.of("role",    "user",
                       "content", userMessage)
        );

        log.info("Envoi du code à l'API Grok pour analyse — langage : {}", language);
        return callChat(messages);
    }

    /**
     * {@inheritDoc}
     *
     * <p>Construit la liste de messages envoyée à Grok dans l'ordre :
     * message système, historique de conversation, puis nouveau message utilisateur.
     */
    @Override
    public String chat(String systemPrompt, List<ChatMessage> conversationHistory, String userMessage) {

        if (userMessage == null || userMessage.isBlank()) {
            throw new BadRequestException("Le message ne peut pas être vide.");
        }

        List<Map<String, Object>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", systemPrompt));

        List<Map<String, Object>> trimmedHistory = trimHistory(conversationHistory);
        messages.addAll(trimmedHistory);

        messages.add(Map.of("role", "user", "content", userMessage));

        log.info("Envoi d'une conversation à l'API Grok — {} message(s) d'historique "
                + "({} reçu(s) avant troncature)",
                trimmedHistory.size(), conversationHistory != null ? conversationHistory.size() : 0);
        return callChat(messages);
    }

    /**
     * Ne garde que les messages les plus récents de l'historique, dans la limite
     * de {@link #MAX_HISTORY_CHARS} caractères cumulés, pour éviter de dépasser
     * la fenêtre de contexte du modèle sur une conversation longue.
     */
    private List<Map<String, Object>> trimHistory(List<ChatMessage> conversationHistory) {
        if (conversationHistory == null || conversationHistory.isEmpty()) {
            return List.of();
        }

        List<Map<String, Object>> kept = new ArrayList<>();
        int totalChars = 0;

        for (int i = conversationHistory.size() - 1; i >= 0; i--) {
            ChatMessage m = conversationHistory.get(i);
            if (m == null || m.getRole() == null || m.getContent() == null) {
                continue;
            }

            int length = m.getContent().length();
            if (totalChars + length > MAX_HISTORY_CHARS && !kept.isEmpty()) {
                break;
            }

            kept.add(0, Map.of("role", m.getRole(), "content", m.getContent()));
            totalChars += length;
        }

        return kept;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public String summarize(String text) {
        if (text == null || text.isBlank()) {
            throw new BadRequestException("Le texte à résumer ne peut pas être vide.");
        }

        String userMessage = """
                Veuillez résumer le texte suivant en français de manière claire et concise. \
                Mettez en avant les points clés et les informations essentielles :

                """ + text;

        List<Map<String, Object>> messages = List.of(
                Map.of("role", "system",
                        "content", "Tu es un assistant expert en résumé de documents. "
                                + "Tu réponds toujours en français."),
                Map.of("role", "user", "content", userMessage)
        );

        log.info("Envoi du texte à l'API Grok pour résumé…");
        return callChat(messages);
    }

    // ── Appel bas niveau à l'API Grok ────────────────────────────────────────

    /**
     * Envoie une liste de messages à l'endpoint chat/completions de Grok
     * et retourne le contenu textuel de la réponse générée.
     *
     * <p>Centralise l'appel WebClient et la gestion d'erreurs partagés par
     * {@link #analyzeError}, {@link #chat} et {@link #summarize}.
     */
    private String callChat(List<Map<String, Object>> messages) {

        Map<String, Object> requestBody = Map.of(
                "model",       model,
                "messages",    messages,
                "max_tokens",  4096,
                "temperature", 0.3
        );

        try {
            Map<?, ?> response = webClient.post()
                    .uri(apiUrl)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response == null) {
                throw new BadRequestException("Aucune réponse reçue de l'API Grok.");
            }

            List<?> choices = (List<?>) response.get("choices");
            if (choices == null || choices.isEmpty()) {
                throw new BadRequestException("La réponse de l'API Grok ne contient pas de résultat.");
            }

            Map<?, ?> firstChoice = (Map<?, ?>) choices.get(0);
            Map<?, ?> message     = (Map<?, ?>) firstChoice.get("message");
            String    content     = (String) message.get("content");

            log.info("Réponse Grok reçue avec succès");
            return content;

        } catch (WebClientResponseException e) {
            log.error("Erreur API Grok — statut : {}, corps : {}",
                    e.getStatusCode(), e.getResponseBodyAsString());
            throw new BadRequestException(
                    "Erreur lors de l'appel à l'API Grok : "
                    + e.getStatusCode() + " — " + e.getResponseBodyAsString());
        } catch (BadRequestException e) {
            throw e; // relayer les exceptions métier sans les envelopper
        } catch (Exception e) {
            log.error("Erreur inattendue lors de la communication avec l'API Grok", e);
            throw new BadRequestException(
                    "Une erreur inattendue s'est produite lors de la communication avec l'API Grok.");
        }
    }
}
