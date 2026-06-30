package com.example.quizplatforme.Config;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.util.StringUtils;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Configuration Spring Security — JWT stateless.
 *
 * Responsabilités :
 *   1. Politique CORS unique pour tout le backend (pas de @CrossOrigin sur les controllers)
 *   2. Règles d'autorisation par endpoint
 *   3. Gestionnaires d'erreur 401/403 en JSON avec en-têtes CORS
 *      (Spring Security court-circuite les filtres CORS sur les erreurs d'auth
 *       si on n'ajoute pas manuellement les en-têtes ici)
 */
@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private static final Logger log = LoggerFactory.getLogger(SecurityConfig.class);

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // ── Gestionnaires d'erreur 401 / 403 ─────────────────────────
                // Configurés ici car Spring Security traite ces erreurs au niveau
                // des filtres, AVANT que @RestControllerAdvice ne soit atteint.
                // Sans ces handlers, le navigateur voit une erreur CORS au lieu
                // d'un vrai 401/403 (les en-têtes CORS ne sont pas encore présents).
                .exceptionHandling(ex -> ex

                        // 401 — non authentifié : token absent ou expiré
                        .authenticationEntryPoint((request, response, authException) -> {
                            log.debug("Requête non authentifiée vers : {}", request.getRequestURI());
                            writeErrorJson(
                                    response,
                                    request.getHeader("Origin"),
                                    HttpServletResponse.SC_UNAUTHORIZED,
                                    "Authentification requise. Veuillez vous connecter."
                            );
                        })

                        // 403 — authentifié mais rôle insuffisant
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            log.warn("Accès refusé — utilisateur sans le rôle requis pour : {}",
                                    request.getRequestURI());
                            writeErrorJson(
                                    response,
                                    request.getHeader("Origin"),
                                    HttpServletResponse.SC_FORBIDDEN,
                                    "Accès refusé. Vous n'avez pas les droits nécessaires pour effectuer cette action."
                            );
                        })
                )

                // ── Règles d'autorisation ─────────────────────────────────────
                .authorizeHttpRequests(auth -> auth

                        // Endpoints système
                        .requestMatchers("/error").permitAll()
                        .requestMatchers("/actuator/health").permitAll()

                        // Authentification — public
                        .requestMatchers("/api/auth/**").permitAll()

                        // Exécution de code — STUDENT et PROF autorisés
                        // (PROF doit pouvoir utiliser l'éditeur standalone)
                        .requestMatchers("/api/code/execute").hasAnyRole("STUDENT", "PROF")
                        .requestMatchers("/api/code/history").hasAnyRole("STUDENT", "PROF")

                        // Sessions — ordre du plus spécifique au plus général
                        .requestMatchers("/api/sessions/create").hasRole("PROF")
                        .requestMatchers("/api/sessions/my").hasRole("PROF")
                        .requestMatchers("/api/sessions/join/**").hasRole("STUDENT")
                        .requestMatchers(HttpMethod.POST, "/api/sessions/*/submit").hasRole("STUDENT")
                        .requestMatchers(HttpMethod.GET,  "/api/sessions/*/submissions").hasRole("PROF")
                        .requestMatchers(HttpMethod.POST, "/api/sessions/*/duplicate").hasRole("PROF")

                        // Quiz endpoints — most-specific first
                        .requestMatchers(HttpMethod.POST, "/api/sessions/*/quiz/create").hasRole("PROF")
                        .requestMatchers(HttpMethod.POST, "/api/sessions/*/quiz/generate-from-pdf").hasRole("PROF")
                        .requestMatchers(HttpMethod.GET,  "/api/sessions/*/quiz/attempts").hasRole("PROF")
                        .requestMatchers(HttpMethod.POST, "/api/sessions/*/quiz/submit").hasRole("STUDENT")
                        .requestMatchers(HttpMethod.GET,  "/api/sessions/*/quiz/leaderboard").authenticated()
                        .requestMatchers(HttpMethod.GET,  "/api/sessions/*/quiz").authenticated()

                        .requestMatchers("/api/sessions/**").authenticated()

                        // PDF — authentifié requis (évite l'abus de l'API Groq sans compte)
                        .requestMatchers("/api/pdf/**").authenticated()

                        // Utilisateurs — /me est pour l'utilisateur connecté, /** est admin
                        .requestMatchers("/api/users/me").authenticated()
                        .requestMatchers("/api/users/**").hasRole("ADMIN")

                        // Administration
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")

                        // Professeur
                        .requestMatchers("/api/prof/**").hasRole("PROF")

                        // Intelligence artificielle
                        .requestMatchers("/api/ai/**").authenticated()

                        // Tout le reste requiert une authentification
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // ── CORS ─────────────────────────────────────────────────────────────────────

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        config.setAllowedOrigins(List.of(
                "http://localhost:4200",   // Angular dev (ng serve — frontend actuel)
                "http://localhost:3000",   // production / build React
                "http://localhost:5173",   // Vite dev (port par défaut)
                "http://localhost:5174"    // Vite dev (port de secours)
        ));
        config.setAllowedMethods(List.of(
                "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"
        ));
        config.setAllowedHeaders(List.of("*"));
        config.setExposedHeaders(List.of("Authorization", "Content-Disposition"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    // ── Beans Spring Security ────────────────────────────────────────────────────

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    // ── Helper privé ─────────────────────────────────────────────────────────────

    /**
     * Écrit une réponse d'erreur JSON uniforme pour les cas 401 et 403.
     *
     * Les en-têtes CORS sont ré-appliqués manuellement car à ce stade de la
     * chaîne de filtres, le CorsFilter a déjà été exécuté mais la réponse n'a
     * pas encore ses en-têtes d'accès — sans ça, le navigateur voit un échec CORS
     * plutôt que le vrai code HTTP d'erreur.
     *
     * @param response réponse HTTP sortante
     * @param origin   valeur de l'en-tête Origin de la requête (peut être null)
     * @param status   code HTTP (401 ou 403)
     * @param message  message d'erreur en français
     */
    private void writeErrorJson(HttpServletResponse response,
                                String origin,
                                int status,
                                String message) throws IOException {

        // Ré-applique les en-têtes CORS pour que le navigateur reçoive le vrai code HTTP
        if (StringUtils.hasText(origin)) {
            response.setHeader("Access-Control-Allow-Origin", origin);
            response.setHeader("Access-Control-Allow-Credentials", "true");
            response.setHeader("Vary", "Origin");
        }

        response.setStatus(status);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        // Format identique à ErrorResponse pour la cohérence côté frontend
        String body = String.format(
                "{\"status\":%d,\"message\":\"%s\",\"dateTime\":\"%s\"}",
                status,
                message,
                LocalDateTime.now()
        );
        response.getWriter().write(body);
    }
}
