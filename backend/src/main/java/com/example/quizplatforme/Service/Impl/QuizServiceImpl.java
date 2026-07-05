package com.example.quizplatforme.Service.Impl;

import com.example.quizplatforme.DTO.Request.CreateQuestionRequest;
import com.example.quizplatforme.DTO.Request.CreateQuizRequest;
import com.example.quizplatforme.DTO.Request.StudentAnswerRequest;
import com.example.quizplatforme.DTO.Request.SubmitQuizAnswersRequest;
import com.example.quizplatforme.DTO.Response.*;
import com.example.quizplatforme.Model.Entity.*;
import com.example.quizplatforme.Model.Enum.RoleEnum;
import com.example.quizplatforme.Repository.*;
import com.example.quizplatforme.Service.IQuizService;
import com.example.quizplatforme.exception.BadRequestException;
import com.example.quizplatforme.exception.ForbiddenException;
import com.example.quizplatforme.exception.ResourceNotFoundException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
public class QuizServiceImpl implements IQuizService {

    private static final Set<String> VALID_OPTIONS  = Set.of("A", "B", "C", "D");
    private static final int         MAX_QUESTIONS  = 20;
    private static final int         MAX_PDF_CHARS  = 12_000;
    private static final String      QUIZ_TYPE      = "QUIZ";

    private final SessionRepository      sessionRepository;
    private final UserRepository         userRepository;
    private final QuizRepository         quizRepository;
    private final QuestionRepository     questionRepository;
    private final QuizAttemptRepository  attemptRepository;
    private final StudentAnswerRepository answerRepository;

    private final WebClient webClient;

    @Value("${grok.api.key}")
    private String apiKey;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public QuizServiceImpl(
            SessionRepository sessionRepository,
            UserRepository userRepository,
            QuizRepository quizRepository,
            QuestionRepository questionRepository,
            QuizAttemptRepository attemptRepository,
            StudentAnswerRepository answerRepository,
            @Value("${grok.api.url}") String apiUrl) {

        this.sessionRepository  = sessionRepository;
        this.userRepository     = userRepository;
        this.quizRepository     = quizRepository;
        this.questionRepository = questionRepository;
        this.attemptRepository  = attemptRepository;
        this.answerRepository   = answerRepository;

        this.webClient = WebClient.builder()
                .baseUrl(apiUrl)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    // ── createQuiz ─────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public QuizResponse createQuiz(Long sessionId, CreateQuizRequest req, String profEmail) {
        Session session = getSessionOrThrow(sessionId);
        verifyProfOwnership(session, profEmail);
        verifyQuizType(session);
        verifyNoExistingQuiz(sessionId);
        validateAllOptions(req.getQuestions());

        Quiz quiz = buildAndSaveQuiz(session, req.getTitle(), req.getDescription(),
                req.getTimeLimitMinutes(), req.getQuestions());

        return toProfResponse(quiz);
    }

    // ── generateQuizFromPdf ────────────────────────────────────────────────────

    @Override
    @Transactional
    public QuizResponse generateQuizFromPdf(Long sessionId, MultipartFile file,
                                             int numberOfQuestions, String title,
                                             String description, String profEmail) {
        Session session = getSessionOrThrow(sessionId);
        verifyProfOwnership(session, profEmail);
        verifyQuizType(session);
        verifyNoExistingQuiz(sessionId);

        if (numberOfQuestions < 1 || numberOfQuestions > MAX_QUESTIONS) {
            throw new BadRequestException(
                    "Nombre de questions invalide. Maximum autorisé : " + MAX_QUESTIONS + ".");
        }

        String pdfText = extractPdfText(file);
        if (pdfText.isBlank()) {
            throw new BadRequestException(
                    "Impossible d'extraire le texte du PDF. "
                    + "Le fichier est peut-être scanné ou protégé.");
        }

        String truncated = pdfText.length() > MAX_PDF_CHARS
                ? pdfText.substring(0, MAX_PDF_CHARS)
                : pdfText;

        List<CreateQuestionRequest> generatedQuestions = callAiForQuiz(truncated, numberOfQuestions);

        Quiz quiz = buildAndSaveQuiz(session, title, description, 0, generatedQuestions);
        return toProfResponse(quiz);
    }

    // ── getQuizForStudent ──────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public QuizResponse getQuizForStudent(Long sessionId, String studentEmail) {
        User user = getUserByEmail(studentEmail);
        Quiz quiz = getQuizOrThrow(sessionId);

