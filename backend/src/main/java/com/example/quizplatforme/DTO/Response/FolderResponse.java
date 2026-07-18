package com.example.quizplatforme.DTO.Response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FolderResponse {
    private Long id;
    private String name;
    private Long profId;
    private Long parentId;
    private String visibility;
    private String visibleFrom;
    private int subfolderCount;
    private int fileCount;
    private String createdAt;
    private String updatedAt;
}
