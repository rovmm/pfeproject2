package com.example.quizplatforme.DTO.Response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FolderContentsResponse {
    private FolderResponse folder;
    private List<FolderResponse> subfolders;
    private List<FileResponse> files;
    private List<FolderResponse> breadcrumb;
}
