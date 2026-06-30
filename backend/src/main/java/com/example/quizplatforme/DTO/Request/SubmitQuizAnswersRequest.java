package com.example.quizplatforme.DTO.Request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class SubmitQuizAnswersRequest {

    @NotEmpty(message = "La liste des réponses ne peut pas être vide.")
    @Valid
    private List<StudentAnswerRequest> answers;
}
