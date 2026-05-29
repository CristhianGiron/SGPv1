package com.sgp.systemsgp.enums;

public enum ActivityEvaluationLevel {

    BAJO(1),
    MEDIO(2),
    ALTO(3);

    private final int score;

    ActivityEvaluationLevel(int score) {

        this.score = score;
    }

    public int getScore() {

        return score;
    }
}
