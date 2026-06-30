package com.example.quizplatforme.DTO.Request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class CreateQuestionRequest {

    @NotBlank(message = "Le texte de la question est obligatoire.")
    private String questionText;

    @NotBlank(message = "L'option A est obligatoire.")
    private String optionA;

    @NotBlank(message = "L'option B est obligatoire.")
    private String optionB;

    @NotBlank(message = "L'option C est obligatoire.")
    private String optionC;

    @NotBlank(message = "L'option D est obligatoire.")
    private String optionD;

    @NotNull(message = "La bonne réponse est obligatoire.")
    private String correctOption;

    private int position;
}
