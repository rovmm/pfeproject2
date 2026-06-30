package com.example.quizplatforme.DTO.Request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class LoginRequest {

    @NotBlank(message = "L'adresse e-mail est obligatoire.")
    @Email(message = "L'adresse e-mail n'est pas valide.")
    @Size(max = 100, message = "L'adresse e-mail ne peut pas dépasser 100 caractères.")
    private String email;

    @NotBlank(message = "Le mot de passe est obligatoire.")
    @Size(min = 6, max = 100, message = "Le mot de passe doit contenir entre 6 et 100 caractères.")
    private String password;
}
