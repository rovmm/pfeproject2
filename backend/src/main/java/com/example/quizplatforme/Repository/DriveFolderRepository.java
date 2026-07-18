package com.example.quizplatforme.Repository;

import com.example.quizplatforme.Model.Entity.DriveFolder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DriveFolderRepository extends JpaRepository<DriveFolder, Long> {

    List<DriveFolder> findByProfIdAndParentIsNull(Long profId);

    List<DriveFolder> findByParentId(Long parentId);

    List<DriveFolder> findByProfId(Long profId);

    boolean existsByNameAndParentIdAndProfId(String name, Long parentId, Long profId);

    boolean existsByNameAndParentIsNullAndProfId(String name, Long profId);
}
