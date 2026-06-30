package com.example.quizplatforme.DTO.Request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SubmitCodeRequest {

    @NotBlank(message = "Le code soumis ne peut pas être vide.")
    private String code;

    private String language;

    private String stdin;
}
