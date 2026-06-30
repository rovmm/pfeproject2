package com.example.quizplatforme.Service;

import com.example.quizplatforme.DTO.Request.UpdateProfileRequest;
import com.example.quizplatforme.DTO.Response.AdminStatsResponse;
import com.example.quizplatforme.DTO.Response.UserProfileResponse;
import com.example.quizplatforme.Model.Entity.User;
import com.example.quizplatforme.Model.Enum.PlanEnum;
import com.example.quizplatforme.Model.Enum.RoleEnum;
import com.example.quizplatforme.Repository.ExecutionResultRepository;
import com.example.quizplatforme.Repository.PdfSummaryRepository;
import com.example.quizplatforme.Repository.SessionRepository;
import com.example.quizplatforme.Repository.UserRepository;
import com.example.quizplatforme.Service.Impl.UserServiceImpl;
import com.example.quizplatforme.exception.BadRequestException;
import com.example.quizplatforme.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock UserRepository            userRepository;
    @Mock SessionRepository         sessionRepository;
    @Mock ExecutionResultRepository executionResultRepository;
    @Mock PdfSummaryRepository      pdfSummaryRepository;
    @Mock PasswordEncoder           passwordEncoder;

    @InjectMocks UserServiceImpl userService;

    private User alice;

    @BeforeEach
    void setUp() {
        alice = User.builder()
                .id(1L)
                .fullName("Alice Dupont")
                .email("alice@example.com")
                .password("hashed-pw")
                .role(RoleEnum.STUDENT)
                .plan(PlanEnum.FREE)
                .createdAt(LocalDateTime.now())
                .build();
    }

    // ── getUserProfile ─────────────────────────────────────────────────────────

    @Test
    void getUserProfile_found_returnsResponse() {
        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(alice));

        UserProfileResponse res = userService.getUserProfile("alice@example.com");

        assertThat(res.getEmail()).isEqualTo("alice@example.com");
        assertThat(res.getFullName()).isEqualTo("Alice Dupont");
        assertThat(res.getRole()).isEqualTo(RoleEnum.STUDENT);
        assertThat(res.getPlan()).isEqualTo(PlanEnum.FREE);
    }

    @Test
    void getUserProfile_notFound_throwsResourceNotFoundException() {
        when(userRepository.findByEmail("ghost@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getUserProfile("ghost@example.com"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ── updateProfile ──────────────────────────────────────────────────────────

    @Test
    void updateProfile_changeFullName_updatesAndReturns() {
        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(alice));
        when(userRepository.save(any())).thenReturn(alice);

        UpdateProfileRequest req = new UpdateProfileRequest();
        req.setFullName("Alice Martin");

        UserProfileResponse res = userService.updateProfile("alice@example.com", req);

        assertThat(alice.getFullName()).isEqualTo("Alice Martin");
        verify(userRepository).save(alice);
    }

    @Test
    void updateProfile_changePassword_encodesNewPassword() {
        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(alice));
        when(passwordEncoder.matches("old-pw", "hashed-pw")).thenReturn(true);
        when(passwordEncoder.encode("new-pw-123")).thenReturn("new-hashed");
        when(userRepository.save(any())).thenReturn(alice);

        UpdateProfileRequest req = new UpdateProfileRequest();
        req.setCurrentPassword("old-pw");
        req.setNewPassword("new-pw-123");

        userService.updateProfile("alice@example.com", req);

        verify(passwordEncoder).encode("new-pw-123");
        assertThat(alice.getPassword()).isEqualTo("new-hashed");
    }

    @Test
    void updateProfile_newPasswordWithoutCurrentPassword_throwsBadRequestException() {
        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(alice));

        UpdateProfileRequest req = new UpdateProfileRequest();
        req.setNewPassword("new-pass-123");
        // no currentPassword

        assertThatThrownBy(() -> userService.updateProfile("alice@example.com", req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("actuel");
    }

    @Test
    void updateProfile_wrongCurrentPassword_throwsBadRequestException() {
        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(alice));
        when(passwordEncoder.matches("wrong-pw", "hashed-pw")).thenReturn(false);

        UpdateProfileRequest req = new UpdateProfileRequest();
        req.setCurrentPassword("wrong-pw");
        req.setNewPassword("new-pass-123");

        assertThatThrownBy(() -> userService.updateProfile("alice@example.com", req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("incorrect");
    }

    // ── getAllUsers ────────────────────────────────────────────────────────────

    @Test
    void getAllUsers_returnsMappedList() {
        User bob = User.builder().id(2L).fullName("Bob").email("bob@example.com")
                .password("h").role(RoleEnum.PROF).plan(PlanEnum.FREE)
                .createdAt(LocalDateTime.now()).build();
        when(userRepository.findAll()).thenReturn(List.of(alice, bob));

        List<UserProfileResponse> result = userService.getAllUsers();

        assertThat(result).hasSize(2);
        assertThat(result).extracting(UserProfileResponse::getEmail)
                .containsExactlyInAnyOrder("alice@example.com", "bob@example.com");
    }

    // ── deleteUser ─────────────────────────────────────────────────────────────

    @Test
    void deleteUser_existingId_deletesUser() {
        when(userRepository.existsById(1L)).thenReturn(true);

        userService.deleteUser(1L);

        verify(userRepository).deleteById(1L);
    }

    @Test
    void deleteUser_nonExistingId_throwsResourceNotFoundException() {
        when(userRepository.existsById(99L)).thenReturn(false);

        assertThatThrownBy(() -> userService.deleteUser(99L))
                .isInstanceOf(ResourceNotFoundException.class);
        verify(userRepository, never()).deleteById(any());
    }

    // ── getAdminStats ──────────────────────────────────────────────────────────

    @Test
    void getAdminStats_returnsAggregatedCounts() {
        when(userRepository.count()).thenReturn(5L);
        when(sessionRepository.count()).thenReturn(3L);
        when(executionResultRepository.count()).thenReturn(12L);
        when(pdfSummaryRepository.count()).thenReturn(4L);

        AdminStatsResponse stats = userService.getAdminStats();

        assertThat(stats.getTotalUsers()).isEqualTo(5L);
        assertThat(stats.getTotalSessions()).isEqualTo(3L);
        assertThat(stats.getTotalExecutions()).isEqualTo(12L);
        assertThat(stats.getTotalPdfSummaries()).isEqualTo(4L);
    }
}
