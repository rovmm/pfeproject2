package com.example.quizplatforme.DTO.Request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Un instantané du code d'un étudiant à un moment donné, capturé par le
 * frontend pendant une session de codage.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CodeSnapshot {
    private String code;
    private String timestamp;
    private String language;
}
