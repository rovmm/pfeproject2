package com.example.quizplatforme.DTO.Response;

import com.example.quizplatforme.Model.Enum.PlanEnum;
import com.example.quizplatforme.Model.Enum.RoleEnum;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Projection du profil utilisateur renvoyée par :
 *   - GET  /api/users/me
 *   - PUT  /api/users/me
 *   - GET  /api/users         (liste paginée — chaque élément)
 *
 * Ne contient jamais le mot de passe ni l'identifiant Stripe.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {

    private Long id;
    private String fullName;
    private String email;
    private RoleEnum role;
    private PlanEnum plan;
    private LocalDateTime createdAt;
}
