package com.example.quizplatforme.Service.Impl;

import com.example.quizplatforme.DTO.Request.CreateFolderRequest;
import com.example.quizplatforme.DTO.Request.UpdateFileSettingsRequest;
import com.example.quizplatforme.DTO.Response.FileResponse;
import com.example.quizplatforme.DTO.Response.FolderContentsResponse;
import com.example.quizplatforme.DTO.Response.FolderResponse;
import com.example.quizplatforme.Model.Entity.DriveFile;
import com.example.quizplatforme.Model.Entity.DriveFolder;
import com.example.quizplatforme.Model.Entity.User;
import com.example.quizplatforme.Model.Enum.RoleEnum;
import com.example.quizplatforme.Repository.DriveFileRepository;
import com.example.quizplatforme.Repository.DriveFolderRepository;
import com.example.quizplatforme.Repository.UserRepository;
import com.example.quizplatforme.Service.FileStorageService;
import com.example.quizplatforme.Service.IDriveService;
import com.example.quizplatforme.Service.IAiService;
import com.example.quizplatforme.Service.IPdfService;
import com.example.quizplatforme.Service.IVisionService;
import com.example.quizplatforme.exception.BadRequestException;
import com.example.quizplatforme.exception.ForbiddenException;
import com.example.quizplatforme.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class DriveServiceImpl implements IDriveService {

    private static final Logger log = LoggerFactory.getLogger(DriveServiceImpl.class);

    private static final Set<String> VALID_VISIBILITIES = Set.of("STUDENTS", "PRIVATE", "HIDDEN_UNTIL_DATE");

    /** Extensions lisibles directement comme texte (hors PDF, traité séparément via PdfBox). */
    private static final Set<String> TEXT_EXTENSIONS = Set.of(
            "txt", "cpp", "c", "java", "py", "js", "ts", "html", "css", "sql", "json", "xml");

    /** Images lues via le service de vision IA (Mistral), pas via Groq. */
    private static final Map<String, String> IMAGE_MIME_TYPES = Map.of(
            "png",  "image/png",
            "jpg",  "image/jpeg",
            "jpeg", "image/jpeg",
            "gif",  "image/gif",
            "webp", "image/webp");

    private static final String IMAGE_READ_PROMPT =
            "Décris le contenu de cette image de manière détaillée et transcris tout texte "
            + "visible (manuscrit ou imprimé) exactement tel qu'il apparaît, en français.";

    /** Plafond de texte envoyé à Grok (même ordre de grandeur que PdfServiceImpl). */
    private static final int MAX_AI_TEXT_LENGTH = 12_000;

    private static final String AI_SYSTEM_PROMPT =
            "Tu es un assistant pédagogique expert. Tu réponds toujours en français, "
            + "de manière claire, structurée et adaptée à des étudiants.";

    private static final Map<String, String> ACTION_INSTRUCTIONS = Map.ofEntries(
            Map.entry("SUMMARIZE",
                    "Résume le document suivant en français, de manière claire et structurée."),
            Map.entry("GENERATE_QUIZ",
                    "Génère un quiz de 5 questions à choix multiples (QCM) basé sur le document suivant. "
                    + "Indique la bonne réponse pour chaque question."),
            Map.entry("GENERATE_FLASHCARDS",
                    "Génère une liste de flashcards (question / réponse) basées sur les notions clés "
                    + "du document suivant."),
            Map.entry("EXPLAIN",
                    "Explique le contenu du document suivant de manière simple et pédagogique, "
                    + "comme à un étudiant qui découvre le sujet."),
            Map.entry("KEY_CONCEPTS",
                    "Extrais et liste les concepts clés du document suivant, avec une courte explication "
                    + "pour chacun."),
            Map.entry("GENERATE_EXERCISE",
                    "Génère un exercice pratique, avec son énoncé et sa correction, basé sur le contenu "
                    + "du document suivant."),
            Map.entry("EXPLAIN_CODE",
                    "Explique ce que fait le code suivant, de façon claire et pédagogique."),
            Map.entry("DEBUG_CODE",
                    "Analyse le code suivant, identifie les bugs ou erreurs potentielles, et propose des "
                    + "corrections précises."),
            Map.entry("OPTIMIZE_CODE",
                    "Analyse le code suivant et propose des optimisations (performance, lisibilité, "
                    + "bonnes pratiques), avec des exemples."),
            Map.entry("REVIEW_CODE",
                    "Fais une revue de code complète du code suivant : qualité, bonnes pratiques, "
                    + "points à améliorer et suggestions concrètes.")
    );

    private final DriveFolderRepository folderRepository;
    private final DriveFileRepository fileRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final IAiService aiService;
    private final IPdfService pdfService;
    private final IVisionService visionService;

    // ── Dossiers ────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public FolderResponse createFolder(CreateFolderRequest request, String profEmail) {
        User prof = getUserByEmail(profEmail);

        DriveFolder parent = null;
        if (request.getParentId() != null) {
            parent = folderRepository.findById(request.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Dossier", "id", request.getParentId()));
            if (!parent.getProf().getId().equals(prof.getId())) {
                throw new ForbiddenException("Vous n'êtes pas autorisé à créer un dossier ici.");
            }
        }

        boolean nameExists = parent != null
                ? folderRepository.existsByNameAndParentIdAndProfId(request.getName(), parent.getId(), prof.getId())
                : folderRepository.existsByNameAndParentIsNullAndProfId(request.getName(), prof.getId());

        if (nameExists) {
            throw new BadRequestException("Un dossier avec ce nom existe déjà.");
        }

        String visibility = validateVisibility(request.getVisibility());

        DriveFolder folder = DriveFolder.builder()
                .name(request.getName())
                .prof(prof)
                .parent(parent)
                .visibility(visibility)
                .visibleFrom(parseDateTime(request.getVisibleFrom()))
                .build();

        folder = folderRepository.save(folder);

        return toFolderResponse(folder, 0, 0);
    }

    @Override
    @Transactional(readOnly = true)
    public FolderContentsResponse getFolderContents(Long folderId, String callerEmail) {
        DriveFolder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new ResourceNotFoundException("Dossier", "id", folderId));

        User caller = getUserByEmail(callerEmail);

        List<DriveFolder> subfolders = folderRepository.findByParentId(folderId);
        List<DriveFile> files = fileRepository.findByFolderId(folderId);

        if (caller.getRole() == RoleEnum.PROF) {
            if (!folder.getProf().getId().equals(caller.getId())) {
                throw new ForbiddenException("Vous n'êtes pas autorisé à consulter ce dossier.");
            }
        } else {
            subfolders = subfolders.stream().filter(this::isVisibleToStudent).toList();
            files = files.stream().filter(this::isVisibleToStudent).toList();
        }

        List<FolderResponse> subfolderResponses = new ArrayList<>();
        for (DriveFolder sub : subfolders) {
            subfolderResponses.add(toFolderResponse(sub, countSubfolders(sub.getId()), countFiles(sub.getId())));
        }

        List<FileResponse> fileResponses = files.stream().map(this::toFileResponse).toList();

        List<FolderResponse> breadcrumb = new ArrayList<>();
        DriveFolder current = folder.getParent();
        while (current != null) {
            breadcrumb.add(0, toFolderResponse(current, 0, 0));
            current = current.getParent();
        }

        FolderResponse folderResponse = toFolderResponse(folder, countSubfolders(folder.getId()), countFiles(folder.getId()));

        return FolderContentsResponse.builder()
                .folder(folderResponse)
                .subfolders(subfolderResponses)
                .files(fileResponses)
                .breadcrumb(breadcrumb)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<FolderResponse> getMyRootFolders(String profEmail) {
        User prof = getUserByEmail(profEmail);
        List<DriveFolder> roots = folderRepository.findByProfIdAndParentIsNull(prof.getId());

        return roots.stream()
                .map(f -> toFolderResponse(f, countSubfolders(f.getId()), countFiles(f.getId())))
                .toList();
    }

    @Override
    @Transactional
    public FolderResponse renameFolder(Long id, String newName, String profEmail) {
        User prof = getUserByEmail(profEmail);
        DriveFolder folder = getOwnedFolder(id, prof);

        folder.setName(newName);
        folder = folderRepository.save(folder);

        return toFolderResponse(folder, countSubfolders(folder.getId()), countFiles(folder.getId()));
    }

    @Override
    @Transactional
    public FolderResponse updateFolderVisibility(Long id, String visibility, String visibleFrom, String profEmail) {
        User prof = getUserByEmail(profEmail);
        DriveFolder folder = getOwnedFolder(id, prof);

        folder.setVisibility(validateVisibility(visibility));
        folder.setVisibleFrom(parseDateTime(visibleFrom));
        folder = folderRepository.save(folder);

        return toFolderResponse(folder, countSubfolders(folder.getId()), countFiles(folder.getId()));
    }

    @Override
    @Transactional
    public void deleteFolder(Long id, String profEmail) {
        User prof = getUserByEmail(profEmail);
        DriveFolder folder = getOwnedFolder(id, prof);

        List<DriveFile> filesToDelete = new ArrayList<>();
        collectFilesRecursively(folder, filesToDelete);

        for (DriveFile file : filesToDelete) {
            fileStorageService.deleteFile(file.getStoredName(), file.getProf().getId());
        }

        folderRepository.delete(folder);

        log.info("Dossier {} supprimé — {} fichier(s) supprimé(s) du disque.", id, filesToDelete.size());
    }

    // ── Fichiers ────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public FileResponse uploadFile(Long folderId, MultipartFile file, String visibility,
                                    Boolean allowDownload, String visibleFrom, String profEmail) {
        User prof = getUserByEmail(profEmail);
        DriveFolder folder = getOwnedFolder(folderId, prof);

        String storedName = fileStorageService.storeFile(file, prof.getId());
        String extension = fileStorageService.getExtension(file.getOriginalFilename());

        DriveFile driveFile = DriveFile.builder()
                .originalName(file.getOriginalFilename())
                .storedName(storedName)
                .filePath(prof.getId() + "/" + storedName)
                .fileType(extension)
                .fileSize(file.getSize())
                .folder(folder)
                .prof(prof)
                .visibility(validateVisibility(visibility))
                .visibleFrom(parseDateTime(visibleFrom))
                .allowDownload(allowDownload == null || allowDownload)
                .build();

        driveFile = fileRepository.save(driveFile);

        return toFileResponse(driveFile);
    }

    @Override
    @Transactional(readOnly = true)
    public Resource downloadFile(Long fileId, String callerEmail) {
        DriveFile file = fileRepository.findById(fileId)
                .orElseThrow(() -> new ResourceNotFoundException("Fichier", "id", fileId));

        User caller = getUserByEmail(callerEmail);

        if (caller.getRole() == RoleEnum.PROF) {
            if (!file.getProf().getId().equals(caller.getId())) {
                throw new ForbiddenException("Vous n'êtes pas autorisé à accéder à ce fichier.");
            }
        } else {
            if (!isVisibleToStudent(file) || !file.isAllowDownload()) {
                throw new ForbiddenException("Téléchargement non autorisé.");
            }
        }

        return fileStorageService.loadFileAsResource(file.getStoredName(), file.getProf().getId());
    }

    @Override
    @Transactional(readOnly = true)
    public Resource getFileForPreview(Long fileId, String callerEmail) {
        DriveFile file = getAccessibleFile(fileId, callerEmail);
        return fileStorageService.loadFileAsResource(file.getStoredName(), file.getProf().getId());
    }

    @Override
    @Transactional
    public FileResponse updateFileSettings(Long fileId, UpdateFileSettingsRequest request, String profEmail) {
        User prof = getUserByEmail(profEmail);
        DriveFile file = getOwnedFile(fileId, prof);

        if (request.getName() != null) {
            file.setOriginalName(request.getName());
        }
        if (request.getVisibility() != null) {
            file.setVisibility(validateVisibility(request.getVisibility()));
        }
        if (request.getVisibleFrom() != null) {
            file.setVisibleFrom(parseDateTime(request.getVisibleFrom()));
        }
        if (request.getAllowDownload() != null) {
            file.setAllowDownload(request.getAllowDownload());
        }

        file = fileRepository.save(file);

        return toFileResponse(file);
    }

    @Override
    @Transactional
    public void deleteFile(Long fileId, String profEmail) {
        User prof = getUserByEmail(profEmail);
        DriveFile file = getOwnedFile(fileId, prof);

        fileStorageService.deleteFile(file.getStoredName(), prof.getId());
        fileRepository.delete(file);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FileResponse> searchFiles(String query, String profEmail) {
        User prof = getUserByEmail(profEmail);
        List<DriveFile> files = fileRepository.findByProfIdAndOriginalNameContainingIgnoreCase(prof.getId(), query);

        return files.stream().map(this::toFileResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<FolderResponse> getStudentView(Long profId, String studentEmail) {
        getUserByEmail(studentEmail);

        List<DriveFolder> roots = folderRepository.findByProfIdAndParentIsNull(profId);

        return roots.stream()
                .filter(this::isVisibleToStudent)
                .map(f -> toFolderResponse(f, countSubfolders(f.getId()), countFiles(f.getId())))
                .toList();
    }

    // ── Actions IA ──────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public String runAiAction(Long fileId, String action, String callerEmail) {
        String key = action == null ? null : action.toUpperCase().trim();
        String instruction = ACTION_INSTRUCTIONS.get(key);
        if (instruction == null) {
            throw new BadRequestException("Action IA invalide : " + action);
        }

        DriveFile file = getAccessibleFile(fileId, callerEmail);
        String textForAi = extractTextForAi(file);

        String userMessage = instruction + "\n\n---\n\n" + textForAi;

        log.info("Exécution de l'action IA '{}' sur le fichier {}", key, fileId);
        return aiService.chat(AI_SYSTEM_PROMPT, null, userMessage);
    }

    @Override
    @Transactional(readOnly = true)
    public String askAboutFile(Long fileId, String question, String callerEmail) {
        if (question == null || question.isBlank()) {
            throw new BadRequestException("La question ne peut pas être vide.");
        }

        DriveFile file = getAccessibleFile(fileId, callerEmail);
        String textForAi = extractTextForAi(file);

        String systemPrompt = "Réponds UNIQUEMENT en te basant sur le document suivant. "
                + "Si la réponse n'est pas dans le document, dis-le clairement.\n\n"
                + "**Document :**\n" + textForAi;

        log.info("Question posée sur le fichier {}", fileId);
        return aiService.chat(systemPrompt, null, question);
    }

    /**
     * Charge le fichier depuis le disque et en extrait le texte exploitable par l'IA.
     *
     * <p>PDF → extraction via {@link IPdfService}. Fichiers texte/code (voir
     * {@link #TEXT_EXTENSIONS}) → lecture directe en UTF-8. Images (voir
     * {@link #IMAGE_MIME_TYPES}) → description/transcription via {@link IVisionService}
     * (Groq ne lit pas les images). Tout autre type (.docx, .pptx, .zip…) est rejeté avec un 400.
     */
    private String extractTextForAi(DriveFile file) {
        String type = file.getFileType() == null ? "" : file.getFileType().toLowerCase();

        String content;
        if ("pdf".equals(type)) {
            content = readPdfText(file);
        } else if (TEXT_EXTENSIONS.contains(type)) {
            content = readPlainText(file);
        } else if (IMAGE_MIME_TYPES.containsKey(type)) {
            content = readImageDescription(file, type);
        } else {
            throw new BadRequestException("Ce type de fichier ne supporte pas les actions IA.");
        }

        if (content == null || content.isBlank()) {
            throw new BadRequestException("Impossible d'extraire du contenu exploitable de ce fichier.");
        }

        return content.length() > MAX_AI_TEXT_LENGTH ? content.substring(0, MAX_AI_TEXT_LENGTH) : content;
    }

    private String readImageDescription(DriveFile file, String type) {
        Resource resource = fileStorageService.loadFileAsResource(file.getStoredName(), file.getProf().getId());
        try (InputStream inputStream = resource.getInputStream()) {
            byte[] imageBytes = inputStream.readAllBytes();
            return visionService.describeImage(imageBytes, IMAGE_MIME_TYPES.get(type), IMAGE_READ_PROMPT);
        } catch (IOException e) {
            throw new BadRequestException("Erreur lors de la lecture de l'image : " + e.getMessage());
        }
    }

    private String readPdfText(DriveFile file) {
        Resource resource = fileStorageService.loadFileAsResource(file.getStoredName(), file.getProf().getId());
        try (InputStream inputStream = resource.getInputStream()) {
            return pdfService.extractTextFromStream(inputStream);
        } catch (IOException e) {
            throw new BadRequestException("Erreur lors de la lecture du fichier PDF : " + e.getMessage());
        }
    }

    private String readPlainText(DriveFile file) {
        Resource resource = fileStorageService.loadFileAsResource(file.getStoredName(), file.getProf().getId());
        try (InputStream inputStream = resource.getInputStream()) {
            return new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new BadRequestException("Erreur lors de la lecture du fichier : " + e.getMessage());
        }
    }

    /**
     * Vérifie que l'appelant peut accéder au fichier pour une action IA :
     * le prof doit en être propriétaire, l'étudiant doit avoir accès en visibilité
     * (mêmes règles que {@link #downloadFile}, sans la contrainte {@code allowDownload}
     * puisqu'aucun téléchargement n'a lieu ici).
     */
    private DriveFile getAccessibleFile(Long fileId, String callerEmail) {
        DriveFile file = fileRepository.findById(fileId)
                .orElseThrow(() -> new ResourceNotFoundException("Fichier", "id", fileId));

        User caller = getUserByEmail(callerEmail);

        if (caller.getRole() == RoleEnum.PROF) {
            if (!file.getProf().getId().equals(caller.getId())) {
                throw new ForbiddenException("Vous n'êtes pas autorisé à accéder à ce fichier.");
            }
        } else if (!isVisibleToStudent(file)) {
            throw new ForbiddenException("Vous n'êtes pas autorisé à accéder à ce fichier.");
        }

        return file;
    }

    // ── Helpers privés ──────────────────────────────────────────────────────

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", "email", email));
    }

    private DriveFolder getOwnedFolder(Long id, User prof) {
        DriveFolder folder = folderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Dossier", "id", id));
        if (!folder.getProf().getId().equals(prof.getId())) {
            throw new ForbiddenException("Vous n'êtes pas autorisé à modifier ce dossier.");
        }
        return folder;
    }

    private DriveFile getOwnedFile(Long id, User prof) {
        DriveFile file = fileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Fichier", "id", id));
        if (!file.getProf().getId().equals(prof.getId())) {
            throw new ForbiddenException("Vous n'êtes pas autorisé à modifier ce fichier.");
        }
        return file;
    }

    private String validateVisibility(String visibility) {
        String v = visibility == null ? "PRIVATE" : visibility.toUpperCase().trim();
        if (!VALID_VISIBILITIES.contains(v)) {
            throw new BadRequestException("Valeur de visibilité invalide : " + visibility);
        }
        return v;
    }

    private LocalDateTime parseDateTime(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return LocalDateTime.parse(value);
        } catch (Exception e) {
            throw new BadRequestException("Format de date invalide pour visibleFrom.");
        }
    }

    private boolean isVisibleToStudent(DriveFolder folder) {
        return switch (folder.getVisibility()) {
            case "STUDENTS" -> true;
            case "HIDDEN_UNTIL_DATE" -> folder.getVisibleFrom() != null && !folder.getVisibleFrom().isAfter(LocalDateTime.now());
            default -> false;
        };
    }

    private boolean isVisibleToStudent(DriveFile file) {
        return switch (file.getVisibility()) {
            case "STUDENTS" -> true;
            case "HIDDEN_UNTIL_DATE" -> file.getVisibleFrom() != null && !file.getVisibleFrom().isAfter(LocalDateTime.now());
            default -> false;
        };
    }

    private int countSubfolders(Long folderId) {
        return folderRepository.findByParentId(folderId).size();
    }

    private int countFiles(Long folderId) {
        return (int) fileRepository.countByFolderId(folderId);
    }

    private void collectFilesRecursively(DriveFolder folder, List<DriveFile> collector) {
        collector.addAll(fileRepository.findByFolderId(folder.getId()));
        List<DriveFolder> children = folderRepository.findByParentId(folder.getId());
        for (DriveFolder child : children) {
            collectFilesRecursively(child, collector);
        }
    }

    private FolderResponse toFolderResponse(DriveFolder folder, int subfolderCount, int fileCount) {
        return FolderResponse.builder()
                .id(folder.getId())
                .name(folder.getName())
                .profId(folder.getProf().getId())
                .parentId(folder.getParent() != null ? folder.getParent().getId() : null)
                .visibility(folder.getVisibility())
                .visibleFrom(folder.getVisibleFrom() != null ? folder.getVisibleFrom().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null)
                .subfolderCount(subfolderCount)
                .fileCount(fileCount)
                .createdAt(folder.getCreatedAt() != null ? folder.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null)
                .updatedAt(folder.getUpdatedAt() != null ? folder.getUpdatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null)
                .build();
    }

    private FileResponse toFileResponse(DriveFile file) {
        return FileResponse.builder()
                .id(file.getId())
                .originalName(file.getOriginalName())
                .fileType(file.getFileType())
                .fileSize(file.getFileSize())
                .folderId(file.getFolder().getId())
                .folderName(file.getFolder().getName())
                .profId(file.getProf().getId())
                .profName(file.getProf().getFullName())
                .visibility(file.getVisibility())
                .visibleFrom(file.getVisibleFrom() != null ? file.getVisibleFrom().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null)
                .allowDownload(file.isAllowDownload())
                .uploadedAt(file.getUploadedAt() != null ? file.getUploadedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null)
                .downloadUrl("/api/drive/files/" + file.getId() + "/download")
                .build();
    }
}
