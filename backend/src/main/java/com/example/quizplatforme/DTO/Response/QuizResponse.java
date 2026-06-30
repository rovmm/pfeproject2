package com.example.quizplatforme.DTO.Response;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizResponse {

    private Long   id;
    private String title;
    private String description;
    private int    timeLimitMinutes;
    private Long   sessionId;

    /** QuestionResponse for students; QuestionWithAnswerResponse for prof. */
    private List<QuestionResponse> questions;

    public int getQuestionCount() {
        return questions == null ? 0 : questions.size();
    }
}
