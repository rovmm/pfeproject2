package com.example.quizplatforme.Service;

import com.example.quizplatforme.DTO.Request.CreateFolderRequest;
import com.example.quizplatforme.DTO.Request.UpdateFileSettingsRequest;
import com.example.quizplatforme.DTO.Response.FileResponse;
import com.example.quizplatforme.DTO.Response.FolderContentsResponse;
import com.example.quizplatforme.DTO.Response.FolderResponse;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface IDriveService {

    FolderResponse createFolder(CreateFolderRequest request, String profEmail);

    FolderContentsResponse getFolderContents(Long folderId, String callerEmail);

    List<FolderResponse> getMyRootFolders(String profEmail);

    FolderResponse renameFolder(Long id, String newName, String profEmail);

    FolderResponse updateFolderVisibility(Long id, String visibility, String visibleFrom, String profEmail);

    void deleteFolder(Long id, String profEmail);

    FileResponse uploadFile(Long folderId, MultipartFile file, String visibility,
                             Boolean allowDownload, String visibleFrom, String profEmail);

    Resource downloadFile(Long fileId, String callerEmail);

    /**
     * Charge un fichier pour aperçu en ligne (inline), sans déclencher de téléchargement.
     * Mêmes règles d'accès que {@link #downloadFile}, sans la contrainte
     * {@code allowDownload} — le professeur peut toujours prévisualiser ses propres
     * fichiers, l'étudiant peut prévisualiser tout fichier qui lui est visible.
     *
     * @param fileId      identifiant du fichier
     * @param callerEmail e-mail de l'utilisateur authentifié
     * @return ressource binaire du fichier
     */
    Resource getFileForPreview(Long fileId, String callerEmail);

    FileResponse updateFileSettings(Long fileId, UpdateFileSettingsRequest request, String profEmail);

    void deleteFile(Long fileId, String profEmail);

    List<FileResponse> searchFiles(String query, String profEmail);

    List<FolderResponse> getStudentView(Long profId, String studentEmail);

    /**
     * Exécute une action IA prédéfinie (résumé, quiz, flashcards, explication de code, etc.)
     * sur le contenu extrait d'un fichier du Drive.
     *
     * @param fileId      identifiant du fichier
     * @param action      action IA demandée (ex. : SUMMARIZE, GENERATE_QUIZ, EXPLAIN_CODE…)
     * @param callerEmail e-mail de l'utilisateur authentifié (prof propriétaire ou étudiant autorisé)
     * @return texte généré par l'IA
     */
    String runAiAction(Long fileId, String action, String callerEmail);

    /**
     * Répond à une question libre en se basant uniquement sur le contenu extrait du fichier.
     *
     * @param fileId      identifiant du fichier
     * @param question    question posée par l'utilisateur
     * @param callerEmail e-mail de l'utilisateur authentifié
     * @return réponse de l'IA, basée uniquement sur le document
     */
    String askAboutFile(Long fileId, String question, String callerEmail);
}
