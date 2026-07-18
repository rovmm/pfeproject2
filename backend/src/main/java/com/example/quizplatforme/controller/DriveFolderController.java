package com.example.quizplatforme.controller;

import com.example.quizplatforme.DTO.Request.CreateFolderRequest;
import com.example.quizplatforme.DTO.Request.RenameFolderRequest;
import com.example.quizplatforme.DTO.Response.FolderContentsResponse;
import com.example.quizplatforme.DTO.Response.FolderResponse;
import com.example.quizplatforme.Service.IDriveService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/drive/folders")
@RequiredArgsConstructor
public class DriveFolderController {

    private final IDriveService driveService;

    @PostMapping
    public ResponseEntity<FolderResponse> createFolder(
            @Valid @RequestBody CreateFolderRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(driveService.createFolder(request, userDetails.getUsername()));
    }

    @GetMapping("/my")
    public ResponseEntity<List<FolderResponse>> getMyRootFolders(
            @AuthenticationPrincipal UserDetails userDetails) {

        return ResponseEntity.ok(driveService.getMyRootFolders(userDetails.getUsername()));
    }

    @GetMapping("/{id}/contents")
    public ResponseEntity<FolderContentsResponse> getFolderContents(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        return ResponseEntity.ok(driveService.getFolderContents(id, userDetails.getUsername()));
    }

    @PutMapping("/{id}/rename")
    public ResponseEntity<FolderResponse> renameFolder(
            @PathVariable Long id,
            @Valid @RequestBody RenameFolderRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        return ResponseEntity.ok(
                driveService.renameFolder(id, request.getName(), userDetails.getUsername()));
    }

    @PutMapping("/{id}/visibility")
    public ResponseEntity<FolderResponse> updateFolderVisibility(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {

        return ResponseEntity.ok(
                driveService.updateFolderVisibility(
                        id, body.get("visibility"), body.get("visibleFrom"), userDetails.getUsername()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFolder(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        driveService.deleteFolder(id, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }
}
