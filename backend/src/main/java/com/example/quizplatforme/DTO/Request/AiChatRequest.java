package com.example.quizplatforme.DTO.Request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class AiChatRequest {

    @NotBlank(message = "Le message ne peut pas être vide.")
    private String message;

    /** Historique de la conversation, envoyé par le frontend pour donner du contexte à l'IA. */
    private List<ChatMessage> conversationHistory = new ArrayList<>();

    /** Session dans laquelle la question est posée, ou {@code null} si hors session. */
    private Long sessionId;
}
