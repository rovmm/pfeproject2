package com.example.quizplatforme.Service;

import com.example.quizplatforme.Model.Entity.User;
import com.example.quizplatforme.Repository.UserRepository;
import com.example.quizplatforme.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Random;

/**
 * Génération et validation des codes OTP à 6 chiffres, stockés directement
 * sur l'entité {@link User} (pas de table dédiée : un seul code actif par
 * utilisateur à la fois, ce qui correspond au besoin — vérification d'e-mail
 * ou réinitialisation de mot de passe).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OtpService {

    private final UserRepository userRepository;

    /**
     * Génère un nouveau code OTP, le persiste sur l'utilisateur avec une
     * expiration de 15 minutes et un cooldown de renvoi de 60 secondes.
     */
    public String generateAndSaveOtp(User user, String otpType) {
        String code = String.format("%06d", new Random().nextInt(999999));
        user.setOtpCode(code);
        user.setOtpType(otpType);
        user.setOtpExpiresAt(LocalDateTime.now().plusMinutes(15));
        user.setOtpResendAllowedAt(LocalDateTime.now().plusSeconds(60));
        user.setOtpAttempts(0);
        userRepository.save(user);
        log.info("OTP generated for user {} type {}", user.getEmail(), otpType);
        return code;
    }

    /**
     * Valide un code OTP soumis par l'utilisateur. Consomme le code (le
     * supprime) en cas de succès, ou en cas d'expiration / dépassement du
     * nombre maximal de tentatives.
     *
     * @throws BadRequestException si le code est absent, du mauvais type,
     *                             expiré, trop de tentatives, ou incorrect
     */
    public void validateOtp(User user, String code, String expectedType) {
        if (user.getOtpCode() == null) {
            throw new BadRequestException("Aucun code OTP actif.");
        }
        if (!expectedType.equals(user.getOtpType())) {
            throw new BadRequestException("Type de code invalide.");
        }
        if (LocalDateTime.now().isAfter(user.getOtpExpiresAt())) {
            clearOtp(user);
            throw new BadRequestException("Le code OTP a expiré. Demandez un nouveau code.");
        }
        if (user.getOtpAttempts() >= 3) {
            clearOtp(user);
            throw new BadRequestException("Trop de tentatives. Demandez un nouveau code.");
        }
        if (!code.equals(user.getOtpCode())) {
            user.setOtpAttempts(user.getOtpAttempts() + 1);
            userRepository.save(user);
            int remaining = 3 - user.getOtpAttempts();
            throw new BadRequestException("Code incorrect. %d tentative(s) restante(s).".formatted(remaining));
        }
        clearOtp(user);
    }

    /**
     * Vérifie que le cooldown de renvoi (60 secondes après la dernière
     * génération) est écoulé.
     *
     * @throws BadRequestException si le cooldown n'est pas encore écoulé
     */
    public void checkResendAllowed(User user) {
        if (user.getOtpResendAllowedAt() != null && LocalDateTime.now().isBefore(user.getOtpResendAllowedAt())) {
            long seconds = ChronoUnit.SECONDS.between(LocalDateTime.now(), user.getOtpResendAllowedAt());
            throw new BadRequestException(
                    "Veuillez attendre %d secondes avant de redemander un code.".formatted(seconds));
        }
    }

    /** Efface le code OTP actif de l'utilisateur (consommé ou invalidé). */
    public void clearOtp(User user) {
        user.setOtpCode(null);
        user.setOtpType(null);
        user.setOtpExpiresAt(null);
        user.setOtpResendAllowedAt(null);
        user.setOtpAttempts(0);
        userRepository.save(user);
    }
}
