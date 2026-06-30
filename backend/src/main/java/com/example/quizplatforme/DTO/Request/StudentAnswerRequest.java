package com.example.quizplatforme.DTO.Request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class StudentAnswerRequest {

    @NotNull(message = "L'identifiant de la question est obligatoire.")
    private Long questionId;

    @NotNull(message = "L'option sélectionnée est obligatoire.")
    private String selectedOption;
}
