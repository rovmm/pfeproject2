package com.example.quizplatforme.DTO.Response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FileResponse {
    private Long id;
    private String originalName;
    private String fileType;
    private Long fileSize;
    private Long folderId;
    private String folderName;
    private Long profId;
    private String profName;
    private String visibility;
    private String visibleFrom;
    private boolean allowDownload;
    private String uploadedAt;
    private String downloadUrl;
}
