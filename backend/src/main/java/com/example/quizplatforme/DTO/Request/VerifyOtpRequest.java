package com.example.quizplatforme.DTO.Request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class VerifyOtpRequest {

    @NotBlank(message = "L'adresse e-mail est obligatoire.")
    @Email(message = "L'adresse e-mail n'est pas valide.")
    private String email;

    @NotBlank(message = "Le code est obligatoire.")
    @Size(min = 6, max = 6, message = "Le code doit contenir exactement 6 chiffres.")
    private String code;
}
