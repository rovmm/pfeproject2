package com.example.quizplatforme.Repository;

import com.example.quizplatforme.Model.Entity.DriveFile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DriveFileRepository extends JpaRepository<DriveFile, Long> {

    List<DriveFile> findByFolderId(Long folderId);

    List<DriveFile> findByProfId(Long profId);

    List<DriveFile> findByFolderIdAndVisibility(Long folderId, String visibility);

    List<DriveFile> findByProfIdAndOriginalNameContainingIgnoreCase(Long profId, String query);

    long countByFolderId(Long folderId);
}
