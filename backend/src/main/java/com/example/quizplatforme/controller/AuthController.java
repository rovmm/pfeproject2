package com.example.quizplatforme.controller;

import com.example.quizplatforme.DTO.Request.LoginRequest;
import com.example.quizplatforme.DTO.Request.RegisterRequest;
import com.example.quizplatforme.DTO.Response.JwtResponse;
import com.example.quizplatforme.Service.IAuthServicelmpl;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final IAuthServicelmpl authService;

    /**
     * POST /api/auth/login
     * Authentifie un utilisateur existant et retourne un token JWT.
     *
     * @param request email + mot de passe
     * @return 200 OK avec {@link JwtResponse}
     */
    @PostMapping("/login")
    public ResponseEntity<JwtResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    /**
     * POST /api/auth/register
     * Crée un nouveau compte (PROF ou STUDENT) et retourne immédiatement un
     * token JWT — le frontend peut connecter l'utilisateur sans second appel.
     *
     * @param request fullName + email + password + role (PROF | STUDENT)
     * @return 201 Created avec {@link JwtResponse}
     */
    @PostMapping("/register")
    public ResponseEntity<JwtResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }
}
