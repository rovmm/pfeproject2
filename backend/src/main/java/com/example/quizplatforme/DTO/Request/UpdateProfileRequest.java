package com.example.quizplatforme.DTO.Request;

import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Corps de la requête PUT /api/users/me.
 *
 * Tous les champs sont optionnels :
 *   - {@code fullName}       — met à jour le nom affiché
 *   - {@code currentPassword} — requis si {@code newPassword} est fourni
 *   - {@code newPassword}    — nouveau mot de passe (min 8 caractères)
 *
 * La validation croisée currentPassword ↔ newPassword est effectuée
 * dans la couche service pour produire des messages d'erreur métier précis.
 */
@Data
public class UpdateProfileRequest {

    @Size(min = 2, max = 100,
          message = "Le nom complet doit contenir entre 2 et 100 caractères.")
    private String fullName;

    /** Mot de passe actuel — obligatoire si newPassword est fourni. */
    private String currentPassword;

    @Size(min = 8, max = 100,
          message = "Le nouveau mot de passe doit contenir entre 8 et 100 caractères.")
    private String newPassword;
}
