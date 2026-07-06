package com.example.quizplatforme.DTO.Response;

import com.example.quizplatforme.DTO.Request.CodeSnapshot;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CodingHistoryResponse {
    private Long studentId;
    private String studentName;
    private String studentEmail;
    private int editCount;
    private LocalDateTime startedAt;
    private LocalDateTime submittedAt;
    private List<CodeSnapshot> snapshots;
}
