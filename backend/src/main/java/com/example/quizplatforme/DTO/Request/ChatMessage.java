package com.example.quizplatforme.DTO.Request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Un message d'une conversation avec l'assistant IA (historique de chat).
 *
 * @param role    "user" ou "assistant"
 * @param content contenu textuel du message
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessage {
    private String role;
    private String content;
}
