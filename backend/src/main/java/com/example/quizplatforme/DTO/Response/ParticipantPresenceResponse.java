package com.example.quizplatforme.DTO.Response;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ParticipantPresenceResponse {

    private Long studentId;
    private String studentName;
    private String studentEmail;
    private LocalDateTime lastSeenAt;
    private boolean online;
}
