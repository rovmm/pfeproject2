package com.example.quizplatforme.controller;

import com.example.quizplatforme.DTO.Request.UpdateProfileRequest;
import com.example.quizplatforme.DTO.Response.UserProfileResponse;
import com.example.quizplatforme.Service.IUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Gestion des profils utilisateurs.
 *
 * <p>Deux périmètres :
 * <ul>
 *   <li><b>/api/users/me</b> — tout utilisateur authentifié peut lire et modifier son propre profil</li>
 *   <li><b>/api/users</b> — liste et suppression réservées aux administrateurs
 *       (restriction appliquée dans {@link com.example.quizplatforme.Config.SecurityConfig})</li>
 * </ul>
 */
@Slf4j
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final IUserService userService;

    // ── Profil personnel ──────────────────────────────────────────────────────────

    /**
     * GET /api/users/me
     *
     * <p>Retourne le profil de l'utilisateur actuellement authentifié.
     *
     * @param userDetails principal Spring Security de l'utilisateur connecté
     * @return {@link UserProfileResponse} sans mot de passe ni identifiant Stripe
     */
    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getMyProfile(
            @AuthenticationPrincipal UserDetails userDetails) {

        log.info("GET /api/users/me — utilisateur : '{}'", userDetails.getUsername());
        UserProfileResponse profile = userService.getUserProfile(userDetails.getUsername());
        return ResponseEntity.ok(profile);
    }

    /**
     * PUT /api/users/me
     *
     * <p>Met à jour le profil de l'utilisateur actuellement authentifié.
     * Tous les champs du corps sont optionnels ; seuls les champs présents (non nuls)
     * sont appliqués.
     *
     * <p>Pour changer le mot de passe, {@code currentPassword} est obligatoire
     * et doit correspondre au mot de passe stocké.
     *
     * @param request     données à mettre à jour (validées par Jakarta Validation)
     * @param userDetails principal Spring Security de l'utilisateur connecté
     * @return {@link UserProfileResponse} reflétant les nouvelles valeurs
     */
    @PutMapping("/me")
    public ResponseEntity<UserProfileResponse> updateMyProfile(
            @Valid @RequestBody UpdateProfileRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        log.info("PUT /api/users/me — utilisateur : '{}'", userDetails.getUsername());
        UserProfileResponse updated = userService.updateProfile(userDetails.getUsername(), request);
        return ResponseEntity.ok(updated);
    }

    // ── Administration ────────────────────────────────────────────────────────────

    /**
     * GET /api/users
     *
     * <p>Retourne la liste complète des comptes utilisateurs, triée par date
     * de création décroissante. Réservé aux administrateurs.
     *
     * @return liste de {@link UserProfileResponse}
     */
    @GetMapping
    public ResponseEntity<List<UserProfileResponse>> getAllUsers() {
        log.info("GET /api/users — liste complète des utilisateurs demandée");
        List<UserProfileResponse> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    /**
     * DELETE /api/users/{id}
     *
     * <p>Supprime définitivement le compte utilisateur identifié par {@code id}.
     * Réservé aux administrateurs.
     *
     * @param id identifiant de l'utilisateur à supprimer
     * @return 204 No Content si la suppression a réussi
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        log.info("DELETE /api/users/{} — suppression demandée", id);
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}
