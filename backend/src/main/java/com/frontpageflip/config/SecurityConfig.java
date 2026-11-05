package com.frontpageflip.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final OAuth2AuthenticationSuccessHandler oauth2SuccessHandler;
    private final OAuth2AuthenticationFailureHandler oauth2FailureHandler;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthFilter,
                          OAuth2AuthenticationSuccessHandler oauth2SuccessHandler,
                          OAuth2AuthenticationFailureHandler oauth2FailureHandler) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.oauth2SuccessHandler = oauth2SuccessHandler;
        this.oauth2FailureHandler = oauth2FailureHandler;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http,
                                                   ClientRegistrationRepository clientRegistrationRepository) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> {})
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Public authentication & OAuth endpoints (supports both /api/v1 and /api)
                        .requestMatchers(
                                "/api/auth/student/login",
                                "/api/v1/auth/student/login",
                                "/api/auth/student/register",
                                "/api/v1/auth/student/register",
                                "/api/auth/admin/login",
                                "/api/v1/auth/admin/login",
                                "/api/admin/login",
                                "/api/v1/admin/login",
                                "/api/auth/admin/setup",
                                "/api/v1/auth/admin/setup",
                                "/api/auth/verify-email",
                                "/api/v1/auth/verify-email",
                                "/api/auth/resend-verification",
                                "/api/v1/auth/resend-verification",
                                "/api/auth/forgot-password",
                                "/api/v1/auth/forgot-password",
                                "/api/auth/reset-password",
                                "/api/v1/auth/reset-password",
                                "/api/auth/google",
                                "/api/v1/auth/google",
                                "/api/auth/oauth-status",
                                "/api/v1/auth/oauth-status",
                                "/oauth2/**",
                                "/login/oauth2/**",
                                "/api/presence/active-students-count",
                                "/api/v1/presence/active-students-count",
                                "/api/presence/student-count",
                                "/api/v1/presence/student-count",
                                "/api/presence/count",
                                "/api/v1/presence/count",
                                "/api/presence/heartbeat",
                                "/api/v1/presence/heartbeat",
                                "/api/presence/logout",
                                "/api/v1/presence/logout",
                                "/actuator/health",
                                "/actuator/info",
                                // Public Golden membership pricing info
                                "/api/golden/status",
                                "/api/v1/golden/status",
                                // Razorpay Webhook (authenticated cryptographically via X-Razorpay-Signature header)
                                "/api/golden/webhook",
                                "/api/v1/golden/webhook",
                                "/api/webhook/razorpay",
                                "/api/v1/webhook/razorpay"
                        ).permitAll()

                        // Protected Golden order & payment verification (must be authenticated student or admin)
                        .requestMatchers(
                                "/api/create-order",
                                "/api/v1/create-order",
                                "/api/golden/create-order",
                                "/api/v1/golden/create-order",
                                "/api/verify-payment",
                                "/api/v1/verify-payment",
                                "/api/golden/verify-payment",
                                "/api/v1/golden/verify-payment"
                        ).authenticated()

                        // Protected Golden download endpoints (must be authenticated)
                        .requestMatchers(HttpMethod.GET, "/api/pdfs/*/download", "/api/v1/pdfs/*/download").authenticated()


                        // Subject & PDF read access - publicly visible for published notes across devices & browsers
                        .requestMatchers(HttpMethod.GET, "/api/subjects/**", "/api/v1/subjects/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/pdfs/**", "/api/v1/pdfs/**").permitAll()

                        // Strict Admin-Only Content Management operations
                        .requestMatchers(HttpMethod.POST, "/api/subjects/**", "/api/v1/subjects/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/subjects/**", "/api/v1/subjects/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/subjects/**", "/api/v1/subjects/**").hasRole("ADMIN")

                        .requestMatchers(HttpMethod.POST, "/api/pdfs/**", "/api/v1/pdfs/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/pdfs/**", "/api/v1/pdfs/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/pdfs/**", "/api/v1/pdfs/**").hasRole("ADMIN")

                        .requestMatchers("/api/admin/**", "/api/v1/admin/**").hasRole("ADMIN")

                        // Authenticated student library operations
                        .requestMatchers("/api/library/**", "/api/v1/library/**").authenticated()
                        .requestMatchers("/api/auth/me", "/api/v1/auth/me").authenticated()

                        // Any other request must be authenticated
                        .anyRequest().authenticated()
                )
                .exceptionHandling(exceptions -> exceptions
                        .defaultAuthenticationEntryPointFor(
                                new org.springframework.security.web.authentication.HttpStatusEntryPoint(org.springframework.http.HttpStatus.UNAUTHORIZED),
                                new org.springframework.security.web.util.matcher.AntPathRequestMatcher("/api/**")
                        )
                )
                .oauth2Login(oauth2 -> oauth2
                        .authorizationEndpoint(auth -> auth
                                .authorizationRequestResolver(new CustomOAuth2AuthorizationRequestResolver(
                                        clientRegistrationRepository,
                                        "/oauth2/authorization"
                                ))
                        )
                        .successHandler(oauth2SuccessHandler)
                        .failureHandler(oauth2FailureHandler)
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
