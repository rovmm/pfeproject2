package com.example.quizplatforme.Service.Impl;

import com.example.quizplatforme.DTO.Response.PdfSummaryResponse;
import com.example.quizplatforme.DTO.Response.SummaryResponse;
import com.example.quizplatforme.Model.Entity.PdfSummary;
import com.example.quizplatforme.Model.Entity.User;
import com.example.quizplatforme.Repository.PdfSummaryRepository;
import com.example.quizplatforme.Repository.UserRepository;
import com.example.quizplatforme.Service.IGrokService;
import com.example.quizplatforme.Service.IPdfService;
import com.example.quizplatforme.exception.BadRequestException;
import com.example.quizplatforme.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;

/**
 * Implémentation du service de traitement des fichiers PDF.
 *
 * <h3>Flux de résumé (summarizePdf)</h3>
 * <ol>
 *   <li>Validation du fichier (type MIME + extension)</li>
 *   <li>Extraction du texte via Apache PDFBox</li>
 *   <li>Troncature pour l'IA (plafond Groq : ~3 000 tokens)</li>
 *   <li>Appel à l'API Groq pour le résumé</li>
 *   <li>Persistance du résumé dans {@code pdf_summaries}</li>
 *   <li>Retour de {@link SummaryResponse} au contrôleur</li>
 * </ol>
 *
 * <h3>Persistance</h3>
 * {@code originalText} stocke le texte complet extrait du PDF, plafonné à
 * {@value #MAX_STORED_TEXT_LENGTH} caractères pour rester dans la limite du
 * type MySQL {@code TEXT} (65 535 octets). La troncature pour l'IA
 * ({@value #MAX_AI_TEXT_LENGTH} caractères) est indépendante et plus courte.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PdfServiceImpl implements IPdfService {

    private static final String PDF_CONTENT_TYPE        = "application/pdf";
    /** Plafond de texte envoyé à Groq (~3 000 tokens → résumé cohérent). */
    private static final int    MAX_AI_TEXT_LENGTH      = 12_000;
    /** Plafond de texte stocké en base (type TEXT MySQL ≈ 65 535 octets). */
    private static final int    MAX_STORED_TEXT_LENGTH  = 60_000;

    private final IGrokService        grokService;
    private final UserRepository      userRepository;
    private final PdfSummaryRepository pdfSummaryRepository;

    // ── API publique ───────────────────────────────────────────────────────────

    /**
     * {@inheritDoc}
     *
     * <p>Le résumé est persisté dans {@code pdf_summaries} après chaque appel
     * Groq réussi. Une erreur de persistance n'interrompt pas la réponse :
     * elle est uniquement journalisée (non bloquante).
     */
    @Override
    @Transactional
    public SummaryResponse summarizePdf(MultipartFile file, String userEmail) {
        validateFile(file);

        String fileName = file.getOriginalFilename();
        log.info("Traitement du fichier PDF : '{}', utilisateur : '{}'", fileName, userEmail);

        try (InputStream inputStream = file.getInputStream();
             PDDocument  document    = PDDocument.load(inputStream)) {

            int pageCount = document.getNumberOfPages();
            log.info("PDF chargé — pages : {}", pageCount);

            if (pageCount == 0) {
                throw new BadRequestException("Le fichier PDF est vide (aucune page détectée).");
            }

            String extractedText = extractText(document);
            if (extractedText.isBlank()) {
                throw new BadRequestException(
                        "Impossible d'extraire le texte du PDF. " +
                        "Le fichier est peut-être scanné ou protégé.");
            }

            // Texte tronqué envoyé à Groq (fenêtre de contexte)
            String textForAi = extractedText.length() > MAX_AI_TEXT_LENGTH
                    ? extractedText.substring(0, MAX_AI_TEXT_LENGTH)
                    : extractedText;

            log.info("Texte extrait ({} caractères). Envoi à Groq…", textForAi.length());
            String summary = grokService.summarize(textForAi);

            // Texte complet stocké en base (plafond TEXT MySQL)
            String storedText = extractedText.length() > MAX_STORED_TEXT_LENGTH
                    ? extractedText.substring(0, MAX_STORED_TEXT_LENGTH)
                    : extractedText;

            persistSummary(userEmail, fileName, pageCount, storedText, summary);

            return SummaryResponse.builder()
                    .summary(summary)
                    .fileName(fileName)
                    .pageCount(pageCount)
                    .build();

        } catch (IOException e) {
            log.error("Échec de la lecture du fichier PDF : '{}'", fileName, e);
            throw new BadRequestException(
                    "Erreur lors de la lecture du fichier PDF : " + e.getMessage());
        }
    }

    /**
     * {@inheritDoc}
     *
     * <p>La relation {@code PdfSummary.user} est en LAZY : la méthode mappe
     * vers le DTO <em>sans accéder</em> à l'objet {@code User} hydraté,
     * évitant toute {@code LazyInitializationException}.
     */
    @Override
    @Transactional(readOnly = true)
    public List<PdfSummaryResponse> getPdfHistory(String userEmail) {
        User user = findUserOrThrow(userEmail);

        return pdfSummaryRepository
                .findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // ── Persistance ────────────────────────────────────────────────────────────

    /**
     * Sauvegarde le résumé en base. La méthode est tolérante aux erreurs : si la
     * persistance échoue (ex. : contrainte DB, connexion perdue), le résumé est
     * quand même retourné au client et l'erreur est uniquement journalisée.
     */
    private void persistSummary(String userEmail, String fileName,
                                int pageCount, String originalText, String summary) {
        try {
            User user = findUserOrThrow(userEmail);

            PdfSummary entity = PdfSummary.builder()
                    .user(user)
                    .fileName(fileName != null ? fileName : "inconnu")
                    .pageCount(pageCount)
                    .originalText(originalText)
                    .summary(summary)
                    .build();

            pdfSummaryRepository.save(entity);
            log.debug("Résumé PDF persisté — utilisateur : '{}', fichier : '{}'",
                    userEmail, fileName);

        } catch (Exception e) {
            // Non bloquant : l'utilisateur reçoit quand même son résumé
            log.error("Impossible de persister le résumé PDF pour '{}' : {}",
                    userEmail, e.getMessage());
        }
    }

    // ── Mapping ────────────────────────────────────────────────────────────────

    /**
     * Convertit un {@link PdfSummary} en {@link PdfSummaryResponse}.
     * N'accède PAS à {@code PdfSummary.user} — la relation LAZY reste non initialisée.
     */
    private PdfSummaryResponse toResponse(PdfSummary ps) {
        return PdfSummaryResponse.builder()
                .id(ps.getId())
                .fileName(ps.getFileName())
                .summary(ps.getSummary())
                .createdAt(ps.getCreatedAt())
                .build();
    }

    // ── Helpers privés ─────────────────────────────────────────────────────────

    private User findUserOrThrow(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "L'utilisateur avec l'adresse e-mail spécifiée est introuvable."));
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Aucun fichier fourni ou le fichier est vide.");
        }

        String contentType      = file.getContentType();
        String originalFilename = file.getOriginalFilename();

        boolean isPdf = PDF_CONTENT_TYPE.equalsIgnoreCase(contentType)
                || (originalFilename != null
                    && originalFilename.toLowerCase().endsWith(".pdf"));

        if (!isPdf) {
            throw new BadRequestException(
                    "Format de fichier non supporté. Seuls les fichiers PDF sont acceptés.");
        }
    }

    private String extractText(PDDocument document) throws IOException {
        PDFTextStripper stripper = new PDFTextStripper();
        stripper.setSortByPosition(true);
        return stripper.getText(document).trim();
    }
}
