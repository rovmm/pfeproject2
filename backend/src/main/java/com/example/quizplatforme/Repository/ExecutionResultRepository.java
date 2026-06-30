package com.example.quizplatforme.Repository;

import com.example.quizplatforme.Model.ExecutionResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ExecutionResultRepository extends JpaRepository<ExecutionResult, Long> {
    List<ExecutionResult> findByUserIdOrderByCreatedAtDesc(Long userId);
}