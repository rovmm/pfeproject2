package com.example.quizplatforme.DTO.Response;

import com.example.quizplatforme.Model.Enum.SessionStatus;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SessionResponse {

    private Long id;
    private String title;
    private String joinCode;
    private SessionStatus status;
    private Long profId;
    private String profName;
    private int studentCount;
    private String language;
    private String exercisePrompt;
    private String filiere;
    private String sessionType;
    private Boolean hasQuiz;
    private boolean allowAI;
    private boolean disableCopyPaste;
    private boolean warnOnTabSwitch;
    private boolean autoSave;
    private int timeLimitMinutes;
    private boolean recordCodingHistory;
    private LocalDateTime createdAt;
}
