package com.example.quizplatforme.DTO.Request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class CreateQuizRequest {

    @NotBlank(message = "Le titre du quiz est obligatoire.")
    private String title;

    private String description;

    private int timeLimitMinutes = 0;

    @NotEmpty(message = "Le quiz doit contenir au moins une question.")
    @Valid
    private List<CreateQuestionRequest> questions;
}
