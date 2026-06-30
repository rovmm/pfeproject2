package com.example.quizplatforme.Repository;

import com.example.quizplatforme.Model.Entity.Session;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SessionRepository extends JpaRepository<Session, Long> {

    Optional<Session> findByJoinCode(String joinCode);

    List<Session> findByProfId(Long profId);

    List<Session> findByStudentsId(Long studentId);
}