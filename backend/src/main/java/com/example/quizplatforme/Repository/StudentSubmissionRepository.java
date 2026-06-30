package com.example.quizplatforme.Repository;

import com.example.quizplatforme.Model.Entity.StudentSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentSubmissionRepository extends JpaRepository<StudentSubmission, Long> {

    List<StudentSubmission> findBySessionIdOrderBySubmittedAtDesc(Long sessionId);

    Optional<StudentSubmission> findBySessionIdAndStudentId(Long sessionId, Long studentId);
}
