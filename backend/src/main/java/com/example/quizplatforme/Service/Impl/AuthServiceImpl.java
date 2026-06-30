package com.example.quizplatforme.Service.Impl;

import com.example.quizplatforme.Config.JwtTokenProvider;
import com.example.quizplatforme.DTO.Request.LoginRequest;
import com.example.quizplatforme.DTO.Request.RegisterRequest;
import com.example.quizplatforme.DTO.Response.JwtResponse;
import com.example.quizplatforme.Model.Entity.User;
import com.example.quizplatforme.Model.Enum.PlanEnum;
import com.example.quizplatforme.Model.Enum.RoleEnum;
import com.example.quizplatforme.Repository.UserRepository;
import com.example.quizplatforme.Service.IAuthServicelmpl;
import com.example.quizplatforme.exception.BadRequestException;
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

    private final UserRepository userRepository;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;

    // ------------------------------------------------------------------ //
    //  Connexion                                                           //
    // ------------------------------------------------------------------ //

    /**
     * Authentifie l'utilisateur via Spring Security, génère un JWT et
     * retourne les informations de l'utilisateur.
     *
     * @throws BadRequestException si les identifiants sont incorrects
     */
    @Override
    @Transactional(readOnly = true)
    public JwtResponse login(LoginRequest request) {
        // Délègue la vérification du mot de passe à Spring Security (BCrypt)
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        // L'email est le subject du JWT (auth.getName() = email)
        String token = jwtTokenProvider.generateToken(auth);

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadRequestException("Identifiants invalides."));

        return buildJwtResponse(token, user);
    }

    // ------------------------------------------------------------------ //
    //  Inscription                                                         //
    // ------------------------------------------------------------------ //

    /**
     * Crée un nouveau compte utilisateur, génère un JWT immédiatement
     * (auto-login) et retourne les informations de l'utilisateur.
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

        // Création et persistance du nouvel utilisateur
        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .plan(PlanEnum.FREE)
                .build();

        User saved = userRepository.save(user);

        // Génération du JWT directement depuis l'entité sauvegardée —
        // évite un appel supplémentaire à authenticationManager et une
        // requête DB supplémentaire (on a déjà l'utilisateur en mémoire).
        Authentication auth = new UsernamePasswordAuthenticationToken(
                saved.getEmail(),
                null,
                List.of(new SimpleGrantedAuthority("ROLE_" + saved.getRole().name()))
        );

        String token = jwtTokenProvider.generateToken(auth);
        return buildJwtResponse(token, saved);
    }

    // ------------------------------------------------------------------ //
    //  Helper privé                                                        //
    // ------------------------------------------------------------------ //

    /**
     * Construit un {@link JwtResponse} à partir d'un token et d'une entité User.
     * Centralisé pour garantir la cohérence entre login et register.
     */
    private JwtResponse buildJwtResponse(String token, User user) {
        return JwtResponse.builder()
                .token(token)
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .plan(user.getPlan().name())
                .build();
    }
}
