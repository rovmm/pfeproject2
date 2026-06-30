package com.example.quizplatforme.Repository;

import com.example.quizplatforme.Model.Entity.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface QuizRepository extends JpaRepository<Quiz, Long> {

    Optional<Quiz> findBySessionId(Long sessionId);

    boolean existsBySessionId(Long sessionId);
}
