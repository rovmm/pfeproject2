package com.example.quizplatforme.DTO.Request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateSessionRequest {

    @NotBlank(message = "Le titre de la session est obligatoire")
    @Size(min = 3, max = 255, message = "Le titre doit contenir entre 3 et 255 caractères")
    private String title;

    /** "CODE" (default) or "QUIZ". */
    private String sessionType = "CODE";

    /** Required for CODE sessions; optional for QUIZ sessions. */
    private String language;

    /** Required for CODE sessions; optional for QUIZ sessions. */
    private String exercisePrompt;

    private String filiere;

    /** Whether the AI chat assistant / analyze features are usable during this session. */
    private boolean allowAI = true;

    /** Whether copy/paste is disabled in the student code editor for this session. */
    private boolean disableCopyPaste = false;

    /** Whether the student is warned when switching away from the tab during this session. */
    private boolean warnOnTabSwitch = false;

    /** Whether the student's code editor auto-saves during this session. */
    private boolean autoSave = true;

    /** Time limit in minutes for the session; 0 means no limit. */
    private int timeLimitMinutes = 0;

    /** Whether per-student coding history (edit count + snapshots) is recorded for this session. */
    private boolean recordCodingHistory = false;
}
