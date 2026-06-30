package com.example.quizplatforme.Config;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class JwtTokenProviderTest {

    private JwtTokenProvider jwtTokenProvider;

    // 32-char secret for HS256 (min 256 bits)
    private static final String SECRET = "test-secret-key-that-is-32chars!";
    private static final long   EXPIRY = 86_400_000L; // 24 h

    @BeforeEach
    void setUp() {
        jwtTokenProvider = new JwtTokenProvider();
        ReflectionTestUtils.setField(jwtTokenProvider, "secretKey",    SECRET);
        ReflectionTestUtils.setField(jwtTokenProvider, "expirationMs", EXPIRY);
    }

    // ── generateToken ──────────────────────────────────────────────────────────

    @Test
    void generateToken_returnsNonBlankJwt() {
        Authentication auth = auth("user@example.com");
        String token = jwtTokenProvider.generateToken(auth);
        assertThat(token).isNotBlank();
    }

    @Test
    void generateToken_subjectMatchesAuthName() {
        Authentication auth = auth("alice@example.com");
        String token = jwtTokenProvider.generateToken(auth);
        assertThat(jwtTokenProvider.getEmailFromToken(token)).isEqualTo("alice@example.com");
    }

    @Test
    void generateToken_differentUsersProduceDifferentTokens() {
        String t1 = jwtTokenProvider.generateToken(auth("a@x.com"));
        String t2 = jwtTokenProvider.generateToken(auth("b@x.com"));
        assertThat(t1).isNotEqualTo(t2);
    }

    // ── validateToken ──────────────────────────────────────────────────────────

    @Test
    void validateToken_returnsTrueForValidToken() {
        String token = jwtTokenProvider.generateToken(auth("user@example.com"));
        assertThat(jwtTokenProvider.validateToken(token)).isTrue();
    }

    @Test
    void validateToken_returnsFalseForGarbageString() {
        assertThat(jwtTokenProvider.validateToken("not.a.token")).isFalse();
    }

    @Test
    void validateToken_returnsFalseForBlankString() {
        assertThat(jwtTokenProvider.validateToken("")).isFalse();
    }

    @Test
    void validateToken_returnsFalseForExpiredToken() throws Exception {
        // Issue a token that expires immediately
        ReflectionTestUtils.setField(jwtTokenProvider, "expirationMs", -1L);
        String expired = jwtTokenProvider.generateToken(auth("user@example.com"));
        assertThat(jwtTokenProvider.validateToken(expired)).isFalse();
    }

    @Test
    void validateToken_returnsFalseForWrongSignature() {
        // Generate with one secret, validate with another
        JwtTokenProvider other = new JwtTokenProvider();
        ReflectionTestUtils.setField(other, "secretKey",    "different-secret-key-32chars!!!!");
        ReflectionTestUtils.setField(other, "expirationMs", EXPIRY);

        String token = jwtTokenProvider.generateToken(auth("user@example.com"));
        assertThat(other.validateToken(token)).isFalse();
    }

    // ── getEmailFromToken ──────────────────────────────────────────────────────

    @Test
    void getEmailFromToken_extractsCorrectEmail() {
        String email = "hello@world.com";
        String token = jwtTokenProvider.generateToken(auth(email));
        assertThat(jwtTokenProvider.getEmailFromToken(token)).isEqualTo(email);
    }

    // ── helpers ────────────────────────────────────────────────────────────────

    private static Authentication auth(String email) {
        return new UsernamePasswordAuthenticationToken(
                email, null,
                List.of(new SimpleGrantedAuthority("ROLE_STUDENT"))
        );
    }
}
