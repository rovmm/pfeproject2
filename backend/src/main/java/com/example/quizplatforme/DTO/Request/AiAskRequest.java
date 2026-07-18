package com.example.quizplatforme.DTO.Request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AiAskRequest {

    @NotBlank(message = "La question ne peut pas être vide.")
    private String question;
}
