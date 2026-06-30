package com.example.quizplatforme.Service;

import com.example.quizplatforme.DTO.Request.LoginRequest;
import com.example.quizplatforme.DTO.Request.RegisterRequest;
import com.example.quizplatforme.DTO.Response.JwtResponse;

/**
 * Contrat du service d'authentification.
 *
 * Les deux opérations retournent un {@link JwtResponse} afin que le
 * client reçoive un token JWT immédiatement, que ce soit après une
 * connexion ou après une inscription (auto-login).
 */
public interface IAuthServicelmpl {

    /**
     * Authentifie un utilisateur existant et génère un token JWT.
     *
     * @param request contient l'email et le mot de passe
     * @return {@link JwtResponse} avec le token JWT et les informations de l'utilisateur
     */
    JwtResponse login(LoginRequest request);

    /**
     * Crée un nouveau compte utilisateur et génère un token JWT.
     * Permet la connexion automatique après inscription.
     *
     * @param request contient le nom complet, l'email, le mot de passe et le rôle
     * @return {@link JwtResponse} avec le token JWT et les informations de l'utilisateur
     */
    JwtResponse register(RegisterRequest request);
}
