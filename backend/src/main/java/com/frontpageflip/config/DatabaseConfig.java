package com.frontpageflip.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;

/**
 * Robust database configuration for Aiven MySQL Cloud database.
 * Handles standard JDBC URLs as well as Render / Aiven URI formats (mysql://user:pass@host:port/db).
 * Enforces SSL connection parameters (sslMode=REQUIRED, useSSL=true, requireSSL=true).
 */
@Configuration
public class DatabaseConfig {

    private static final Logger log = LoggerFactory.getLogger(DatabaseConfig.class);

    @Value("${spring.datasource.url:}")
    private String configuredUrl;

    @Value("${spring.datasource.username:avnadmin}")
    private String configuredUsername;

    @Value("${spring.datasource.password:}")
    private String configuredPassword;

    @Bean
    @Primary
    public DataSource dataSource() {
        String rawUrl = getFirstEnv("SPRING_DATASOURCE_URL", "DATABASE_URL", "AIVEN_MYSQL_URL", "MYSQL_URL");
        if (rawUrl == null || rawUrl.isBlank()) {
            rawUrl = configuredUrl;
        }

        HikariConfig config = new HikariConfig();
        config.setDriverClassName("com.mysql.cj.jdbc.Driver");

        String username = getFirstEnv("DB_USERNAME", "DB_USER", "SPRING_DATASOURCE_USERNAME", "AIVEN_USER", "MYSQL_USER");
        if (username == null || username.isBlank()) username = configuredUsername;

        String password = getFirstEnv("DB_PASSWORD", "DB_PASS", "SPRING_DATASOURCE_PASSWORD", "AIVEN_PASSWORD", "MYSQL_PASSWORD");
        if (password == null) password = configuredPassword;

        String jdbcUrl;

        // Check if raw URL is in URI format: mysql://user:pass@host:port/dbname or mysqls://...
        if (rawUrl != null && (rawUrl.startsWith("mysql://") || rawUrl.startsWith("mysqls://"))) {
            try {
                // Parse standard URI
                String sanitized = rawUrl.replaceFirst("^mysqls?://", "http://");
                URI uri = URI.create(sanitized);

                String host = uri.getHost();
                int port = uri.getPort() != -1 ? uri.getPort() : 3306;
                String path = uri.getPath();
                String dbName = (path != null && path.length() > 1) ? path.substring(1) : "defaultdb";
                if (dbName.contains("?")) {
                    dbName = dbName.substring(0, dbName.indexOf('?'));
                }

                if (uri.getUserInfo() != null) {
                    String[] parts = uri.getUserInfo().split(":", 2);
                    if (parts.length > 0 && !parts[0].isBlank()) {
                        username = java.net.URLDecoder.decode(parts[0], java.nio.charset.StandardCharsets.UTF_8);
                    }
                    if (parts.length > 1) {
                        password = java.net.URLDecoder.decode(parts[1], java.nio.charset.StandardCharsets.UTF_8);
                    }
                }

                jdbcUrl = buildJdbcUrl(host, port, dbName);
                log.info("Parsed Aiven MySQL URI into JDBC format for {}:{}/{}", host, port, dbName);
            } catch (Exception e) {
                log.warn("URI parsing failed ({}), converting scheme directly to jdbc:mysql://", e.getMessage());
                String converted = rawUrl.replaceFirst("^mysqls?://", "jdbc:mysql://");
                jdbcUrl = ensureSslParams(converted);
            }
        } else if (rawUrl != null && rawUrl.startsWith("jdbc:mysql://")) {
            jdbcUrl = ensureSslParams(rawUrl);
        } else {
            String host = getFirstEnv("DB_HOST", "AIVEN_HOST", "MYSQL_HOST");
            if (host == null || host.isBlank()) host = "localhost";

            String portStr = getFirstEnv("DB_PORT", "AIVEN_PORT", "MYSQL_PORT");
            int port = 3306;
            if (portStr != null && !portStr.isBlank()) {
                try { port = Integer.parseInt(portStr.trim()); } catch (NumberFormatException ignored) {}
            }

            String db = getFirstEnv("DB_NAME", "AIVEN_DATABASE", "MYSQL_DATABASE");
            if (db == null || db.isBlank()) db = "defaultdb";

            jdbcUrl = buildJdbcUrl(host, port, db);
        }

        config.setJdbcUrl(jdbcUrl);
        config.setUsername(username);
        config.setPassword(password);

        // Connection pool settings optimized for Aiven MySQL Cloud & Render starter/free tiers
        config.setMaximumPoolSize(8);
        config.setMinimumIdle(1);
        config.setIdleTimeout(300000); // 5 minutes
        config.setConnectionTimeout(25000); // 25 seconds
        config.setMaxLifetime(900000); // 15 minutes (avoids cloud NAT idle cutoffs)
        config.setKeepaliveTime(60000); // 60 seconds keep-alive to keep connection alive through cloud firewalls
        config.setConnectionTestQuery("/* ping */ SELECT 1");
        config.setValidationTimeout(5000);
        config.setInitializationFailTimeout(-1); // Resilient startup on cloud cold starts

        return new HikariDataSource(config);
    }

    private String getFirstEnv(String... names) {
        for (String name : names) {
            String val = System.getenv(name);
            if (val != null && !val.isBlank()) {
                return val.trim();
            }
        }
        return null;
    }

    private String buildJdbcUrl(String host, int port, String dbName) {
        return "jdbc:mysql://" + host + ":" + port + "/" + dbName
                + "?sslMode=REQUIRED&useSSL=true&requireSSL=true&verifyServerCertificate=false&allowPublicKeyRetrieval=true&serverTimezone=UTC&connectTimeout=15000&socketTimeout=60000&autoReconnect=true";
    }

    private String ensureSslParams(String url) {
        if (!url.contains("sslMode=") && !url.contains("useSSL=")) {
            String sep = url.contains("?") ? "&" : "?";
            return url + sep + "sslMode=REQUIRED&useSSL=true&requireSSL=true&verifyServerCertificate=false&allowPublicKeyRetrieval=true&serverTimezone=UTC&connectTimeout=15000&socketTimeout=60000&autoReconnect=true";
        }
        return url;
    }
}
