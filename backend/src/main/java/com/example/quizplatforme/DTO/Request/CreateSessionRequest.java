package com.example.quizplatforme.DTO.Request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateSessionRequest {

    @NotBlank(message = "Le titre de la session est obligatoire")
    @Size(min = 3, max = 255, message = "Le titre doit contenir entre 3 et 255 caractères")
    private String title;

    /** "CODE" (default) or "QUIZ". */
    private String sessionType = "CODE";

    /** Required for CODE sessions; optional for QUIZ sessions. */
    private String language;

    /** Required for CODE sessions; optional for QUIZ sessions. */
    private String exercisePrompt;

    private String filiere;
}
