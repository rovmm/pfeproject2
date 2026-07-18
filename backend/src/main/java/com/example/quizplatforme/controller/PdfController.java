package com.example.quizplatforme.controller;

import com.example.quizplatforme.DTO.Response.PdfSummaryResponse;
import com.example.quizplatforme.DTO.Response.SummaryResponse;
import com.example.quizplatforme.Service.IPdfService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Endpoints de traitement et d'historique des résumés PDF.
 *
 * <ul>
 *   <li>{@code POST /api/pdf/summarize} — génère un résumé via Grok et le persiste</li>
 *   <li>{@code GET  /api/pdf/history}   — historique des résumés de l'utilisateur connecté</li>
 * </ul>
 *
 * <p>Les deux endpoints nécessitent une authentification (configurée dans
 * {@code SecurityConfig} : {@code /api/pdf/**} → {@code authenticated()}).
 * L'email de l'utilisateur est extrait du principal Spring Security et transmis
 * au service — jamais lu depuis un paramètre de requête.
 */
@Slf4j
@RestController
@RequestMapping("/api/pdf")
@RequiredArgsConstructor
public class PdfController {

    private final IPdfService pdfService;

    // ── POST /api/pdf/summarize ────────────────────────────────────────────────

    /**
     * Reçoit un fichier PDF, génère un résumé via l'IA Grok et le persiste en base.
     *
     * @param file        fichier PDF en {@code multipart/form-data} (champ {@code file})
     * @param userDetails principal Spring Security de l'utilisateur authentifié
     * @return {@link SummaryResponse} : résumé, nom du fichier, nombre de pages
     */
    @PostMapping(value = "/summarize", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<SummaryResponse> summarizePdf(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails) {

        String email = userDetails.getUsername();
        log.info("Requête de résumé PDF — fichier : '{}', utilisateur : '{}'",
                file.getOriginalFilename(), email);

        SummaryResponse response = pdfService.summarizePdf(file, email);

        log.info("Résumé généré et persisté — fichier : '{}', utilisateur : '{}'",
                response.getFileName(), email);

        return ResponseEntity.ok(response);
    }

    // ── GET /api/pdf/history ──────────────────────────────────────────────────

    /**
     * Retourne l'historique des résumés PDF de l'utilisateur authentifié,
     * du plus récent au plus ancien.
     *
     * <p>Seuls les champs non sensibles sont exposés ({@link PdfSummaryResponse}) :
     * le texte original extrait du PDF n'est pas retourné (volume potentiellement élevé).
     *
     * @param userDetails principal Spring Security de l'utilisateur authentifié
     * @return liste des résumés, vide si aucun résumé n'existe encore
     */
    @GetMapping("/history")
    public ResponseEntity<List<PdfSummaryResponse>> getPdfHistory(
            @AuthenticationPrincipal UserDetails userDetails) {

        String email = userDetails.getUsername();
        log.debug("Demande d'historique PDF — utilisateur : '{}'", email);

        return ResponseEntity.ok(pdfService.getPdfHistory(email));
    }
}
