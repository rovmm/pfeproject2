package com.example.quizplatforme.Service;

import com.example.quizplatforme.DTO.Request.ForgotPasswordRequest;
import com.example.quizplatforme.DTO.Request.LoginRequest;
import com.example.quizplatforme.DTO.Request.RegisterRequest;
import com.example.quizplatforme.DTO.Request.ResendOtpRequest;
import com.example.quizplatforme.DTO.Request.ResetPasswordRequest;
import com.example.quizplatforme.DTO.Request.VerifyOtpRequest;
import com.example.quizplatforme.DTO.Response.JwtResponse;
import com.example.quizplatforme.DTO.Response.MessageResponse;

/**
 * Contrat du service d'authentification, y compris le cycle de vérification
 * d'e-mail et de réinitialisation de mot de passe par code OTP.
 */
public interface IAuthServicelmpl {

    /**
     * Authentifie un utilisateur existant et génère un token JWT.
     * Refuse la connexion si l'adresse e-mail n'a pas encore été vérifiée.
     *
     * @param request contient l'email et le mot de passe
     * @return {@link JwtResponse} avec le token JWT et les informations de l'utilisateur
     */
    JwtResponse login(LoginRequest request);

    /**
     * Crée un nouveau compte utilisateur (non vérifié) et envoie un code OTP
     * de vérification par e-mail. Ne retourne PAS de token — l'utilisateur
     * doit d'abord vérifier son adresse via {@link #verifyEmail}.
     *
     * @param request contient le nom complet, l'email, le mot de passe et le rôle
     * @return {@link JwtResponse} sans token, {@code emailVerified=false}
     */
    JwtResponse register(RegisterRequest request);

    /**
     * Valide le code OTP de vérification d'e-mail et active le compte.
     * Retourne un token JWT (connexion automatique) en cas de succès.
     *
     * @param request email + code OTP à 6 chiffres
     * @return {@link JwtResponse} avec le token JWT, {@code emailVerified=true}
     */
    JwtResponse verifyEmail(VerifyOtpRequest request);

    /**
     * Renvoie un nouveau code OTP (vérification d'e-mail ou réinitialisation
     * de mot de passe), sous réserve du cooldown de renvoi.
     *
     * @param request email + type de code ({@code EMAIL_VERIFICATION} ou {@code PASSWORD_RESET})
     * @return message de confirmation
     */
    MessageResponse resendOtp(ResendOtpRequest request);

    /**
     * Déclenche l'envoi d'un code OTP de réinitialisation de mot de passe.
     * Retourne toujours un succès générique, même si l'e-mail n'existe pas,
     * afin d'éviter l'énumération de comptes.
     *
     * @param request email du compte
     * @return message de confirmation générique
     */
    MessageResponse forgotPassword(ForgotPasswordRequest request);

    /**
     * Valide le code OTP de réinitialisation et met à jour le mot de passe.
     *
     * @param request email + code OTP + nouveau mot de passe
     * @return message de confirmation
     */
    MessageResponse resetPassword(ResetPasswordRequest request);
}
