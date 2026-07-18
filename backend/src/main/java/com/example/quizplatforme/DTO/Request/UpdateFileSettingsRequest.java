package com.example.quizplatforme.DTO.Request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateFileSettingsRequest {

    @Size(max = 255)
    private String name;

    private String visibility;

    private String visibleFrom;

    private Boolean allowDownload;
}
