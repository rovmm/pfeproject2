package com.example.quizplatforme.controller;

import com.example.quizplatforme.DTO.Request.AiAskRequest;
import com.example.quizplatforme.DTO.Request.UpdateFileSettingsRequest;
import com.example.quizplatforme.DTO.Response.DriveAiResponse;
import com.example.quizplatforme.DTO.Response.FileResponse;
import com.example.quizplatforme.Service.IDriveService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/drive/files")
@RequiredArgsConstructor
public class DriveFileController {

    private final IDriveService driveService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<FileResponse> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("folderId") Long folderId,
            @RequestParam(value = "visibility", defaultValue = "PRIVATE") String visibility,
            @RequestParam(value = "allowDownload", defaultValue = "true") Boolean allowDownload,
            @RequestParam(value = "visibleFrom", required = false) String visibleFrom,
            @AuthenticationPrincipal UserDetails userDetails) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(driveService.uploadFile(
                        folderId, file, visibility, allowDownload, visibleFrom, userDetails.getUsername()));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> downloadFile(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        Resource resource = driveService.downloadFile(id, userDetails.getUsername());

        MediaType mediaType = MediaTypeFactory.getMediaType(resource)
                .orElse(MediaType.APPLICATION_OCTET_STREAM);

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }

    /**
     * GET /api/drive/files/{id}/preview — authentifié
     *
     * <p>Sert le fichier en ligne (Content-Disposition: inline) pour un aperçu dans
     * l'application, sans déclencher de téléchargement. Mêmes règles d'accès que
     * {@code /download}, sans la contrainte {@code allowDownload} : le professeur
     * peut toujours prévisualiser ses propres fichiers, l'étudiant peut prévisualiser
     * tout fichier qui lui est visible.
     */
    @GetMapping("/{id}/preview")
    public ResponseEntity<Resource> previewFile(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        Resource resource = driveService.getFileForPreview(id, userDetails.getUsername());
        String filename = resource.getFilename();

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(determineContentType(filename)))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                .body(resource);
    }

    private String determineContentType(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "application/octet-stream";
        }
        String ext = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
        return switch (ext) {
            case "pdf" -> "application/pdf";
            case "png" -> "image/png";
            case "jpg", "jpeg" -> "image/jpeg";
            case "gif" -> "image/gif";
            case "webp" -> "image/webp";
            case "txt" -> "text/plain";
            case "html" -> "text/html";
            case "css" -> "text/css";
            case "js" -> "text/javascript";
            case "ts" -> "text/typescript";
            case "java" -> "text/x-java-source";
            case "py" -> "text/x-python";
            case "cpp", "c" -> "text/x-c";
            case "sql" -> "text/x-sql";
            case "json" -> "application/json";
            case "xml" -> "text/xml";
            default -> "application/octet-stream";
        };
    }

    @PutMapping("/{id}/settings")
    public ResponseEntity<FileResponse> updateFileSettings(
            @PathVariable Long id,
            @Valid @RequestBody UpdateFileSettingsRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        return ResponseEntity.ok(
                driveService.updateFileSettings(id, request, userDetails.getUsername()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFile(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        driveService.deleteFile(id, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }

    /**
     * POST /api/drive/files/{id}/ai/ask — authentifié
     *
     * <p>Répond à une question libre en se basant uniquement sur le contenu du fichier.
     * Enregistrée avant {@code /ai/{action}} : Spring priorise les segments littéraux
     * ("ask") sur les variables de chemin, donc l'ordre de déclaration n'a pas d'impact,
     * mais elle reste placée en premier par clarté.
     */
    @PostMapping("/{id}/ai/ask")
    public ResponseEntity<DriveAiResponse> askAboutFile(
            @PathVariable Long id,
            @Valid @RequestBody AiAskRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        String result = driveService.askAboutFile(id, request.getQuestion(), userDetails.getUsername());
        return ResponseEntity.ok(DriveAiResponse.builder().result(result).build());
    }

    /**
     * POST /api/drive/files/{id}/ai/{action} — authentifié
     *
     * <p>Exécute une action IA prédéfinie sur le fichier : SUMMARIZE, GENERATE_QUIZ,
     * GENERATE_FLASHCARDS, EXPLAIN, KEY_CONCEPTS, GENERATE_EXERCISE, EXPLAIN_CODE,
     * DEBUG_CODE, OPTIMIZE_CODE, REVIEW_CODE.
     */
    @PostMapping("/{id}/ai/{action}")
    public ResponseEntity<DriveAiResponse> runAiAction(
            @PathVariable Long id,
            @PathVariable String action,
            @AuthenticationPrincipal UserDetails userDetails) {

        String result = driveService.runAiAction(id, action, userDetails.getUsername());
        return ResponseEntity.ok(DriveAiResponse.builder().result(result).build());
    }
}
