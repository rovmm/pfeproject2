package com.example.quizplatforme.Service;

import com.example.quizplatforme.DTO.Request.CreateSessionRequest;
import com.example.quizplatforme.DTO.Request.DuplicateSessionRequest;
import com.example.quizplatforme.DTO.Request.SubmitCodeRequest;
import com.example.quizplatforme.DTO.Response.SessionResponse;
import com.example.quizplatforme.DTO.Response.StudentSubmissionResponse;

import java.util.List;

public interface ISessionService {

    SessionResponse createSession(CreateSessionRequest request, String profEmail);

    List<SessionResponse> getMySessions(String profEmail);

    List<SessionResponse> getMyStudentSessions(String studentEmail);

    SessionResponse joinSession(String code, String studentEmail);

    SessionResponse getSessionById(Long id);

    SessionResponse closeSession(Long id, String profEmail);

    StudentSubmissionResponse submitCode(Long sessionId, SubmitCodeRequest request, String studentEmail);

    List<StudentSubmissionResponse> getSubmissions(Long sessionId, String profEmail);

    SessionResponse duplicateSession(Long sessionId, DuplicateSessionRequest request, String profEmail);
}
