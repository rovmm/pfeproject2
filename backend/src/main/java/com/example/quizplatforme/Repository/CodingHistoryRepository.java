package com.example.quizplatforme.Repository;

import com.example.quizplatforme.Model.Entity.CodingHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CodingHistoryRepository extends JpaRepository<CodingHistory, Long> {

    Optional<CodingHistory> findBySessionIdAndStudentId(Long sessionId, Long studentId);

    List<CodingHistory> findBySessionId(Long sessionId);
}
