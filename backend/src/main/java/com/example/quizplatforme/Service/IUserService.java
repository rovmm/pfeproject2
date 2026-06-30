package com.example.quizplatforme.Service;

import com.example.quizplatforme.DTO.Request.UpdateProfileRequest;
import com.example.quizplatforme.DTO.Response.AdminStatsResponse;
import com.example.quizplatforme.DTO.Response.UserProfileResponse;

import java.util.List;

/**
 * Contrat de service pour la gestion des utilisateurs.
 *
 * <p>Couvre deux périmètres fonctionnels :
 * <ul>
 *   <li><b>Utilisateur connecté</b> — lecture et mise à jour de son propre profil</li>
 *   <li><b>Administrateur</b> — liste de tous les comptes, suppression et statistiques globales</li>
 * </ul>
 */
public interface IUserService {

    /**
     * Retourne le profil de l'utilisateur identifié par son adresse e-mail.
     *
     * @param email adresse e-mail de l'utilisateur authentifié
     * @return projection {@link UserProfileResponse} sans mot de passe ni identifiant Stripe
     */
    UserProfileResponse getUserProfile(String email);

    /**
     * Met à jour le profil de l'utilisateur identifié par son adresse e-mail.
     *
     * <p>Règles métier :
     * <ul>
     *   <li>Si {@code newPassword} est fourni, {@code currentPassword} est obligatoire et
     *       doit correspondre au mot de passe BCrypt stocké — sinon une
     *       {@link com.example.quizplatforme.exception.BadRequestException} est levée.</li>
     *   <li>Les champs absents (null) ne modifient pas la valeur existante.</li>
     * </ul>
     *
     * @param email   adresse e-mail de l'utilisateur authentifié
     * @param request données à mettre à jour (tous les champs sont optionnels)
     * @return projection {@link UserProfileResponse} mise à jour
     */
    UserProfileResponse updateProfile(String email, UpdateProfileRequest request);

    /**
     * Retourne la liste de tous les comptes utilisateurs, triée par date de création
     * décroissante (le plus récent en premier).
     *
     * <p>Réservé aux administrateurs — la restriction est appliquée au niveau
     * {@link com.example.quizplatforme.Config.SecurityConfig}.
     *
     * @return liste de projections {@link UserProfileResponse}
     */
    List<UserProfileResponse> getAllUsers();

    /**
     * Supprime définitivement un compte utilisateur par son identifiant.
     *
     * <p>Réservé aux administrateurs.
     *
     * @param id identifiant de l'utilisateur à supprimer
     * @throws com.example.quizplatforme.exception.ResourceNotFoundException (404)
     *         si aucun utilisateur avec cet identifiant n'existe
     */
    void deleteUser(Long id);

    /**
     * Agrège les statistiques globales de la plateforme.
     *
     * <p>Effectue quatre requêtes {@code COUNT(*)} en base :
     * utilisateurs, sessions, exécutions de code et résumés PDF.
     *
     * @return {@link AdminStatsResponse} avec les quatre compteurs
     */
    AdminStatsResponse getAdminStats();
}
