package com.example.quizplatforme.DTO.Request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class SaveCodingHistoryRequest {

    private int editCount;

    @NotNull(message = "startedAt est obligatoire.")
    private LocalDateTime startedAt;

    @Valid
    private List<CodeSnapshot> snapshots = new ArrayList<>();
}
