package com.example.quizplatforme.Service;

import com.example.quizplatforme.DTO.Response.PdfSummaryResponse;
import com.example.quizplatforme.DTO.Response.SummaryResponse;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.List;

/**
 * Contrat du service de traitement des fichiers PDF.
 *
 * <p>Deux opérations sont exposées :
 * <ol>
 *   <li>{@link #summarizePdf} — extrait le texte, appelle l'IA Grok, persiste le résumé</li>
 *   <li>{@link #getPdfHistory} — liste les résumés passés de l'utilisateur authentifié</li>
 * </ol>
 */
public interface IPdfService {

    /**
     * Extrait le texte du PDF, génère un résumé via l'IA Grok et persiste le résultat
     * dans la table {@code pdf_summaries}.
     *
     * @param file      fichier PDF uploadé (multipart/form-data)
     * @param userEmail adresse e-mail de l'utilisateur authentifié (propriétaire du résumé)
     * @return {@link SummaryResponse} contenant le résumé, le nom du fichier et le nombre de pages
     * @throws com.example.quizplatforme.exception.BadRequestException si le fichier est invalide
     * @throws com.example.quizplatforme.exception.ResourceNotFoundException si l'utilisateur est introuvable
     */
    SummaryResponse summarizePdf(MultipartFile file, String userEmail);

    /**
     * Retourne l'historique des résumés PDF de l'utilisateur, du plus récent au plus ancien.
     *
     * @param userEmail adresse e-mail de l'utilisateur authentifié
     * @return liste triée par {@code created_at DESC}, vide si aucun résumé
     * @throws com.example.quizplatforme.exception.ResourceNotFoundException si l'utilisateur est introuvable
     */
    List<PdfSummaryResponse> getPdfHistory(String userEmail);

    /**
     * Extrait le texte brut d'un flux PDF, sans appel IA ni persistance.
     *
     * <p>Utilisé par d'autres services (ex. : Professor Drive) qui ont besoin du
     * texte d'un PDF déjà stocké sur disque, en dehors du flux d'upload multipart.
     *
     * @param inputStream flux du fichier PDF
     * @return texte extrait, éventuellement vide si le PDF est scanné/protégé
     * @throws com.example.quizplatforme.exception.BadRequestException si la lecture échoue
     */
    String extractTextFromStream(InputStream inputStream);
}
