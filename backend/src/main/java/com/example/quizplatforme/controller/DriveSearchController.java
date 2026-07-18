package com.example.quizplatforme.controller;

import com.example.quizplatforme.DTO.Response.FileResponse;
import com.example.quizplatforme.DTO.Response.FolderResponse;
import com.example.quizplatforme.Service.IDriveService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/drive")
@RequiredArgsConstructor
public class DriveSearchController {

    private final IDriveService driveService;

    @GetMapping("/search")
    public ResponseEntity<List<FileResponse>> searchFiles(
            @RequestParam("q") String query,
            @AuthenticationPrincipal UserDetails userDetails) {

        return ResponseEntity.ok(driveService.searchFiles(query, userDetails.getUsername()));
    }

    @GetMapping("/student/view/{profId}")
    public ResponseEntity<List<FolderResponse>> getStudentView(
            @PathVariable Long profId,
            @AuthenticationPrincipal UserDetails userDetails) {

        return ResponseEntity.ok(driveService.getStudentView(profId, userDetails.getUsername()));
    }
}
