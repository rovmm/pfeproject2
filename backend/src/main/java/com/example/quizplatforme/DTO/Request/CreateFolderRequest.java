package com.example.quizplatforme.DTO.Request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateFolderRequest {

    @NotBlank
    @Size(max = 255)
    private String name;

    private Long parentId;

    private String visibility = "PRIVATE";

    private String visibleFrom;
}
