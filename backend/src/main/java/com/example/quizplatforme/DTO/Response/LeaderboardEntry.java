package com.example.quizplatforme.DTO.Response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeaderboardEntry {

    private int    rank;
    private String studentName;
    private String studentEmail;
    private int    score;
    private int    totalQuestions;
    private BigDecimal percentage;
    private LocalDateTime completedAt;
}
