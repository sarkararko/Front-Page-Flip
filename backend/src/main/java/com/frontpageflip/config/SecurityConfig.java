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
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> {})
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Public authentication endpoints
                        .requestMatchers(
                                "/api/auth/student/login",
                                "/api/auth/student/register",
                                "/api/auth/admin/login",
                                "/api/auth/admin/setup",
                                "/api/auth/verify-email",
                                "/actuator/health",
                                "/actuator/info"
                        ).permitAll()

                        // Subject & PDF read access for authenticated users
                        .requestMatchers(HttpMethod.GET, "/api/subjects/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/pdfs/**").authenticated()

                        // Strict Admin-Only Content Management operations
                        .requestMatchers(HttpMethod.POST, "/api/subjects/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/subjects/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/subjects/**").hasRole("ADMIN")

                        .requestMatchers(HttpMethod.POST, "/api/pdfs/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/pdfs/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/pdfs/**").hasRole("ADMIN")

                        .requestMatchers("/api/admin/**").hasRole("ADMIN")

                        // Authenticated student library operations
                        .requestMatchers("/api/library/**").authenticated()
                        .requestMatchers("/api/auth/me").authenticated()

                        // Any other request must be authenticated
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
