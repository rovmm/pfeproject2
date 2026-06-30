package com.example.quizplatforme.DTO.Request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CodeRequest {

    @NotBlank(message = "Le code ne peut pas être vide.")
    private String code;

    @NotBlank(message = "Le langage ne peut pas être vide.")
    private String language;

    /** Entrée standard optionnelle transmise au programme lors de l'exécution. */
    private String stdin;
}
