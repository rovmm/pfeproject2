package com.example.quizplatforme.Service;

import com.example.quizplatforme.DTO.Request.CreateQuestionRequest;
import com.example.quizplatforme.DTO.Request.CreateQuizRequest;
import com.example.quizplatforme.DTO.Request.SubmitQuizAnswersRequest;
import com.example.quizplatforme.DTO.Response.LeaderboardResponse;
import com.example.quizplatforme.DTO.Response.QuizAttemptResponse;
import com.example.quizplatforme.DTO.Response.QuizResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface IQuizService {

    QuizResponse createQuiz(Long sessionId, CreateQuizRequest request, String profEmail);

    QuizResponse generateQuizFromPdf(Long sessionId, MultipartFile file,
                                     int numberOfQuestions, String title,
                                     String description, String profEmail);

    /**
     * Extracts text from the PDF and asks the AI to generate questions,
     * without persisting anything — lets the professor review/edit before
     * saving via {@link #createQuiz}.
     */
    List<CreateQuestionRequest> generateQuizQuestionsPreview(Long sessionId, MultipartFile file,
                                                              int numberOfQuestions, String profEmail);

    QuizResponse getQuizForStudent(Long sessionId, String studentEmail);

    QuizResponse getQuizForProf(Long sessionId, String profEmail);

    QuizAttemptResponse submitAnswers(Long sessionId, SubmitQuizAnswersRequest request, String studentEmail);

    LeaderboardResponse getLeaderboard(Long sessionId, String callerEmail);

    List<QuizAttemptResponse> getAllAttempts(Long sessionId, String profEmail);

    void duplicateQuiz(Long originalSessionId, Long newSessionId);
}
