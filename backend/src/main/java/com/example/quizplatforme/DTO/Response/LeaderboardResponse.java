package com.example.quizplatforme.DTO.Response;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeaderboardResponse {

    private List<LeaderboardEntry> entries;
    private int totalStudents;
    private int completedCount;
}
