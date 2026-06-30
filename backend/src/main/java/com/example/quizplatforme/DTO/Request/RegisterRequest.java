package com.example.quizplatforme.DTO.Request;

import com.example.quizplatforme.Model.Enum.RoleEnum;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank(message = "Le nom complet est obligatoire.")
    @Size(max = 100, message = "Le nom complet ne peut pas dépasser 100 caractères.")
    private String fullName;

    @NotBlank(message = "L'adresse e-mail est obligatoire.")
    @Email(message = "L'adresse e-mail n'est pas valide.")
    @Size(max = 100, message = "L'adresse e-mail ne peut pas dépasser 100 caractères.")
    private String email;

    @NotBlank(message = "Le mot de passe est obligatoire.")
    @Size(min = 8, max = 100, message = "Le mot de passe doit contenir entre 8 et 100 caractères.")
    private String password;

    @NotNull(message = "Le rôle doit être PROF ou ETUDIANT.")
    private RoleEnum role;
}
