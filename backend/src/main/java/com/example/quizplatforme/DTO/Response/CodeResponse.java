package com.example.quizplatforme.DTO.Response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CodeResponse {

    private boolean success;
    private String output;
    private String error;
    private Long executionTimeMs;
    private String status;
    private String language;
    private int exitCode;

    public static CodeResponse ok(String output, String language, long executionTimeMs) {
        return CodeResponse.builder()
                .success(true)
                .output(output)
                .error(null)
                .status("SUCCESS")
                .language(language)
                .executionTimeMs(executionTimeMs)
                .exitCode(0)
                .build();
    }

    public static CodeResponse fail(String error, String language, long executionTimeMs) {
        return CodeResponse.builder()
                .success(false)
                .output(null)
                .error(error)
                .status("ERROR")
                .language(language)
                .executionTimeMs(executionTimeMs)
                .exitCode(-1)
                .build();
    }

    public static CodeResponse timeout(String language) {
        return CodeResponse.builder()
                .success(false)
                .output(null)
                .error("Execution timed out.")
                .status("TIMEOUT")
                .language(language)
                .executionTimeMs(null)
                .exitCode(-1)
                .build();
    }

    public static CodeResponse unsupportedLanguage(String language) {
        return CodeResponse.builder()
                .success(false)
                .output(null)
                .error("Unsupported language: " + language)
                .status("UNSUPPORTED")
                .language(language)
                .executionTimeMs(0L)
                .exitCode(-1)
                .build();
    }
}