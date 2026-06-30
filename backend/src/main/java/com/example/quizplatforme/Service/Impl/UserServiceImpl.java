package com.example.quizplatforme.Service.Impl;

import com.example.quizplatforme.DTO.Request.UpdateProfileRequest;
import com.example.quizplatforme.DTO.Response.AdminStatsResponse;
import com.example.quizplatforme.DTO.Response.UserProfileResponse;
import com.example.quizplatforme.Model.Entity.User;
import com.example.quizplatforme.Repository.ExecutionResultRepository;
import com.example.quizplatforme.Repository.PdfSummaryRepository;
import com.example.quizplatforme.Repository.SessionRepository;
import com.example.quizplatforme.Repository.UserRepository;
import com.example.quizplatforme.Service.IUserService;
import com.example.quizplatforme.exception.BadRequestException;
import com.example.quizplatforme.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Implémentation de {@link IUserService}.
 *
 * <p>Toutes les méthodes retournant des données utilisateur travaillent
 * exclusivement avec des projections DTO — le mot de passe BCrypt et
 * l'identifiant Stripe ne quittent jamais cette couche.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements IUserService {

    private final UserRepository            userRepository;
    private final SessionRepository         sessionRepository;
    private final ExecutionResultRepository executionResultRepository;
    private final PdfSummaryRepository      pdfSummaryRepository;
    private final PasswordEncoder           passwordEncoder;

    // ── Profil utilisateur ────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public UserProfileResponse getUserProfile(String email) {
        User user = findByEmailOrThrow(email);
        log.debug("Profil récupéré pour '{}'", email);
        return toResponse(user);
    }

    @Override
    @Transactional
    public UserProfileResponse updateProfile(String email, UpdateProfileRequest request) {
        User user = findByEmailOrThrow(email);

        // ── Mise à jour du nom complet ────────────────────────────────────────
        if (StringUtils.hasText(request.getFullName())) {
            user.setFullName(request.getFullName().trim());
            log.debug("Nom complet mis à jour pour '{}'", email);
        }

        // ── Changement de mot de passe ────────────────────────────────────────
        if (StringUtils.hasText(request.getNewPassword())) {

            // currentPassword est obligatoire pour confirmer l'identité
            if (!StringUtils.hasText(request.getCurrentPassword())) {
                throw new BadRequestException(
                        "Le mot de passe actuel est requis pour définir un nouveau mot de passe.");
            }

            if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
                throw new BadRequestException(
                        "Le mot de passe actuel est incorrect.");
            }

            user.setPassword(passwordEncoder.encode(request.getNewPassword()));
            log.info("Mot de passe modifié pour '{}'", email);
        }

        // @PreUpdate dans User.java met à jour updatedAt automatiquement
        User saved = userRepository.save(user);
        log.info("Profil mis à jour pour '{}'", email);
        return toResponse(saved);
    }

    // ── Administration ────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public List<UserProfileResponse> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .sorted(Comparator.comparing(User::getCreatedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("Utilisateur", "id", id);
        }
        userRepository.deleteById(id);
        log.info("Utilisateur id={} supprimé.", id);
    }

    @Override
    @Transactional(readOnly = true)
    public AdminStatsResponse getAdminStats() {
        long totalUsers       = userRepository.count();
        long totalSessions    = sessionRepository.count();
        long totalExecutions  = executionResultRepository.count();
        long totalPdfSummaries = pdfSummaryRepository.count();

        log.debug("Statistiques — utilisateurs={}, sessions={}, exécutions={}, résumés={}",
                totalUsers, totalSessions, totalExecutions, totalPdfSummaries);

        return AdminStatsResponse.builder()
                .totalUsers(totalUsers)
                .totalSessions(totalSessions)
                .totalExecutions(totalExecutions)
                .totalPdfSummaries(totalPdfSummaries)
                .build();
    }

    // ── Helpers privés ────────────────────────────────────────────────────────────

    /**
     * Charge un utilisateur par e-mail ou lève une {@link ResourceNotFoundException}.
     *
     * @param email adresse e-mail de l'utilisateur
     * @return entité {@link User} chargée depuis la base
     */
    private User findByEmailOrThrow(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Utilisateur", "email", email));
    }

    /**
     * Convertit une entité {@link User} en {@link UserProfileResponse}.
     *
     * <p>Cette méthode n'accède à aucune association LAZY — elle est sûre
     * en dehors d'une session Hibernate ouverte.
     *
     * @param user entité utilisateur
     * @return projection DTO sans mot de passe ni identifiant Stripe
     */
    private UserProfileResponse toResponse(User user) {
        return UserProfileResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole())
                .plan(user.getPlan())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
