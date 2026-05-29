package com.sgp.systemsgp.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.util.Map;

public class DebugPropertySanitizer implements EnvironmentPostProcessor, Ordered {

    private static final String PROPERTY_SOURCE_NAME = "sgpDebugPropertySanitizer";

    @Override
    public void postProcessEnvironment(
            ConfigurableEnvironment environment,
            SpringApplication application) {

        String springDebug = environment.getProperty("spring.debug");

        if (isBoolean(springDebug)) {
            setDebug(environment, springDebug);
            return;
        }

        String debug = environment.getProperty("debug");

        if (debug != null && !isBoolean(debug)) {
            setDebug(environment, "false");
        }
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }

    private void setDebug(
            ConfigurableEnvironment environment,
            String value) {

        environment.getPropertySources().addFirst(new MapPropertySource(
                PROPERTY_SOURCE_NAME,
                Map.of("debug", value)));
    }

    private boolean isBoolean(String value) {
        return "true".equalsIgnoreCase(value)
                || "false".equalsIgnoreCase(value);
    }
}
