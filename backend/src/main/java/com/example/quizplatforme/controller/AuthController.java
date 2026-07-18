package com.example.quizplatforme.controller;

import com.example.quizplatforme.DTO.Request.ForgotPasswordRequest;
import com.example.quizplatforme.DTO.Request.LoginRequest;
import com.example.quizplatforme.DTO.Request.RegisterRequest;
import com.example.quizplatforme.DTO.Request.ResendOtpRequest;
import com.example.quizplatforme.DTO.Request.ResetPasswordRequest;
import com.example.quizplatforme.DTO.Request.VerifyOtpRequest;
import com.example.quizplatforme.DTO.Response.JwtResponse;
import com.example.quizplatforme.DTO.Response.MessageResponse;
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
     * Refuse la connexion si l'adresse e-mail n'a pas encore été vérifiée.
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
     * Crée un nouveau compte (PROF ou STUDENT) non vérifié et envoie un code
     * OTP de vérification par e-mail. Aucun token n'est retourné — le
     * frontend doit rediriger vers l'écran de vérification d'e-mail.
     *
     * @param request fullName + email + password + role (PROF | STUDENT)
     * @return 201 Created avec {@link JwtResponse} (token = null, emailVerified = false)
     */
    @PostMapping("/register")
    public ResponseEntity<JwtResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    /**
     * POST /api/auth/verify-email
     * Valide le code OTP de vérification d'e-mail et active le compte.
     *
     * @param request email + code OTP à 6 chiffres
     * @return 200 OK avec {@link JwtResponse} (token présent, emailVerified = true)
     */
    @PostMapping("/verify-email")
    public ResponseEntity<JwtResponse> verifyEmail(@Valid @RequestBody VerifyOtpRequest request) {
        return ResponseEntity.ok(authService.verifyEmail(request));
    }

    /**
     * POST /api/auth/resend-otp
     * Renvoie un nouveau code OTP (vérification d'e-mail ou réinitialisation
     * de mot de passe), sous réserve du cooldown de renvoi de 60 secondes.
     *
     * @param request email + type ({@code EMAIL_VERIFICATION} ou {@code PASSWORD_RESET})
     * @return 200 OK avec {@link MessageResponse}
     */
    @PostMapping("/resend-otp")
    public ResponseEntity<MessageResponse> resendOtp(@Valid @RequestBody ResendOtpRequest request) {
        return ResponseEntity.ok(authService.resendOtp(request));
    }

    /**
     * POST /api/auth/forgot-password
     * Déclenche l'envoi d'un code OTP de réinitialisation de mot de passe.
     * Retourne toujours un succès générique pour éviter l'énumération de comptes.
     *
     * @param request email du compte
     * @return 200 OK avec {@link MessageResponse}
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<MessageResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        return ResponseEntity.ok(authService.forgotPassword(request));
    }

    /**
     * POST /api/auth/reset-password
     * Valide le code OTP de réinitialisation et met à jour le mot de passe.
     *
     * @param request email + code OTP + nouveau mot de passe
     * @return 200 OK avec {@link MessageResponse}
     */
    @PostMapping("/reset-password")
    public ResponseEntity<MessageResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        return ResponseEntity.ok(authService.resetPassword(request));
    }
}
