package com.example.quizplatforme.Service.Impl;

import com.example.quizplatforme.DTO.Request.CreateSessionRequest;
import com.example.quizplatforme.DTO.Request.DuplicateSessionRequest;
import com.example.quizplatforme.DTO.Request.SubmitCodeRequest;
import com.example.quizplatforme.DTO.Response.CodeResponse;
import com.example.quizplatforme.DTO.Response.ParticipantPresenceResponse;
import com.example.quizplatforme.DTO.Response.SessionResponse;
import com.example.quizplatforme.DTO.Response.StudentSubmissionResponse;
import com.example.quizplatforme.Model.Entity.Quiz;
import com.example.quizplatforme.Model.Entity.QuizAttempt;
import com.example.quizplatforme.Model.Entity.Session;
import com.example.quizplatforme.Model.Entity.SessionPresence;
import com.example.quizplatforme.Model.Entity.StudentSubmission;
import com.example.quizplatforme.Model.Entity.User;
import com.example.quizplatforme.Model.Enum.SessionStatus;
import com.example.quizplatforme.Model.Enum.SubmissionStatus;
import com.example.quizplatforme.Repository.CodingHistoryRepository;
import com.example.quizplatforme.Repository.QuizAttemptRepository;
import com.example.quizplatforme.Repository.QuizRepository;
import com.example.quizplatforme.Repository.SessionPresenceRepository;
import com.example.quizplatforme.Repository.SessionRepository;
import com.example.quizplatforme.Repository.StudentSubmissionRepository;
import com.example.quizplatforme.Repository.UserRepository;
import com.example.quizplatforme.Service.IQuizService;
import com.example.quizplatforme.Service.ISessionService;
import com.example.quizplatforme.exception.BadRequestException;
import com.example.quizplatforme.exception.ForbiddenException;
import com.example.quizplatforme.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SessionServiceImpl implements ISessionService {

    private static final Set<String>  VALID_LANGUAGES  = Set.of(
            "python", "javascript", "typescript", "java", "cpp", "php");
    private static final Set<String>  VALID_TYPES      = Set.of("CODE", "QUIZ");

    private static final String       ALPHABET    = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final int          CODE_LENGTH = 6;
    private static final SecureRandom RANDOM      = new SecureRandom();

    /** Étudiant considéré "en ligne" si son dernier heartbeat date de moins de 15s
     *  (le client envoie un heartbeat toutes les 5s — voir CodeSession.tsx). */
    private static final long PRESENCE_ONLINE_THRESHOLD_SECONDS = 15;

    private final SessionRepository           sessionRepository;
    private final UserRepository              userRepository;
    private final StudentSubmissionRepository submissionRepository;
    private final QuizRepository              quizRepository;
    private final QuizAttemptRepository       quizAttemptRepository;
    private final CodingHistoryRepository     codingHistoryRepository;
    private final SessionPresenceRepository   sessionPresenceRepository;
    private final DockerSandboxService        dockerSandboxService;
    private final IQuizService                quizService;

    // ── Création d'une session ─────────────────────────────────────────────────

    @Override
    @Transactional
    public SessionResponse createSession(CreateSessionRequest request, String profEmail) {
        String type = request.getSessionType() == null ? "CODE"
                : request.getSessionType().toUpperCase().trim();

        if (!VALID_TYPES.contains(type)) {
            throw new BadRequestException("Type de session invalide. Les valeurs acceptées sont CODE ou QUIZ.");
        }

        String lang          = null;
        String exercisePrompt = "";

        if ("CODE".equals(type)) {
            if (request.getLanguage() == null || request.getLanguage().isBlank()) {
                throw new BadRequestException("Le langage de la session est obligatoire.");
            }
            lang = request.getLanguage().toLowerCase().trim();
            if (!VALID_LANGUAGES.contains(lang)) {
                throw new BadRequestException("Le langage sélectionné n'est pas supporté.");
            }
            if (request.getExercisePrompt() == null || request.getExercisePrompt().isBlank()) {
                throw new BadRequestException("Le prompt de l'exercice ne peut pas être vide.");
            }
            exercisePrompt = request.getExercisePrompt();
        }

        User prof = getUserByEmail(profEmail);

        Session session = Session.builder()
                .title(request.getTitle())
                .joinCode(generateUniqueJoinCode())
                .prof(prof)
                .status(SessionStatus.OPEN)
                .language(lang != null ? lang : "python")
                .exercisePrompt(exercisePrompt)
                .filiere(request.getFiliere())
                .sessionType(type)
                .allowAI(request.isAllowAI())
                .disableCopyPaste(request.isDisableCopyPaste())
                .warnOnTabSwitch(request.isWarnOnTabSwitch())
                .autoSave(request.isAutoSave())
                .timeLimitMinutes(request.getTimeLimitMinutes())
                .recordCodingHistory(request.isRecordCodingHistory())
                .build();

        return toResponse(sessionRepository.save(session));
    }

    // ── Sessions du prof connecté ──────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public List<SessionResponse> getMySessions(String profEmail) {
        User prof = getUserByEmail(profEmail);
        return sessionRepository.findByProfId(prof.getId())
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<SessionResponse> getMyStudentSessions(String studentEmail) {
        User student = getUserByEmail(studentEmail);
        return sessionRepository.findByStudentsId(student.getId())
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ── Rejoindre une session ──────────────────────────────────────────────────

    @Override
    @Transactional
    public SessionResponse joinSession(String code, String studentEmail) {
        Session session = sessionRepository.findByJoinCode(code)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Aucune session trouvée avec le code d'accès : " + code));

        if (session.getStatus() == SessionStatus.CLOSED) {
            throw new BadRequestException(
                    "Cette session est fermée et n'accepte plus de participants.");
        }

        User student = getUserByEmail(studentEmail);

        boolean alreadyJoined = session.getStudents()
                .stream()
                .anyMatch(s -> s.getId().equals(student.getId()));

        if (alreadyJoined) {
            // L'étudiant est déjà inscrit : retourner la session directement pour permettre la navigation
            return toResponse(session);
        }

        session.getStudents().add(student);
        return toResponse(sessionRepository.save(session));
    }

    // ── Détails d'une session ──────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public SessionResponse getSessionById(Long id) {
        return toResponse(getSessionOrThrow(id));
    }

    // ── Fermeture d'une session ────────────────────────────────────────────────

    @Override
    @Transactional
    public SessionResponse closeSession(Long id, String profEmail) {
        Session session = getSessionOrThrow(id);
        User    prof    = getUserByEmail(profEmail);

        if (!session.getProf().getId().equals(prof.getId())) {
            throw new ForbiddenException("Vous n'êtes pas autorisé à fermer cette session.");
        }
        if (session.getStatus() == SessionStatus.CLOSED) {
            throw new BadRequestException("Cette session est déjà fermée.");
        }

        session.setStatus(SessionStatus.CLOSED);
        return toResponse(sessionRepository.save(session));
    }

    // ── Soumission de code ─────────────────────────────────────────────────────

    @Override
    @Transactional
    public StudentSubmissionResponse submitCode(Long sessionId, SubmitCodeRequest request, String studentEmail) {
        Session session = getSessionOrThrow(sessionId);

        if (session.getStatus() == SessionStatus.CLOSED) {
            throw new BadRequestException(
                    "La session est fermée. Vous ne pouvez plus soumettre de code.");
        }

        User student = getUserByEmail(studentEmail);

        String execLanguage = (request.getLanguage() != null && !request.getLanguage().isBlank())
                ? request.getLanguage().toLowerCase().trim()
                : session.getLanguage();

        CodeResponse result = dockerSandboxService.execute(
                execLanguage, request.getCode(), request.getStdin(), 0);

        SubmissionStatus submissionStatus = switch (result.getStatus()) {
            case "SUCCESS" -> SubmissionStatus.SUCCESS;
            case "TIMEOUT" -> SubmissionStatus.TIMEOUT;
            default        -> SubmissionStatus.ERROR;
        };

        StudentSubmission submission = submissionRepository
                .findBySessionIdAndStudentId(sessionId, student.getId())
                .orElseGet(() -> StudentSubmission.builder()
                        .session(session)
                        .student(student)
                        .build());

        submission.setCode(request.getCode());
        submission.setStdout(result.getOutput());
        submission.setStderr(result.getError());
        submission.setExitCode(result.getExitCode());
        submission.setExecutionTimeMs(result.getExecutionTimeMs() != null ? result.getExecutionTimeMs() : 0L);
        submission.setStatus(submissionStatus);
        submission.setSubmittedAt(LocalDateTime.now());

        return toSubmissionResponse(submissionRepository.save(submission));
    }

    // ── Liste des soumissions ──────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public List<StudentSubmissionResponse> getSubmissions(Long sessionId, String profEmail) {
        Session session = getSessionOrThrow(sessionId);
        User    prof    = getUserByEmail(profEmail);

        if (!session.getProf().getId().equals(prof.getId())) {
            throw new ForbiddenException(
                    "Accès refusé. Vous n'êtes pas le propriétaire de cette session.");
        }

        return submissionRepository.findBySessionIdOrderBySubmittedAtDesc(sessionId)
                .stream()
                .map(this::toSubmissionResponse)
                .collect(Collectors.toList());
    }

    // ── Duplication ────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public SessionResponse duplicateSession(Long sessionId, DuplicateSessionRequest request, String profEmail) {
        Session original = getSessionOrThrow(sessionId);
        User    prof     = getUserByEmail(profEmail);

        if (!original.getProf().getId().equals(prof.getId())) {
            throw new ForbiddenException(
                    "Accès refusé. Vous n'êtes pas le propriétaire de cette session.");
        }

        String newTitle = (request.getTitle() != null && !request.getTitle().isBlank())
                ? request.getTitle()
                : original.getTitle() + " (copie)";

        String newFiliere = (request.getFiliere() != null && !request.getFiliere().isBlank())
                ? request.getFiliere()
                : original.getFiliere();

        Session duplicate = Session.builder()
                .title(newTitle)
                .joinCode(generateUniqueJoinCode())
                .prof(prof)
                .status(SessionStatus.OPEN)
                .language(original.getLanguage())
                .exercisePrompt(original.getExercisePrompt())
                .filiere(newFiliere)
                .sessionType(original.getSessionType())
                .allowAI(original.isAllowAI())
                .disableCopyPaste(original.isDisableCopyPaste())
                .warnOnTabSwitch(original.isWarnOnTabSwitch())
                .autoSave(original.isAutoSave())
                .timeLimitMinutes(original.getTimeLimitMinutes())
                .recordCodingHistory(original.isRecordCodingHistory())
                .build();

        Session saved = sessionRepository.save(duplicate);

        // If the original is a QUIZ session and has a quiz, duplicate it
        if ("QUIZ".equalsIgnoreCase(original.getSessionType())
                && quizRepository.existsBySessionId(sessionId)) {
            quizService.duplicateQuiz(sessionId, saved.getId());
        }

        return toResponse(saved);
    }

    // ── Présence (heartbeat) ────────────────────────────────────────────────────

    @Override
    @Transactional
    public void heartbeat(Long sessionId, String studentEmail) {
        Session session = getSessionOrThrow(sessionId);
        User    student = getUserByEmail(studentEmail);

        LocalDateTime now = LocalDateTime.now();
        SessionPresence presence = sessionPresenceRepository
                .findBySessionIdAndStudentId(sessionId, student.getId())
                .orElseGet(() -> SessionPresence.builder()
                        .session(session)
                        .student(student)
                        .joinedAt(now)
                        .build());

        presence.setLastSeenAt(now);
        sessionPresenceRepository.save(presence);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ParticipantPresenceResponse> getPresence(Long sessionId, String profEmail) {
        Session session = getSessionOrThrow(sessionId);
        User    prof     = getUserByEmail(profEmail);

        if (!session.getProf().getId().equals(prof.getId())) {
            throw new ForbiddenException(
                    "Accès refusé. Vous n'êtes pas le propriétaire de cette session.");
        }

        Map<Long, SessionPresence> presenceByStudentId = sessionPresenceRepository
                .findBySessionId(sessionId)
                .stream()
                .collect(Collectors.toMap(p -> p.getStudent().getId(), p -> p));

        LocalDateTime now = LocalDateTime.now();

        return session.getStudents()
                .stream()
                .map(s -> {
                    SessionPresence presence = presenceByStudentId.get(s.getId());
                    LocalDateTime lastSeenAt = presence != null ? presence.getLastSeenAt() : null;
                    boolean online = lastSeenAt != null
                            && Duration.between(lastSeenAt, now).getSeconds() <= PRESENCE_ONLINE_THRESHOLD_SECONDS;

                    return ParticipantPresenceResponse.builder()
                            .studentId(s.getId())
                            .studentName(s.getFullName())
                            .studentEmail(s.getEmail())
                            .lastSeenAt(lastSeenAt)
                            .online(online)
                            .build();
                })
                .sorted(Comparator.comparing(ParticipantPresenceResponse::getStudentName))
                .collect(Collectors.toList());
    }

    // ── Suppression ────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public void deleteSession(Long id, String profEmail) {
        Session session = getSessionOrThrow(id);
        User    prof    = getUserByEmail(profEmail);

        if (!session.getProf().getId().equals(prof.getId())) {
            throw new ForbiddenException(
                    "Accès refusé. Vous n'êtes pas le propriétaire de cette session.");
        }

        quizRepository.findBySessionId(id).ifPresent(quiz -> {
            List<QuizAttempt> attempts = quizAttemptRepository.findByQuizIdOrderByPercentageDesc(quiz.getId());
            quizAttemptRepository.deleteAll(attempts);
            quizRepository.delete(quiz);
        });

        codingHistoryRepository.deleteAll(codingHistoryRepository.findBySessionId(id));
        sessionPresenceRepository.deleteAll(sessionPresenceRepository.findBySessionId(id));
        submissionRepository.deleteAll(
                submissionRepository.findBySessionIdOrderBySubmittedAtDesc(id));

        session.getStudents().clear();
        sessionRepository.save(session);

        sessionRepository.delete(session);
    }

    // ── Helpers privés ─────────────────────────────────────────────────────────

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", "email", email));
    }

    private Session getSessionOrThrow(Long id) {
        return sessionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Session", "id", id));
    }

    private String generateUniqueJoinCode() {
        String code;
        do { code = generateCode(); }
        while (sessionRepository.findByJoinCode(code).isPresent());
        return code;
    }

    private String generateCode() {
        StringBuilder sb = new StringBuilder(CODE_LENGTH);
        for (int i = 0; i < CODE_LENGTH; i++) {
            sb.append(ALPHABET.charAt(RANDOM.nextInt(ALPHABET.length())));
        }
        return sb.toString();
    }

    private SessionResponse toResponse(Session session) {
        return SessionResponse.builder()
                .id(session.getId())
                .title(session.getTitle())
                .joinCode(session.getJoinCode())
                .status(session.getStatus())
                .profName(session.getProf().getFullName())
                .studentCount(session.getStudents().size())
                .language(session.getLanguage())
                .exercisePrompt(session.getExercisePrompt())
                .filiere(session.getFiliere())
                .sessionType(session.getSessionType())
                .hasQuiz(session.getId() != null && quizRepository.existsBySessionId(session.getId()))
                .allowAI(session.isAllowAI())
                .disableCopyPaste(session.isDisableCopyPaste())
                .warnOnTabSwitch(session.isWarnOnTabSwitch())
                .autoSave(session.isAutoSave())
                .timeLimitMinutes(session.getTimeLimitMinutes())
                .recordCodingHistory(session.isRecordCodingHistory())
                .createdAt(session.getCreatedAt())
                .build();
    }

    private StudentSubmissionResponse toSubmissionResponse(StudentSubmission sub) {
        return StudentSubmissionResponse.builder()
                .id(sub.getId())
                .studentId(sub.getStudent().getId())
                .studentName(sub.getStudent().getFullName())
                .studentEmail(sub.getStudent().getEmail())
                .code(sub.getCode())
                .stdout(sub.getStdout())
                .stderr(sub.getStderr())
                .exitCode(sub.getExitCode())
                .executionTimeMs(sub.getExecutionTimeMs())
                .status(sub.getStatus())
                .submittedAt(sub.getSubmittedAt())
                .build();
    }
}
