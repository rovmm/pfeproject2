package com.example.quizplatforme.DTO.Response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Réponse générique contenant un simple message de confirmation, utilisée
 * par les endpoints qui n'ont pas besoin de retourner un objet complet
 * (renvoi d'OTP, mot de passe oublié, réinitialisation de mot de passe).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageResponse {
    private String message;
}
