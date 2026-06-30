package com.example.quizplatforme.Config;

import com.example.quizplatforme.Service.CustomUserDetailsService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filtre JWT exécuté une seule fois par requête HTTP.
 *
 * Extrait le token Bearer depuis l'en-tête Authorization, le valide,
 * charge les détails de l'utilisateur et initialise le contexte de
 * sécurité Spring Security.
 *
 * Règles de journalisation :
 *   - Le token brut n'est JAMAIS loggé (risque de vol de session)
 *   - L'email est loggé uniquement au niveau DEBUG (désactivé en production)
 *   - Les erreurs techniques sont loggées au niveau WARN
 */
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final JwtTokenProvider jwtProvider;
    private final CustomUserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String token = getTokenFromRequest(request);

        if (StringUtils.hasText(token) && jwtProvider.validateToken(token)) {
            try {
                String email = jwtProvider.getEmailFromToken(token);
                UserDetails userDetails = userDetailsService.loadUserByUsername(email);

                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,
                                userDetails.getAuthorities()
                        );

                SecurityContextHolder.getContext().setAuthentication(authToken);

                // Email loggé en DEBUG uniquement — jamais le token lui-même
                log.debug("JWT authentication processed for user: {}", email);

            } catch (Exception ex) {
                // Un token valide syntaxiquement mais dont l'utilisateur n'existe
                // plus en base produit ici une UsernameNotFoundException.
                log.warn("JWT authentication failed for request [{}]: {}",
                        request.getRequestURI(), ex.getMessage());
                SecurityContextHolder.clearContext();
            }

        } else {
            // Absence ou invalidité du token : normal pour les endpoints publics
            log.debug("No valid JWT token found for request: {}", request.getRequestURI());
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Extrait le token JWT depuis l'en-tête Authorization.
     * Retourne {@code null} si l'en-tête est absent ou mal formé.
     *
     * @param request requête HTTP entrante
     * @return le token JWT brut, ou {@code null}
     */
    private String getTokenFromRequest(HttpServletRequest request) {
        String bearer = request.getHeader("Authorization");
        if (StringUtils.hasText(bearer) && bearer.startsWith("Bearer ")) {
            return bearer.substring(7);
        }
        return null;
    }
}
