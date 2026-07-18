package com.example.quizplatforme.Service.Impl;

import com.example.quizplatforme.Service.IVisionService;
import com.example.quizplatforme.exception.BadRequestException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.util.Base64;
import java.util.List;
import java.util.Map;

/**
 * Implémentation du service de lecture d'images, via un endpoint Mistral
 * auto-hébergé (Open WebUI, compatible OpenAI) — séparé du client Groq utilisé
 * par {@link AiServiceImpl} pour tout le reste, car Groq ne lit pas les images.
 *
 * <p>Configuration requise dans {@code application.properties} :
 * <ul>
 *   <li>{@code vision.api.url} — URL complète de l'endpoint chat/completions</li>
 *   <li>{@code vision.api.key} — clé API (variable d'environnement {@code VISION_API_KEY})</li>
 *   <li>{@code vision.model} — nom du modèle (ex. : {@code mistral})</li>
 * </ul>
 */
@Slf4j
@Service
public class VisionServiceImpl implements IVisionService {

    private final WebClient webClient;
    private final String    apiUrl;

    @Value("${vision.api.key}")
    private String apiKey;

    @Value("${vision.model}")
    private String model;

    public VisionServiceImpl(@Value("${vision.api.url}") String apiUrl) {
        this.apiUrl = apiUrl;
        this.webClient = WebClient.builder()
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    @Override
    public String describeImage(byte[] imageBytes, String mimeType, String prompt) {
        if (imageBytes == null || imageBytes.length == 0) {
            throw new BadRequestException("L'image à analyser est vide.");
        }

        String base64Image = Base64.getEncoder().encodeToString(imageBytes);

        // Ce serveur (Ollama) attend le format natif Ollama, pas le format OpenAI
        // "content" en tableau de parts : content est une chaîne, l'image est
        // passée séparément via le champ "images" (liste de chaînes base64 brutes).
        Map<String, Object> userMessage = Map.of(
                "role",    "user",
                "content", prompt,
                "images",  List.of(base64Image)
        );

        Map<String, Object> requestBody = Map.of(
                "model",       model,
                "messages",    List.of(userMessage),
                "max_tokens",  2048,
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
                throw new BadRequestException("Aucune réponse reçue du service de vision IA.");
            }

            List<?> choices = (List<?>) response.get("choices");
            if (choices == null || choices.isEmpty()) {
                throw new BadRequestException("La réponse du service de vision IA ne contient pas de résultat.");
            }

            Map<?, ?> firstChoice = (Map<?, ?>) choices.get(0);
            Map<?, ?> message     = (Map<?, ?>) firstChoice.get("message");
            String    text        = (String) message.get("content");

            log.info("Réponse du service de vision IA reçue avec succès");
            return text;

        } catch (WebClientResponseException e) {
            log.error("Erreur service de vision IA — statut : {}, corps : {}",
                    e.getStatusCode(), e.getResponseBodyAsString());
            throw new BadRequestException(
                    "Erreur lors de l'appel au service de vision IA : "
                    + e.getStatusCode() + " — " + e.getResponseBodyAsString());
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("Erreur inattendue lors de la communication avec le service de vision IA", e);
            throw new BadRequestException(
                    "Une erreur inattendue s'est produite lors de la communication avec le service de vision IA.");
        }
    }
}
