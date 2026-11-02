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
        String rawUrl = System.getenv("SPRING_DATASOURCE_URL");
        if (rawUrl == null || rawUrl.isBlank()) {
            rawUrl = System.getenv("DATABASE_URL");
        }
        if (rawUrl == null || rawUrl.isBlank()) {
            rawUrl = configuredUrl;
        }

        HikariConfig config = new HikariConfig();
        config.setDriverClassName("com.mysql.cj.jdbc.Driver");

        // Check if raw URL is in URI format mysql://user:pass@host:port/dbname
        if (rawUrl != null && rawUrl.startsWith("mysql://")) {
            try {
                URI uri = URI.create(rawUrl);
                String host = uri.getHost();
                int port = uri.getPort() != -1 ? uri.getPort() : 3306;
                String path = uri.getPath();
                String dbName = (path != null && path.length() > 1) ? path.substring(1) : "defaultdb";

                String jdbcUrl = "jdbc:mysql://" + host + ":" + port + "/" + dbName
                        + "?sslMode=REQUIRED&useSSL=true&requireSSL=true&verifyServerCertificate=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";

                config.setJdbcUrl(jdbcUrl);

                if (uri.getUserInfo() != null) {
                    String[] parts = uri.getUserInfo().split(":", 2);
                    config.setUsername(parts[0]);
                    if (parts.length > 1) {
                        config.setPassword(parts[1]);
                    }
                } else {
                    config.setUsername(configuredUsername);
                    config.setPassword(configuredPassword);
                }

                log.info("Parsed Aiven MySQL URI format and established JDBC connection to {}:{}/{}", host, port, dbName);
            } catch (Exception e) {
                log.warn("Could not parse mysql:// URI, falling back to standard configuration: {}", e.getMessage());
                config.setJdbcUrl(rawUrl);
                config.setUsername(configuredUsername);
                config.setPassword(configuredPassword);
            }
        } else {
            String jdbcUrl = rawUrl;
            if (jdbcUrl == null || jdbcUrl.isBlank()) {
                String host = System.getenv("DB_HOST");
                if (host == null || host.isBlank()) host = "localhost";
                String port = System.getenv("DB_PORT");
                if (port == null || port.isBlank()) port = "3306";
                String db = System.getenv("DB_NAME");
                if (db == null || db.isBlank()) db = "defaultdb";

                jdbcUrl = "jdbc:mysql://" + host + ":" + port + "/" + db
                        + "?sslMode=REQUIRED&useSSL=true&requireSSL=true&verifyServerCertificate=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
            } else if (!jdbcUrl.contains("sslMode=") && !jdbcUrl.contains("useSSL=")) {
                String separator = jdbcUrl.contains("?") ? "&" : "?";
                jdbcUrl += separator + "sslMode=REQUIRED&useSSL=true&requireSSL=true&verifyServerCertificate=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
            }

            config.setJdbcUrl(jdbcUrl);

            String user = System.getenv("DB_USERNAME");
            if (user == null || user.isBlank()) user = configuredUsername;
            config.setUsername(user);

            String pass = System.getenv("DB_PASSWORD");
            if (pass == null) pass = configuredPassword;
            config.setPassword(pass);
        }

        // Connection pool settings optimized for Cloud MySQL & Render free/starter tiers
        config.setMaximumPoolSize(10);
        config.setMinimumIdle(2);
        config.setIdleTimeout(60000);
        config.setConnectionTimeout(30000);
        config.setMaxLifetime(1800000);

        return new HikariDataSource(config);
    }
}
