package com.example.quizplatforme.controller;

import com.example.quizplatforme.DTO.Response.AdminStatsResponse;
import com.example.quizplatforme.Service.IUserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoints réservés aux administrateurs de la plateforme.
 *
 * <p>L'accès à {@code /api/admin/**} est restreint au rôle {@code ADMIN}
 * dans {@link com.example.quizplatforme.Config.SecurityConfig}.
 */
@Slf4j
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final IUserService userService;

    /**
     * GET /api/admin/stats
     *
     * <p>Retourne les statistiques globales de la plateforme :
     * nombre total d'utilisateurs, de sessions, d'exécutions de code
     * et de résumés PDF générés.
     *
     * @return {@link AdminStatsResponse} avec les quatre compteurs
     */
    @GetMapping("/stats")
    public ResponseEntity<AdminStatsResponse> getStats() {
        log.info("GET /api/admin/stats — statistiques demandées");
        AdminStatsResponse stats = userService.getAdminStats();
        return ResponseEntity.ok(stats);
    }
}
