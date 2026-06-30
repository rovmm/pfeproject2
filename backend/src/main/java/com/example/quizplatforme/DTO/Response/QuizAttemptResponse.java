package com.example.quizplatforme.DTO.Response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizAttemptResponse {

    private Long   id;
    private Long   studentId;
    private String studentName;
    private String studentEmail;
    private int    score;
    private int    totalQuestions;
    private BigDecimal percentage;
    private List<StudentAnswerResult> answers;
    private LocalDateTime completedAt;
}
