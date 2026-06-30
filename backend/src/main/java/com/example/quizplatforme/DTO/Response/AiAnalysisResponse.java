package com.example.quizplatforme.DTO.Response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiAnalysisResponse {
    private Long executionId;
    private String language;
    private String code;
    private String error;
    private String analysis;  // réponse DeepSeek en français
}