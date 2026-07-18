package com.example.quizplatforme.Service.Impl;

import com.example.quizplatforme.Config.JwtTokenProvider;
import com.example.quizplatforme.DTO.Request.ForgotPasswordRequest;
import com.example.quizplatforme.DTO.Request.LoginRequest;
import com.example.quizplatforme.DTO.Request.RegisterRequest;
import com.example.quizplatforme.DTO.Request.ResendOtpRequest;
import com.example.quizplatforme.DTO.Request.ResetPasswordRequest;
import com.example.quizplatforme.DTO.Request.VerifyOtpRequest;
import com.example.quizplatforme.DTO.Response.JwtResponse;
import com.example.quizplatforme.DTO.Response.MessageResponse;
import com.example.quizplatforme.Model.Entity.User;
import com.example.quizplatforme.Model.Enum.PlanEnum;
import com.example.quizplatforme.Model.Enum.RoleEnum;
import com.example.quizplatforme.Repository.UserRepository;
import com.example.quizplatforme.Service.IAuthServicelmpl;
import com.example.quizplatforme.Service.IEmailService;
import com.example.quizplatforme.Service.OtpService;
import com.example.quizplatforme.exception.BadRequestException;
import com.example.quizplatforme.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements IAuthServicelmpl {

    private static final String TYPE_EMAIL_VERIFICATION = "EMAIL_VERIFICATION";
    private static final String TYPE_PASSWORD_RESET = "PASSWORD_RESET";

    private final UserRepository userRepository;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final OtpService otpService;
    private final IEmailService emailService;

    // ------------------------------------------------------------------ //
    //  Connexion                                                           //
    // ------------------------------------------------------------------ //

    /**
     * Authentifie l'utilisateur via Spring Security, génère un JWT et
     * retourne les informations de l'utilisateur.
     *
     * @throws BadRequestException si les identifiants sont incorrects ou si
     *                             l'adresse e-mail n'a pas encore été vérifiée
     */
    @Override
    @Transactional
    public JwtResponse login(LoginRequest request) {
        // Délègue la vérification du mot de passe à Spring Security (BCrypt)
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadRequestException("Identifiants invalides."));

        if (!user.isEmailVerified()) {
            throw new BadRequestException("Veuillez vérifier votre email avant de vous connecter.");
        }

        // L'email est le subject du JWT (auth.getName() = email)
        String token = jwtTokenProvider.generateToken(auth);

        return buildJwtResponse(token, user);
    }

    // ------------------------------------------------------------------ //
    //  Inscription                                                         //
    // ------------------------------------------------------------------ //

    /**
     * Crée un nouveau compte utilisateur (non vérifié) et envoie un code OTP
     * de vérification par e-mail. Aucun token n'est retourné — l'utilisateur
     * doit d'abord vérifier son adresse via {@code verify-email}.
     *
     * L'inscription en tant qu'ADMIN est interdite via cette API publique.
     *
     * @throws BadRequestException si l'e-mail est déjà utilisé ou si le
     *                             rôle demandé est ADMIN
     */
    @Override
    @Transactional
    public JwtResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException(
                    "Cette adresse e-mail est déjà utilisée. Veuillez vous connecter ou utiliser une autre adresse.");
        }

        if (request.getRole() == RoleEnum.ADMIN) {
            throw new BadRequestException(
                    "L'inscription en tant qu'administrateur n'est pas autorisée.");
        }

        // Création et persistance du nouvel utilisateur (non vérifié)
        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .plan(PlanEnum.FREE)
                .emailVerified(false)
                .build();

        User saved = userRepository.save(user);

        String code = otpService.generateAndSaveOtp(saved, TYPE_EMAIL_VERIFICATION);
        emailService.sendOtpEmail(saved.getEmail(), saved.getFullName(), code, TYPE_EMAIL_VERIFICATION);

        return buildJwtResponse(null, saved);
    }

    // ------------------------------------------------------------------ //
    //  Vérification d'e-mail                                               //
    // ------------------------------------------------------------------ //

    /**
     * {@inheritDoc}
     *
     * @throws BadRequestException si l'e-mail est déjà vérifié ou si le code
     *                             OTP est invalide, expiré ou épuisé
     */
    @Override
    @Transactional
    public JwtResponse verifyEmail(VerifyOtpRequest request) {
        User user = findUserOrThrow(request.getEmail());

        if (user.isEmailVerified()) {
            throw new BadRequestException("Email déjà vérifié.");
        }

        otpService.validateOtp(user, request.getCode(), TYPE_EMAIL_VERIFICATION);

        user.setEmailVerified(true);
        userRepository.save(user);

        Authentication auth = new UsernamePasswordAuthenticationToken(
                user.getEmail(),
                null,
                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
        );
        String token = jwtTokenProvider.generateToken(auth);

        return buildJwtResponse(token, user);
    }

    // ------------------------------------------------------------------ //
    //  Renvoi de code OTP                                                  //
    // ------------------------------------------------------------------ //

    /**
     * {@inheritDoc}
     *
     * @throws BadRequestException si l'email est déjà vérifié (pour le type
     *                             {@code EMAIL_VERIFICATION}) ou si le cooldown
     *                             de renvoi n'est pas écoulé
     */
    @Override
    @Transactional
    public MessageResponse resendOtp(ResendOtpRequest request) {
        User user = findUserOrThrow(request.getEmail());

        if (TYPE_EMAIL_VERIFICATION.equals(request.getType()) && user.isEmailVerified()) {
            throw new BadRequestException("Email déjà vérifié.");
        }

        otpService.checkResendAllowed(user);

        String code = otpService.generateAndSaveOtp(user, request.getType());
        emailService.sendOtpEmail(user.getEmail(), user.getFullName(), code, request.getType());

        return MessageResponse.builder().message("Un nouveau code a été envoyé à votre email.").build();
    }

    // ------------------------------------------------------------------ //
    //  Mot de passe oublié / réinitialisation                              //
    // ------------------------------------------------------------------ //

    /**
     * {@inheritDoc}
     *
     * <p>Retourne toujours le même message de succès, que l'e-mail existe ou
     * non, pour éviter qu'un attaquant ne puisse déterminer si une adresse
     * est enregistrée sur la plateforme.
     */
    @Override
    @Transactional
    public MessageResponse forgotPassword(ForgotPasswordRequest request) {
        userRepository.findByEmail(request.getEmail()).ifPresent(user -> {
            String code = otpService.generateAndSaveOtp(user, TYPE_PASSWORD_RESET);
            emailService.sendOtpEmail(user.getEmail(), user.getFullName(), code, TYPE_PASSWORD_RESET);
        });

        return MessageResponse.builder().message("Si cet email existe, un code a été envoyé.").build();
    }

    /**
     * {@inheritDoc}
     *
     * @throws BadRequestException si le code OTP est invalide, expiré ou épuisé
     */
    @Override
    @Transactional
    public MessageResponse resetPassword(ResetPasswordRequest request) {
        User user = findUserOrThrow(request.getEmail());

        otpService.validateOtp(user, request.getCode(), TYPE_PASSWORD_RESET);

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        return MessageResponse.builder().message("Mot de passe réinitialisé avec succès.").build();
    }

    // ------------------------------------------------------------------ //
    //  Helpers privés                                                       //
    // ------------------------------------------------------------------ //

    private User findUserOrThrow(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", "email", email));
    }

    /**
     * Construit un {@link JwtResponse} à partir d'un token (peut être
     * {@code null} pour un compte pas encore vérifié) et d'une entité User.
     * Centralisé pour garantir la cohérence entre login, register et verifyEmail.
     */
    private JwtResponse buildJwtResponse(String token, User user) {
        return JwtResponse.builder()
                .token(token)
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .plan(user.getPlan().name())
                .emailVerified(user.isEmailVerified())
                .build();
    }
}
