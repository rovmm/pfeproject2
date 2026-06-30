package com.example.quizplatforme.DTO.Response;

import com.example.quizplatforme.Model.Enum.SubmissionStatus;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentSubmissionResponse {

    private Long id;
    private Long studentId;
    private String studentName;
    private String studentEmail;
    private String code;
    private String stdout;
    private String stderr;
    private int exitCode;
    private long executionTimeMs;
    private SubmissionStatus status;
    private LocalDateTime submittedAt;
}
