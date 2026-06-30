package com.example.quizplatforme.Service.Impl;

import com.example.quizplatforme.Service.IGrokService;
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

@Slf4j
@Service
public class GrokServiceImpl implements IGrokService {

    private final WebClient webClient;

    @Value("${grok.api.key}")
    private String apiKey;

    public GrokServiceImpl(@Value("${grok.api.url}") String apiUrl) {
        this.webClient = WebClient.builder()
                .baseUrl(apiUrl)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    @Override
    public String summarize(String text) {
        if (text == null || text.isBlank()) {
            throw new BadRequestException("Le texte à résumer ne peut pas être vide.");
        }

        String userMessage = """
                Veuillez résumer le texte suivant en français de manière claire et concise. \
                Mettez en avant les points clés et les informations essentielles :

                """ + text;

        Map<String, Object> requestBody = Map.of(
                "model", "deepseek-r1:14b",
                "messages", List.of(
                        Map.of("role", "system",
                                "content", "Tu es un assistant expert en résumé de documents. "
                                        + "Tu réponds toujours en français."),
                        Map.of("role", "user", "content", userMessage)
                ),
                "max_tokens", 1024,
                "temperature", 0.3
        );

        try {
            log.info("Sending text to Grok API for summarization...");

            Map<?, ?> response = webClient.post()
                    .uri("/chat/completions")
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
            Map<?, ?> message = (Map<?, ?>) firstChoice.get("message");

            String summary = (String) message.get("content");
            log.info("Grok API summarization successful.");
            return summary;

        } catch (WebClientResponseException e) {
            log.error("Grok API error - status: {}, body: {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new BadRequestException(
                    "Erreur lors de l'appel à l'API Grok : " + e.getStatusCode() + " - " + e.getResponseBodyAsString()
            );
        } catch (Exception e) {
            log.error("Unexpected error while calling Grok API", e);
            throw new BadRequestException("Une erreur inattendue s'est produite lors de la communication avec l'API Grok.");
        }
    }
}