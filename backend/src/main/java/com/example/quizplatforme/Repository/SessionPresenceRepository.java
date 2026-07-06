package com.example.quizplatforme.Repository;

import com.example.quizplatforme.Model.Entity.SessionPresence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SessionPresenceRepository extends JpaRepository<SessionPresence, Long> {

    Optional<SessionPresence> findBySessionIdAndStudentId(Long sessionId, Long studentId);

    List<SessionPresence> findBySessionId(Long sessionId);
}
