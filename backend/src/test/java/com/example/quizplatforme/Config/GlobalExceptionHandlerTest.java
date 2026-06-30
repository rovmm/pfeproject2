package com.example.quizplatforme.Config;

import com.example.quizplatforme.exception.*;
import com.example.quizplatforme.payload.ErrorResponse;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    // ── BadCredentialsException → 401 ─────────────────────────────────────────

    @Test
    void badCredentials_returns401WithMessage() {
        ResponseEntity<ErrorResponse> res =
                handler.handleBadCredentialsException(new BadCredentialsException("Bad credentials"));

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(res.getBody()).isNotNull();
        assertThat(res.getBody().getStatus()).isEqualTo(401);
        assertThat(res.getBody().getMessage()).contains("mot de passe");
    }

    // ── AccessDeniedException → 403 ───────────────────────────────────────────

    @Test
    void accessDenied_returns403WithMessage() {
        ResponseEntity<ErrorResponse> res =
                handler.handleAccessDeniedException(new AccessDeniedException("forbidden"));

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(res.getBody().getStatus()).isEqualTo(403);
        assertThat(res.getBody().getMessage()).contains("refusé");
    }

    // ── ApiException subclasses ────────────────────────────────────────────────

    @Test
    void resourceNotFound_returns404() {
        ResponseEntity<ErrorResponse> res =
                handler.handleApiException(new ResourceNotFoundException("Session", "id", 42));

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(res.getBody().getStatus()).isEqualTo(404);
        assertThat(res.getBody().getMessage()).contains("Session").contains("42");
    }

    @Test
    void badRequest_returns400() {
        ResponseEntity<ErrorResponse> res =
                handler.handleApiException(new BadRequestException("Valeur invalide."));

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(res.getBody().getStatus()).isEqualTo(400);
        assertThat(res.getBody().getMessage()).isEqualTo("Valeur invalide.");
    }

    @Test
    void forbidden_returns403() {
        ResponseEntity<ErrorResponse> res =
                handler.handleApiException(new ForbiddenException("Accès interdit."));

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(res.getBody().getStatus()).isEqualTo(403);
    }

    // ── UsernameNotFoundException → 404 ───────────────────────────────────────

    @Test
    void usernameNotFound_returns404WithHint() {
        var ex = new org.springframework.security.core.userdetails.UsernameNotFoundException("user@x.com");
        ResponseEntity<ErrorResponse> res = handler.handleUsernameNotFoundException(ex);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(res.getBody().getMessage()).contains("introuvable");
    }

    // ── CodeExecutionException → 400 ──────────────────────────────────────────

    @Test
    void codeExecution_returns400() {
        ResponseEntity<ErrorResponse> res =
                handler.handleCodeExecutionException(new CodeExecutionException("timeout"));

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(res.getBody().getMessage()).contains("timeout");
    }

    // ── Generic Exception → 500 ───────────────────────────────────────────────

    @Test
    void genericException_returns500WithGenericMessage() {
        ResponseEntity<ErrorResponse> res =
                handler.handleException(new RuntimeException("Something exploded"));

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(res.getBody().getStatus()).isEqualTo(500);
        // Internal details must NOT be exposed
        assertThat(res.getBody().getMessage()).doesNotContain("exploded");
    }

    // ── dateTime field is always set ──────────────────────────────────────────

    @Test
    void everyResponse_hasNonNullDateTime() {
        ErrorResponse body = handler.handleApiException(
                new BadRequestException("x")).getBody();
        assertThat(body).isNotNull();
        assertThat(body.getDateTime()).isNotNull();
    }
}
