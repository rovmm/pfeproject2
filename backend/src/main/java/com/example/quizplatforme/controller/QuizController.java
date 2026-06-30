package com.example.quizplatforme.controller;

import com.example.quizplatforme.DTO.Request.CreateQuizRequest;
import com.example.quizplatforme.DTO.Request.SubmitQuizAnswersRequest;
import com.example.quizplatforme.DTO.Response.LeaderboardResponse;
import com.example.quizplatforme.DTO.Response.QuizAttemptResponse;
import com.example.quizplatforme.DTO.Response.QuizResponse;
import com.example.quizplatforme.Service.IQuizService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/sessions/{sessionId}/quiz")
@RequiredArgsConstructor
public class QuizController {

    private final IQuizService quizService;

    /**
     * POST /api/sessions/{sessionId}/quiz/create — PROF only
     */
    @PostMapping("/create")
    public ResponseEntity<QuizResponse> createQuiz(
            @PathVariable Long sessionId,
            @Valid @RequestBody CreateQuizRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(quizService.createQuiz(sessionId, request, userDetails.getUsername()));
    }

    /**
     * POST /api/sessions/{sessionId}/quiz/generate-from-pdf — PROF only
     * Multipart: file (PDF) + params numberOfQuestions, title, description
     */
    @PostMapping(value = "/generate-from-pdf", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<QuizResponse> generateFromPdf(
            @PathVariable Long sessionId,
            @RequestPart("file") MultipartFile file,
            @RequestParam(defaultValue = "5")  int    numberOfQuestions,
            @RequestParam                      String title,
            @RequestParam(required = false)    String description,
            @AuthenticationPrincipal UserDetails userDetails) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(quizService.generateQuizFromPdf(
                        sessionId, file, numberOfQuestions, title, description,
                        userDetails.getUsername()));
    }

    /**
     * GET /api/sessions/{sessionId}/quiz — authenticated
     * PROF gets questions with correct answers; STUDENT gets questions without.
     */
    @GetMapping
    public ResponseEntity<QuizResponse> getQuiz(
            @PathVariable Long sessionId,
            @AuthenticationPrincipal UserDetails userDetails,
            Authentication authentication) {

        boolean isProf = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_PROF"));

        QuizResponse quiz = isProf
                ? quizService.getQuizForProf(sessionId, userDetails.getUsername())
                : quizService.getQuizForStudent(sessionId, userDetails.getUsername());

        return ResponseEntity.ok(quiz);
    }

    /**
     * POST /api/sessions/{sessionId}/quiz/submit — STUDENT only
     */
    @PostMapping("/submit")
    public ResponseEntity<QuizAttemptResponse> submitAnswers(
            @PathVariable Long sessionId,
            @Valid @RequestBody SubmitQuizAnswersRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        return ResponseEntity.ok(
                quizService.submitAnswers(sessionId, request, userDetails.getUsername()));
    }

    /**
     * GET /api/sessions/{sessionId}/quiz/leaderboard — authenticated
     */
    @GetMapping("/leaderboard")
    public ResponseEntity<LeaderboardResponse> getLeaderboard(
            @PathVariable Long sessionId,
            @AuthenticationPrincipal UserDetails userDetails) {

        return ResponseEntity.ok(
                quizService.getLeaderboard(sessionId, userDetails.getUsername()));
    }

    /**
     * GET /api/sessions/{sessionId}/quiz/attempts — PROF only
     */
    @GetMapping("/attempts")
    public ResponseEntity<List<QuizAttemptResponse>> getAllAttempts(
            @PathVariable Long sessionId,
            @AuthenticationPrincipal UserDetails userDetails) {

        return ResponseEntity.ok(
                quizService.getAllAttempts(sessionId, userDetails.getUsername()));
    }
}