        Session session = quiz.getSession();

        if (user.getRole() == RoleEnum.STUDENT) {
            verifyStudentEnrolled(session, user);
        }

        if (session.getStatus().name().equals("CLOSED")) {
            throw new BadRequestException("Cette session est fermée.");
        }

        List<QuestionResponse> questions = questionRepository
                .findByQuizIdOrderByPosition(quiz.getId())
                .stream()
                .map(this::toStudentQuestion)
                .collect(Collectors.toList());

        return QuizResponse.builder()
                .id(quiz.getId())
                .title(quiz.getTitle())
                .description(quiz.getDescription())
                .timeLimitMinutes(quiz.getTimeLimitMinutes())
                .sessionId(sessionId)
                .questions(questions)
                .build();
    }

    // ── getQuizForProf ─────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public QuizResponse getQuizForProf(Long sessionId, String profEmail) {
        Session session = getSessionOrThrow(sessionId);
        verifyProfOwnership(session, profEmail);
        Quiz quiz = getQuizOrThrow(sessionId);
        return toProfResponse(quiz);
    }

    // ── submitAnswers ──────────────────────────────────────────────────────────

    @Override
    @Transactional
    public QuizAttemptResponse submitAnswers(Long sessionId, SubmitQuizAnswersRequest req, String studentEmail) {
        Session session = getSessionOrThrow(sessionId);

        if (session.getStatus().name().equals("CLOSED")) {
            throw new BadRequestException(
                    "La session est fermée. Vous ne pouvez plus soumettre vos réponses.");
        }

        User   student = getUserByEmail(studentEmail);
        Quiz   quiz    = getQuizOrThrow(sessionId);

        if (student.getRole() == RoleEnum.STUDENT) {
            verifyStudentEnrolled(session, student);
        }

        // Validate all options
        for (StudentAnswerRequest a : req.getAnswers()) {
            String opt = a.getSelectedOption() == null ? "" : a.getSelectedOption().toUpperCase();
            if (!VALID_OPTIONS.contains(opt)) {
                throw new BadRequestException(
                        "Réponse invalide. L'option doit être A, B, C ou D.");
            }
        }

        // Load all questions for this quiz indexed by id
        List<Question> questions = questionRepository.findByQuizIdOrderByPosition(quiz.getId());
        Map<Long, Question> questionMap = questions.stream()
                .collect(Collectors.toMap(Question::getId, q -> q));

        // Score
        int correct = 0;
        List<StudentAnswer> studentAnswers = new ArrayList<>();

        for (StudentAnswerRequest ar : req.getAnswers()) {
            Question q = questionMap.get(ar.getQuestionId());
            if (q == null) continue; // skip unknown question ids

            String selected = ar.getSelectedOption().toUpperCase();
            boolean isCorrect = selected.equals(q.getCorrectOption().toUpperCase());
            if (isCorrect) correct++;

            studentAnswers.add(StudentAnswer.builder()
                    .question(q)
                    .selectedOption(selected)
                    .isCorrect(isCorrect)
                    .build());
        }

        int total = questions.size();
        BigDecimal pct = total > 0
                ? BigDecimal.valueOf(correct * 100.0 / total).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // Upsert attempt
        QuizAttempt attempt = attemptRepository
                .findByQuizIdAndStudentId(quiz.getId(), student.getId())
                .orElseGet(() -> QuizAttempt.builder()
                        .quiz(quiz)
                        .student(student)
                        .build());

        // Clear old answers on re-submission
        attempt.getAnswers().clear();
        attempt.setScore(correct);
        attempt.setTotalQuestions(total);
        attempt.setPercentage(pct);
        attempt.setCompletedAt(LocalDateTime.now());

        QuizAttempt saved = attemptRepository.save(attempt);

        // Set back-reference and save answers
        for (StudentAnswer sa : studentAnswers) {
            sa.setAttempt(saved);
        }
        saved.getAnswers().addAll(studentAnswers);
        QuizAttempt finalAttempt = attemptRepository.save(saved);

        return toAttemptResponse(finalAttempt, questions);
    }

    // ── getLeaderboard ─────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public LeaderboardResponse getLeaderboard(Long sessionId, String callerEmail) {
        User caller = getUserByEmail(callerEmail);
        Quiz quiz = getQuizOrThrow(sessionId);

        if (caller.getRole() == RoleEnum.STUDENT) {
            verifyStudentEnrolled(quiz.getSession(), caller);
        }

        List<QuizAttempt> attempts =
                attemptRepository.findByQuizIdOrderByPercentageDesc(quiz.getId());

        List<LeaderboardEntry> entries = new ArrayList<>();
        for (int i = 0; i < attempts.size(); i++) {
            QuizAttempt a = attempts.get(i);
            entries.add(LeaderboardEntry.builder()
                    .rank(i + 1)
                    .studentName(a.getStudent().getFullName())
                    .studentEmail(a.getStudent().getEmail())
                    .score(a.getScore())
                    .totalQuestions(a.getTotalQuestions())
                    .percentage(a.getPercentage())
                    .completedAt(a.getCompletedAt())
                    .build());
        }

        Session session = quiz.getSession();
        int totalStudents = session.getStudents().size();

        return LeaderboardResponse.builder()
                .entries(entries)
                .totalStudents(totalStudents)
                .completedCount(attempts.size())
                .build();
    }

    // ── getAllAttempts ─────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public List<QuizAttemptResponse> getAllAttempts(Long sessionId, String profEmail) {
        Session session = getSessionOrThrow(sessionId);
        verifyProfOwnership(session, profEmail);
        Quiz quiz = getQuizOrThrow(sessionId);

        List<Question> questions = questionRepository.findByQuizIdOrderByPosition(quiz.getId());

        return attemptRepository.findByQuizIdOrderByPercentageDesc(quiz.getId())
                .stream()
                .map(a -> toAttemptResponse(a, questions))
                .collect(Collectors.toList());
    }

    // ── duplicateQuiz ──────────────────────────────────────────────────────────

    @Override
    @Transactional
    public void duplicateQuiz(Long originalSessionId, Long newSessionId) {
        quizRepository.findBySessionId(originalSessionId).ifPresent(original -> {
            Session newSession = sessionRepository.findById(newSessionId)
                    .orElseThrow(() -> new ResourceNotFoundException("Session", "id", newSessionId));

            List<Question> originalQuestions =
                    questionRepository.findByQuizIdOrderByPosition(original.getId());

            Quiz newQuiz = Quiz.builder()
                    .session(newSession)
                    .title(original.getTitle())
                    .description(original.getDescription())
                    .timeLimitMinutes(original.getTimeLimitMinutes())
                    .build();

            Quiz savedQuiz = quizRepository.save(newQuiz);

            for (Question q : originalQuestions) {
                questionRepository.save(Question.builder()
                        .quiz(savedQuiz)
                        .questionText(q.getQuestionText())
                        .optionA(q.getOptionA())
                        .optionB(q.getOptionB())
                        .optionC(q.getOptionC())
                        .optionD(q.getOptionD())
                        .correctOption(q.getCorrectOption())
                        .position(q.getPosition())
                        .build());
            }
        });
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    private Quiz buildAndSaveQuiz(Session session, String title, String description,
                                   int timeLimitMinutes, List<CreateQuestionRequest> questionRequests) {
        Quiz quiz = Quiz.builder()
                .session(session)
                .title(title)
                .description(description)
                .timeLimitMinutes(timeLimitMinutes)
                .build();

        Quiz savedQuiz = quizRepository.save(quiz);

        for (int i = 0; i < questionRequests.size(); i++) {
            CreateQuestionRequest qr = questionRequests.get(i);
            int pos = qr.getPosition() > 0 ? qr.getPosition() : i;
            questionRepository.save(Question.builder()
                    .quiz(savedQuiz)
                    .questionText(qr.getQuestionText())
                    .optionA(qr.getOptionA())
                    .optionB(qr.getOptionB())
                    .optionC(qr.getOptionC())
                    .optionD(qr.getOptionD())
                    .correctOption(qr.getCorrectOption().toUpperCase())
                    .position(pos)
                    .build());
        }

        return quizRepository.findById(savedQuiz.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Quiz", "id", savedQuiz.getId()));
    }

    private QuizResponse toProfResponse(Quiz quiz) {
        List<QuestionResponse> questions = questionRepository
                .findByQuizIdOrderByPosition(quiz.getId())
                .stream()
                .map(this::toProfQuestion)
                .collect(Collectors.toList());

        return QuizResponse.builder()
                .id(quiz.getId())
                .title(quiz.getTitle())
                .description(quiz.getDescription())
                .timeLimitMinutes(quiz.getTimeLimitMinutes())
                .sessionId(quiz.getSession().getId())
                .questions(questions)
                .build();
    }

    private QuestionResponse toStudentQuestion(Question q) {
        return QuestionResponse.builder()
                .id(q.getId())
                .questionText(q.getQuestionText())
                .optionA(q.getOptionA())
                .optionB(q.getOptionB())
                .optionC(q.getOptionC())
                .optionD(q.getOptionD())
                .position(q.getPosition())
                .build();
    }

    private QuestionWithAnswerResponse toProfQuestion(Question q) {
        return new QuestionWithAnswerResponse(
                q.getId(), q.getQuestionText(),
                q.getOptionA(), q.getOptionB(), q.getOptionC(), q.getOptionD(),
                q.getPosition(), q.getCorrectOption());
    }

    private QuizAttemptResponse toAttemptResponse(QuizAttempt attempt, List<Question> questions) {
        Map<Long, Question> qMap = questions.stream()
                .collect(Collectors.toMap(Question::getId, q -> q));

        List<StudentAnswerResult> results = attempt.getAnswers().stream()
                .map(sa -> {
                    Question q = qMap.get(sa.getQuestion().getId());
                    return StudentAnswerResult.builder()
                            .questionId(sa.getQuestion().getId())
                            .questionText(q != null ? q.getQuestionText() : "")
                            .selectedOption(sa.getSelectedOption())
                            .correctOption(q != null ? q.getCorrectOption() : "")
                            .isCorrect(sa.isCorrect())
                            .build();
                })
                .collect(Collectors.toList());

        return QuizAttemptResponse.builder()
                .id(attempt.getId())
                .studentId(attempt.getStudent().getId())
                .studentName(attempt.getStudent().getFullName())
                .studentEmail(attempt.getStudent().getEmail())
                .score(attempt.getScore())
                .totalQuestions(attempt.getTotalQuestions())
                .percentage(attempt.getPercentage())
                .answers(results)
                .completedAt(attempt.getCompletedAt())
                .build();
    }

    // ── PDF text extraction ────────────────────────────────────────────────────

    private String extractPdfText(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Aucun fichier PDF fourni.");
        }
        try (InputStream is = file.getInputStream();
             PDDocument doc = PDDocument.load(is)) {
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);
            return stripper.getText(doc).trim();
        } catch (IOException e) {
            log.error("Erreur lecture PDF : {}", e.getMessage());
            throw new BadRequestException("Erreur lors de la lecture du fichier PDF : " + e.getMessage());
        }
    }

    // ── AI quiz generation ─────────────────────────────────────────────────────

    private List<CreateQuestionRequest> callAiForQuiz(String pdfText, int numberOfQuestions) {
        String prompt = String.format(
            "Tu es un professeur expert. À partir du texte suivant, génère exactement %d questions QCM en français. "
            + "Chaque question doit avoir 4 options (A, B, C, D) et une seule bonne réponse. "
            + "Réponds UNIQUEMENT en JSON valide avec ce format exact: "
            + "{\"questions\": [{\"questionText\": \"...\", \"optionA\": \"...\", \"optionB\": \"...\", "
            + "\"optionC\": \"...\", \"optionD\": \"...\", \"correctOption\": \"A\"}]}. "
            + "Texte: %s",
            numberOfQuestions, pdfText
        );

        Map<String, Object> requestBody = Map.of(
            "model",    "deepseek-r1:14b",
            "messages", List.of(
                Map.of("role",    "system",
                       "content", "Tu es un professeur expert en création de QCM pédagogiques. "
                                + "Tu réponds UNIQUEMENT avec du JSON valide, sans texte supplémentaire."),
                Map.of("role",    "user",
                       "content", prompt)
            ),
            "max_tokens",  4096,
            "temperature", 0.4
        );

        String rawResponse;
        try {
            log.info("Appel IA pour génération de {} questions QCM…", numberOfQuestions);

            Map<?, ?> response = webClient.post()
                    .uri("/chat/completions")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response == null) {
                throw new BadRequestException("Impossible de générer le quiz. Erreur de communication avec l'IA.");
            }

            List<?> choices = (List<?>) response.get("choices");
            if (choices == null || choices.isEmpty()) {
                throw new BadRequestException("Impossible de générer le quiz. Erreur de communication avec l'IA.");
            }

            Map<?, ?> firstChoice = (Map<?, ?>) choices.get(0);
            Map<?, ?> message     = (Map<?, ?>) firstChoice.get("message");
            rawResponse = (String) message.get("content");

            log.info("Réponse IA reçue ({} caractères).", rawResponse != null ? rawResponse.length() : 0);

        } catch (WebClientResponseException e) {
            log.error("Erreur API IA : {} — {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new BadRequestException("Impossible de générer le quiz. Erreur de communication avec l'IA.");
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("Erreur inattendue lors de l'appel IA : {}", e.getMessage());
            throw new BadRequestException("Impossible de générer le quiz. Erreur de communication avec l'IA.");
        }

        return parseAiQuizResponse(rawResponse);
    }

    private List<CreateQuestionRequest> parseAiQuizResponse(String rawResponse) {
        if (rawResponse == null || rawResponse.isBlank()) {
            throw new BadRequestException("Impossible de générer le quiz. Erreur de communication avec l'IA.");
        }

        // Strip <think>...</think> blocks produced by DeepSeek reasoning models
        String cleaned = rawResponse.replaceAll("(?s)<think>.*?</think>", "").trim();

        // Extract the JSON object
        int start = cleaned.indexOf('{');
        int end   = cleaned.lastIndexOf('}');
        if (start == -1 || end == -1 || end < start) {
            log.error("JSON introuvable dans la réponse IA : {}", cleaned.substring(0, Math.min(200, cleaned.length())));
            throw new BadRequestException("Impossible de générer le quiz. Erreur de communication avec l'IA.");
        }
        String jsonStr = cleaned.substring(start, end + 1);

        try {
            JsonNode root = objectMapper.readTree(jsonStr);
            JsonNode questionsNode = root.get("questions");
            if (questionsNode == null || !questionsNode.isArray()) {
                throw new BadRequestException("Impossible de générer le quiz. Erreur de communication avec l'IA.");
            }

            List<CreateQuestionRequest> result = new ArrayList<>();
            for (int i = 0; i < questionsNode.size(); i++) {
                JsonNode q = questionsNode.get(i);
                CreateQuestionRequest cqr = new CreateQuestionRequest();
                cqr.setQuestionText(q.path("questionText").asText());
                cqr.setOptionA(q.path("optionA").asText());
                cqr.setOptionB(q.path("optionB").asText());
                cqr.setOptionC(q.path("optionC").asText());
                cqr.setOptionD(q.path("optionD").asText());
                cqr.setCorrectOption(q.path("correctOption").asText("A").toUpperCase());
                cqr.setPosition(i);
                result.add(cqr);
            }

            if (result.isEmpty()) {
                throw new BadRequestException("Impossible de générer le quiz. Erreur de communication avec l'IA.");
            }

            log.info("{} questions générées par l'IA avec succès.", result.size());
            return result;

        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("Erreur parsing JSON IA : {}", e.getMessage());
            throw new BadRequestException("Impossible de générer le quiz. Erreur de communication avec l'IA.");
        }
    }

    // ── Guards & finders ──────────────────────────────────────────────────────

    private Session getSessionOrThrow(Long id) {
        return sessionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Session", "id", id));
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", "email", email));
    }

    private Quiz getQuizOrThrow(Long sessionId) {
        return quizRepository.findBySessionId(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Aucun quiz trouvé pour cette session."));
    }

    private void verifyStudentEnrolled(Session session, User student) {
        boolean enrolled = session.getStudents().stream()
                .anyMatch(s -> s.getId().equals(student.getId()));
        if (!enrolled) {
            throw new ForbiddenException("Accès refusé. Vous n'êtes pas inscrit à cette session.");
        }
    }

    private void verifyProfOwnership(Session session, String email) {
        User prof = getUserByEmail(email);
        if (!session.getProf().getId().equals(prof.getId())) {
            throw new ForbiddenException("Accès refusé. Vous n'êtes pas le propriétaire de cette session.");
        }
    }

    private void verifyQuizType(Session session) {
        if (!QUIZ_TYPE.equalsIgnoreCase(session.getSessionType())) {
            throw new BadRequestException("Ce type de session ne supporte pas les quiz.");
        }
    }

    private void verifyNoExistingQuiz(Long sessionId) {
        if (quizRepository.existsBySessionId(sessionId)) {
            throw new BadRequestException("Un quiz existe déjà pour cette session.");
        }
    }

    private void validateAllOptions(List<CreateQuestionRequest> questions) {
        for (CreateQuestionRequest q : questions) {
            String opt = q.getCorrectOption() == null ? "" : q.getCorrectOption().toUpperCase();
            if (!VALID_OPTIONS.contains(opt)) {
                throw new BadRequestException("Réponse invalide. L'option doit être A, B, C ou D.");
            }
        }
    }
}
