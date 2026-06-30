package com.example.quizplatforme.DTO.Response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentAnswerResult {

    private Long    questionId;
    private String  questionText;
    private String  selectedOption;
    private String  correctOption;
    private boolean isCorrect;
}
