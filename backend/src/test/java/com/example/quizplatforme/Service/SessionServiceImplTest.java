package com.example.quizplatforme.Service;

import com.example.quizplatforme.DTO.Request.CreateSessionRequest;
import com.example.quizplatforme.DTO.Response.SessionResponse;
import com.example.quizplatforme.Model.Entity.Session;
import com.example.quizplatforme.Model.Entity.User;
import com.example.quizplatforme.Model.Enum.PlanEnum;
import com.example.quizplatforme.Model.Enum.RoleEnum;
import com.example.quizplatforme.Model.Enum.SessionStatus;
import com.example.quizplatforme.Repository.QuizRepository;
import com.example.quizplatforme.Repository.SessionRepository;
import com.example.quizplatforme.Repository.StudentSubmissionRepository;
import com.example.quizplatforme.Repository.UserRepository;
import com.example.quizplatforme.Service.IQuizService;
import com.example.quizplatforme.Service.Impl.DockerSandboxService;
import com.example.quizplatforme.Service.Impl.SessionServiceImpl;
import com.example.quizplatforme.exception.BadRequestException;
import com.example.quizplatforme.exception.ForbiddenException;
import com.example.quizplatforme.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SessionServiceImplTest {

    @Mock SessionRepository           sessionRepository;
    @Mock UserRepository              userRepository;
    @Mock StudentSubmissionRepository submissionRepository;
    @Mock QuizRepository              quizRepository;
    @Mock DockerSandboxService        dockerSandboxService;
    @Mock IQuizService                quizService;

    @InjectMocks SessionServiceImpl sessionService;

    private User    prof;
    private User    student;
    private Session openSession;

    @BeforeEach
    void setUp() {
        prof    = user(1L, "prof@example.com",    RoleEnum.PROF);
        student = user(2L, "student@example.com", RoleEnum.STUDENT);

        openSession = Session.builder()
                .id(10L)
                .title("Java 101")
                .joinCode("ABC123")
                .prof(prof)
                .status(SessionStatus.OPEN)
                .language("python")
                .exercisePrompt("Écrivez un programme Hello World.")
                .sessionType("CODE")
                .students(new HashSet<>())
                .build();

        // toResponse() calls quizRepository.existsBySessionId — lenient: not every test reaches toResponse
        lenient().when(quizRepository.existsBySessionId(anyLong())).thenReturn(false);
    }

    // ── createSession ──────────────────────────────────────────────────────────

    @Test
    void createSession_happyPath_returnsSessionResponse() {
        when(userRepository.findByEmail("prof@example.com")).thenReturn(Optional.of(prof));
        when(sessionRepository.findByJoinCode(anyString())).thenReturn(Optional.empty());
        when(sessionRepository.save(any())).thenReturn(openSession);

        SessionResponse res = sessionService.createSession(
                createRequest("Java 101", "python", "Écrivez un programme Hello World.", null),
                "prof@example.com"
        );

        assertThat(res.getTitle()).isEqualTo("Java 101");
        assertThat(res.getJoinCode()).isEqualTo("ABC123");
        assertThat(res.getStatus()).isEqualTo(SessionStatus.OPEN);
        verify(sessionRepository).save(any());
    }

    @Test
    void createSession_unknownProf_throwsResourceNotFoundException() {
        when(userRepository.findByEmail("ghost@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> sessionService.createSession(
                createRequest("Title", "python", "Some prompt", null),
                "ghost@example.com"
        )).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void createSession_invalidLanguage_throwsBadRequestException() {
        assertThatThrownBy(() -> sessionService.createSession(
                createRequest("Title", "cobol", "Some prompt", null),
                "prof@example.com"
        )).isInstanceOf(BadRequestException.class)
          .hasMessageContaining("supporté");
    }

    // ── getMySessions ──────────────────────────────────────────────────────────

    @Test
    void getMySessions_returnsProfSessions() {
        when(userRepository.findByEmail("prof@example.com")).thenReturn(Optional.of(prof));
        when(sessionRepository.findByProfId(1L)).thenReturn(List.of(openSession));

        List<SessionResponse> list = sessionService.getMySessions("prof@example.com");

        assertThat(list).hasSize(1);
        assertThat(list.get(0).getJoinCode()).isEqualTo("ABC123");
    }

    @Test
    void getMySessions_returnsEmptyListWhenNone() {
        when(userRepository.findByEmail("prof@example.com")).thenReturn(Optional.of(prof));
        when(sessionRepository.findByProfId(1L)).thenReturn(List.of());

        assertThat(sessionService.getMySessions("prof@example.com")).isEmpty();
    }

    // ── joinSession ────────────────────────────────────────────────────────────

    @Test
    void joinSession_happyPath_addsStudentAndReturnsResponse() {
        when(sessionRepository.findByJoinCode("ABC123")).thenReturn(Optional.of(openSession));
        when(userRepository.findByEmail("student@example.com")).thenReturn(Optional.of(student));
        when(sessionRepository.save(any())).thenReturn(openSession);

        SessionResponse res = sessionService.joinSession("ABC123", "student@example.com");

        assertThat(res.getJoinCode()).isEqualTo("ABC123");
        assertThat(openSession.getStudents()).contains(student);
    }

    @Test
    void joinSession_invalidCode_throwsResourceNotFoundException() {
        when(sessionRepository.findByJoinCode("WRONG1")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> sessionService.joinSession("WRONG1", "student@example.com"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void joinSession_closedSession_throwsBadRequestException() {
        openSession.setStatus(SessionStatus.CLOSED);
        when(sessionRepository.findByJoinCode("ABC123")).thenReturn(Optional.of(openSession));

        assertThatThrownBy(() -> sessionService.joinSession("ABC123", "student@example.com"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("fermée");
    }

    @Test
    void joinSession_alreadyJoined_throwsBadRequestException() {
        openSession.getStudents().add(student);
        when(sessionRepository.findByJoinCode("ABC123")).thenReturn(Optional.of(openSession));
        when(userRepository.findByEmail("student@example.com")).thenReturn(Optional.of(student));

        assertThatThrownBy(() -> sessionService.joinSession("ABC123", "student@example.com"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("déjà rejoint");
    }

    // ── getSessionById ─────────────────────────────────────────────────────────

    @Test
    void getSessionById_found_returnsResponse() {
        when(sessionRepository.findById(10L)).thenReturn(Optional.of(openSession));

        SessionResponse res = sessionService.getSessionById(10L);

        assertThat(res.getId()).isEqualTo(10L);
    }

    @Test
    void getSessionById_notFound_throwsResourceNotFoundException() {
        when(sessionRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> sessionService.getSessionById(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ── closeSession ───────────────────────────────────────────────────────────

    @Test
    void closeSession_happyPath_setsStatusClosed() {
        when(sessionRepository.findById(10L)).thenReturn(Optional.of(openSession));
        when(userRepository.findByEmail("prof@example.com")).thenReturn(Optional.of(prof));
        Session closed = Session.builder()
                .id(10L).title("Java 101").joinCode("ABC123")
                .prof(prof).status(SessionStatus.CLOSED).students(new HashSet<>())
                .language("python").exercisePrompt("Prompt.").build();
        when(sessionRepository.save(any())).thenReturn(closed);

        SessionResponse res = sessionService.closeSession(10L, "prof@example.com");

        assertThat(res.getStatus()).isEqualTo(SessionStatus.CLOSED);
    }

    @Test
    void closeSession_wrongProf_throwsForbiddenException() {
        User otherProf = user(99L, "other@example.com", RoleEnum.PROF);
        when(sessionRepository.findById(10L)).thenReturn(Optional.of(openSession));
        when(userRepository.findByEmail("other@example.com")).thenReturn(Optional.of(otherProf));

        assertThatThrownBy(() -> sessionService.closeSession(10L, "other@example.com"))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void closeSession_alreadyClosed_throwsBadRequestException() {
        openSession.setStatus(SessionStatus.CLOSED);
        when(sessionRepository.findById(10L)).thenReturn(Optional.of(openSession));
        when(userRepository.findByEmail("prof@example.com")).thenReturn(Optional.of(prof));

        assertThatThrownBy(() -> sessionService.closeSession(10L, "prof@example.com"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("déjà fermée");
    }

    // ── helpers ────────────────────────────────────────────────────────────────

    private static CreateSessionRequest createRequest(
            String title, String language, String exercisePrompt, String filiere) {
        CreateSessionRequest req = new CreateSessionRequest();
        req.setTitle(title);
        req.setSessionType("CODE");
        req.setLanguage(language);
        req.setExercisePrompt(exercisePrompt);
        req.setFiliere(filiere);
        return req;
    }

    private static User user(Long id, String email, RoleEnum role) {
        return User.builder()
                .id(id).fullName("Name").email(email)
                .password("h").role(role).plan(PlanEnum.FREE)
                .build();
    }
}
