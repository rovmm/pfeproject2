package com.example.quizplatforme.Service;

import com.example.quizplatforme.Config.JwtTokenProvider;
import com.example.quizplatforme.DTO.Request.LoginRequest;
import com.example.quizplatforme.DTO.Request.RegisterRequest;
import com.example.quizplatforme.DTO.Response.JwtResponse;
import com.example.quizplatforme.Model.Entity.User;
import com.example.quizplatforme.Model.Enum.PlanEnum;
import com.example.quizplatforme.Model.Enum.RoleEnum;
import com.example.quizplatforme.Repository.UserRepository;
import com.example.quizplatforme.Service.Impl.AuthServiceImpl;
import com.example.quizplatforme.exception.BadRequestException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock UserRepository        userRepository;
    @Mock AuthenticationManager authenticationManager;
    @Mock JwtTokenProvider      jwtTokenProvider;
    @Mock PasswordEncoder       passwordEncoder;

    @InjectMocks AuthServiceImpl authService;

    private User existingUser;

    @BeforeEach
    void setUp() {
        existingUser = User.builder()
                .id(1L)
                .fullName("Alice Dupont")
                .email("alice@example.com")
                .password("hashed-pw")
                .role(RoleEnum.STUDENT)
                .plan(PlanEnum.FREE)
                .build();
    }

    // ── login ──────────────────────────────────────────────────────────────────

    @Test
    void login_happyPath_returnsJwtResponse() {
        LoginRequest req = loginRequest("alice@example.com", "secret123");
        Authentication auth = mock(Authentication.class);
        when(authenticationManager.authenticate(any())).thenReturn(auth);
        when(jwtTokenProvider.generateToken(auth)).thenReturn("jwt-token");
        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(existingUser));

        JwtResponse res = authService.login(req);

        assertThat(res.getToken()).isEqualTo("jwt-token");
        assertThat(res.getEmail()).isEqualTo("alice@example.com");
        assertThat(res.getRole()).isEqualTo("STUDENT");
        assertThat(res.getPlan()).isEqualTo("FREE");
        assertThat(res.getFullName()).isEqualTo("Alice Dupont");
    }

    @Test
    void login_wrongCredentials_propagatesBadCredentialsException() {
        when(authenticationManager.authenticate(any()))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        assertThatThrownBy(() -> authService.login(loginRequest("x@x.com", "wrong")))
                .isInstanceOf(BadCredentialsException.class);
    }

    @Test
    void login_callsAuthManagerWithCorrectToken() {
        Authentication auth = mock(Authentication.class);
        when(authenticationManager.authenticate(any())).thenReturn(auth);
        when(jwtTokenProvider.generateToken(any())).thenReturn("t");
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(existingUser));

        authService.login(loginRequest("alice@example.com", "pass"));

        verify(authenticationManager).authenticate(
                argThat(a -> a instanceof UsernamePasswordAuthenticationToken
                        && "alice@example.com".equals(((UsernamePasswordAuthenticationToken) a).getPrincipal())
                )
        );
    }

    // ── register ───────────────────────────────────────────────────────────────

    @Test
    void register_happyPath_returnsJwtResponse() {
        RegisterRequest req = registerRequest("Bob", "bob@example.com", "password1", RoleEnum.STUDENT);
        when(userRepository.existsByEmail("bob@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password1")).thenReturn("hashed");
        User saved = User.builder().id(2L).fullName("Bob").email("bob@example.com")
                .password("hashed").role(RoleEnum.STUDENT).plan(PlanEnum.FREE).build();
        when(userRepository.save(any())).thenReturn(saved);
        when(jwtTokenProvider.generateToken(any())).thenReturn("new-token");

        JwtResponse res = authService.register(req);

        assertThat(res.getToken()).isEqualTo("new-token");
        assertThat(res.getEmail()).isEqualTo("bob@example.com");
        assertThat(res.getRole()).isEqualTo("STUDENT");
    }

    @Test
    void register_duplicateEmail_throwsBadRequestException() {
        when(userRepository.existsByEmail("alice@example.com")).thenReturn(true);

        assertThatThrownBy(() ->
                authService.register(registerRequest("Alice", "alice@example.com", "pw123456", RoleEnum.STUDENT))
        ).isInstanceOf(BadRequestException.class)
         .hasMessageContaining("déjà utilisée");
    }

    @Test
    void register_adminRole_throwsBadRequestException() {
        when(userRepository.existsByEmail(anyString())).thenReturn(false);

        assertThatThrownBy(() ->
                authService.register(registerRequest("Admin", "admin@example.com", "pw123456", RoleEnum.ADMIN))
        ).isInstanceOf(BadRequestException.class)
         .hasMessageContaining("administrateur");
    }

    @Test
    void register_encodesPassword() {
        RegisterRequest req = registerRequest("Carol", "carol@example.com", "plain-pw", RoleEnum.PROF);
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode("plain-pw")).thenReturn("encoded-pw");
        User saved = User.builder().id(3L).fullName("Carol").email("carol@example.com")
                .password("encoded-pw").role(RoleEnum.PROF).plan(PlanEnum.FREE).build();
        when(userRepository.save(any())).thenReturn(saved);
        when(jwtTokenProvider.generateToken(any())).thenReturn("tok");

        authService.register(req);

        verify(passwordEncoder).encode("plain-pw");
        verify(userRepository).save(argThat(u -> "encoded-pw".equals(u.getPassword())));
    }

    @Test
    void register_savesUserWithCorrectRole() {
        RegisterRequest req = registerRequest("Dave", "dave@example.com", "pass1234", RoleEnum.PROF);
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(any())).thenReturn("h");
        User saved = User.builder().id(4L).fullName("Dave").email("dave@example.com")
                .password("h").role(RoleEnum.PROF).plan(PlanEnum.FREE).build();
        when(userRepository.save(any())).thenReturn(saved);
        when(jwtTokenProvider.generateToken(any())).thenReturn("t");

        JwtResponse res = authService.register(req);

        assertThat(res.getRole()).isEqualTo("PROF");
    }

    // ── helpers ────────────────────────────────────────────────────────────────

    private static LoginRequest loginRequest(String email, String password) {
        LoginRequest r = new LoginRequest();
        r.setEmail(email);
        r.setPassword(password);
        return r;
    }

    private static RegisterRequest registerRequest(String name, String email,
                                                    String password, RoleEnum role) {
        RegisterRequest r = new RegisterRequest();
        r.setFullName(name);
        r.setEmail(email);
        r.setPassword(password);
        r.setRole(role);
        return r;
    }
}
