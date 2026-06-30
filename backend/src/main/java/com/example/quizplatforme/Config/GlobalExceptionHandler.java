package com.example.quizplatforme.Config;

import com.example.quizplatforme.exception.ApiException;
import com.example.quizplatforme.exception.CodeExecutionException;
import com.example.quizplatforme.payload.ErrorResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Gestionnaire centralisé des exceptions pour toute la couche REST.
 *
 * Priorité des handlers :
 *   1. Handlers spécifiques (MethodArgumentNotValidException, UsernameNotFoundException, …)
 *   2. Handler générique ApiException (couvre BadRequestException, RessourceNotFoundException, …)
 *   3. Catch-all Exception (500, sans exposer le message interne au client)
 *
 * Note : AccessDeniedException (Spring Security) est interceptée ici pour les cas
 * où un contrôleur la lance manuellement. Les 403 produits par la chaîne de filtres
 * (avant d'atteindre le contrôleur) sont gérés par SecurityConfig.accessDeniedHandler().
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // ── Validation des champs (@Valid / @Validated) ───────────────────────────

    /**
     * 400 — erreurs de validation de champs (ex : @NotBlank, @Email, @Size).
     * Retourne un objet enrichi avec la map des erreurs par champ.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationException(
            MethodArgumentNotValidException ex) {

        Map<String, String> fieldErrors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .collect(Collectors.toMap(
                        FieldError::getField,
                        fieldError -> fieldError.getDefaultMessage() != null
                                ? fieldError.getDefaultMessage()
                                : "Valeur invalide",
                        // En cas de plusieurs erreurs sur le même champ, garder la première
                        (existing, duplicate) -> existing
                ));

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("message", "La requête contient des champs invalides.");
        body.put("dateTime", LocalDateTime.now().toString());
        body.put("errors", fieldErrors);

        log.debug("Erreur de validation : {}", fieldErrors);

        return ResponseEntity.badRequest().body(body);
    }

    // ── Utilisateur introuvable ───────────────────────────────────────────────

    /**
     * 404 — utilisateur non trouvé en base lors d'un chargement par email/id.
     */
    @ExceptionHandler(UsernameNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleUsernameNotFoundException(
            UsernameNotFoundException ex) {

        log.debug("Utilisateur introuvable : {}", ex.getMessage());

        ErrorResponse body = new ErrorResponse(
                HttpStatus.NOT_FOUND.value(),
                "Utilisateur introuvable. Vérifiez votre adresse e-mail.",
                LocalDateTime.now()
        );
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
    }

    // ── Identifiants invalides ────────────────────────────────────────────────

    /**
     * 401 — e-mail ou mot de passe incorrect lors de la connexion.
     * Sans ce handler, la BadCredentialsException de Spring Security tombe dans
     * le catch-all et renvoie un 500 trompeur.
     */
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleBadCredentialsException(
            BadCredentialsException ex) {

        log.debug("Échec d'authentification : {}", ex.getMessage());

        ErrorResponse body = new ErrorResponse(
                HttpStatus.UNAUTHORIZED.value(),
                "E-mail ou mot de passe incorrect.",
                LocalDateTime.now()
        );
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(body);
    }

    // ── Accès refusé (niveau applicatif) ─────────────────────────────────────

    /**
     * 403 — AccessDeniedException lancée manuellement dans un service ou contrôleur.
     * Les 403 de la chaîne de filtres Spring Security sont gérés séparément
     * dans SecurityConfig (accessDeniedHandler).
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDeniedException(
            AccessDeniedException ex) {

        log.warn("Accès refusé (niveau applicatif) : {}", ex.getMessage());

        ErrorResponse body = new ErrorResponse(
                HttpStatus.FORBIDDEN.value(),
                "Accès refusé. Vous n'avez pas les droits nécessaires pour effectuer cette action.",
                LocalDateTime.now()
        );
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(body);
    }

    // ── Exceptions métier (ApiException et sous-classes) ─────────────────────

    /**
     * Couvre toutes les sous-classes d'ApiException :
     * BadRequestException (400), RessourceNotFoundException (404),
     * UnauthrizedException (401), ResourceNotFoundException (404),
     * ForbiddenException (403), etc.
     *
     * Le message est défini par le service appelant — déjà en français.
     */
    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ErrorResponse> handleApiException(ApiException ex) {
        log.debug("Exception métier [{}] : {}", ex.getStatus(), ex.getMessage());

        ErrorResponse body = new ErrorResponse(
                ex.getStatus().value(),
                ex.getMessage(),
                LocalDateTime.now()
        );
        return ResponseEntity.status(ex.getStatus()).body(body);
    }

    // ── Erreur d'exécution de code ────────────────────────────────────────────

    /**
     * 400 — l'exécution du code utilisateur a échoué (syntaxe, timeout, etc.).
     * CodeExecutionException étend RuntimeException (pas ApiException), d'où
     * ce handler dédié.
     */
    @ExceptionHandler(CodeExecutionException.class)
    public ResponseEntity<ErrorResponse> handleCodeExecutionException(
            CodeExecutionException ex) {

        log.info("Erreur d'exécution de code : {}", ex.getMessage());

        ErrorResponse body = new ErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                "Erreur d'exécution du code : " + ex.getMessage(),
                LocalDateTime.now()
        );
        return ResponseEntity.badRequest().body(body);
    }

    // ── Catch-all ─────────────────────────────────────────────────────────────

    /**
     * 500 — toute exception non prévue.
     * Le message interne n'est PAS exposé au client pour éviter les fuites
     * d'informations techniques (stack traces, noms de classes, etc.).
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleException(Exception ex) {
        // Loggé en ERROR avec stack trace complète pour le débogage côté serveur
        log.error("Erreur interne non gérée", ex);

        ErrorResponse body = new ErrorResponse(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "Une erreur interne est survenue. Veuillez réessayer plus tard.",
                LocalDateTime.now()
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }
}
