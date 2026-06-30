package com.example.quizplatforme.DTO.Response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Réponse renvoyée après une authentification réussie (login ou register).
 *
 * Contient le token JWT et les informations essentielles de l'utilisateur
 * pour que le frontend puisse initialiser sa session sans appel supplémentaire.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JwtResponse {

    /** Token JWT signé avec HS256 — durée de validité définie dans application.properties. */
    private String token;

    /** Identifiant unique en base de données. */
    private Long id;

    /** Nom complet de l'utilisateur. */
    private String fullName;

    /** Adresse e-mail (identifiant de connexion). */
    private String email;

    /** Rôle de l'utilisateur : ADMIN, PROF ou STUDENT. */
    private String role;

    /** Plan tarifaire : FREE ou PREMIUM. */
    private String plan;
}
