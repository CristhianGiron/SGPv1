package com.sgp.systemsgp.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "jwt")
public class JwtProperties {

    private String secret;

    private long expiration;
}

// Bash
// export JWT_SECRET='Qw7@xL9#zT2$kP8!mN4%vB1&sD6*fH3@jR5'
// export JWT_EXPIRATION=86400000