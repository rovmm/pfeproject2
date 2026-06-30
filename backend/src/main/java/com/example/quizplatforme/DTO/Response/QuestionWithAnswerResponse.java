package com.example.quizplatforme.DTO.Response;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class QuestionWithAnswerResponse extends QuestionResponse {

    private String correctOption;

    public QuestionWithAnswerResponse(Long id, String questionText,
                                      String optionA, String optionB,
                                      String optionC, String optionD,
                                      int position, String correctOption) {
        super(id, questionText, optionA, optionB, optionC, optionD, position);
        this.correctOption = correctOption;
    }
}
