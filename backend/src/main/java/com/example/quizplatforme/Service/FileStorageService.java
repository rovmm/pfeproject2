package com.example.quizplatforme.Service;

import com.example.quizplatforme.exception.BadRequestException;
import com.example.quizplatforme.exception.ResourceNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final Logger log = LoggerFactory.getLogger(FileStorageService.class);

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "pdf", "docx", "doc", "pptx", "ppt", "txt", "png", "jpg", "jpeg", "gif",
            "cpp", "c", "java", "py", "js", "ts", "html", "css", "sql", "json", "xml", "zip"
    );

    @Value("${drive.upload.path:uploads/drive}")
    private String uploadBasePath;

    @Value("${drive.upload.max-size-mb:100}")
    private long maxSizeMb;

    public String storeFile(MultipartFile file, Long profId) {
        String originalName = file.getOriginalFilename();
        String extension = getExtension(originalName);

        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new BadRequestException("Type de fichier non autorisé : ." + extension);
        }

        long maxSizeBytes = maxSizeMb * 1024 * 1024;
        if (file.getSize() > maxSizeBytes) {
            throw new BadRequestException(
                    "Le fichier dépasse la taille maximale autorisée de " + maxSizeMb + " Mo.");
        }

        try {
            Path profDir = Paths.get(uploadBasePath, String.valueOf(profId));
            Files.createDirectories(profDir);

            String storedName = UUID.randomUUID() + "." + extension;
            Path targetPath = profDir.resolve(storedName);

            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            return storedName;
        } catch (IOException e) {
            throw new BadRequestException("Erreur lors de l'enregistrement du fichier : " + e.getMessage());
        }
    }

    public void deleteFile(String storedName, Long profId) {
        Path targetPath = Paths.get(uploadBasePath, String.valueOf(profId), storedName);
        try {
            boolean deleted = Files.deleteIfExists(targetPath);
            if (!deleted) {
                log.warn("Fichier introuvable sur le disque lors de la suppression : {}", targetPath);
            }
        } catch (IOException e) {
            log.warn("Erreur lors de la suppression du fichier {} : {}", targetPath, e.getMessage());
        }
    }

    public Resource loadFileAsResource(String storedName, Long profId) {
        try {
            Path targetPath = Paths.get(uploadBasePath, String.valueOf(profId), storedName);
            Resource resource = new UrlResource(targetPath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                throw new ResourceNotFoundException("Le fichier demandé est introuvable sur le serveur.");
            }
            return resource;
        } catch (MalformedURLException e) {
            throw new ResourceNotFoundException("Le fichier demandé est introuvable sur le serveur.");
        }
    }

    public String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "bin";
        }
        String extension = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase().trim();
        return extension.isEmpty() ? "bin" : extension;
    }
}
