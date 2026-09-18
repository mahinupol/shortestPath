package com.smartcity.model.core;

import com.smartcity.model.enums.TrafficLightState;

/**
 * Encapsulates traffic light state machine at an intersection with emergency green wave preemption.
 */
public class TrafficLight {
    private String intersectionId;
    private TrafficLightState state;
    private double timerSeconds;
    private double greenDuration;
    private double yellowDuration;
    private double redDuration;
    private boolean emergencyOverride;
    private double overrideTimer;

    public TrafficLight(String intersectionId, TrafficLightState initialState,
                        double greenDuration, double yellowDuration, double redDuration) {
        this.intersectionId = intersectionId;
        this.state = initialState != null ? initialState : TrafficLightState.GREEN;
        this.greenDuration = greenDuration > 0 ? greenDuration : 10.0;
        this.yellowDuration = yellowDuration > 0 ? yellowDuration : 3.0;
        this.redDuration = redDuration > 0 ? redDuration : 8.0;
        this.timerSeconds = 0.0;
        this.emergencyOverride = false;
        this.overrideTimer = 0.0;
    }

    /**
     * Cycles the traffic signal timer or maintains emergency green wave.
     */
    public void tick(double deltaSeconds) {
        if (emergencyOverride) {
            overrideTimer -= deltaSeconds;
            if (overrideTimer <= 0) {
                emergencyOverride = false;
                state = TrafficLightState.YELLOW;
                timerSeconds = 0.0;
            } else {
                state = TrafficLightState.GREEN;
                return;
            }
        }

        timerSeconds += deltaSeconds;

        switch (state) {
            case GREEN -> {
                if (timerSeconds >= greenDuration) {
                    state = TrafficLightState.YELLOW;
                    timerSeconds = 0.0;
                }
            }
            case YELLOW -> {
                if (timerSeconds >= yellowDuration) {
                    state = TrafficLightState.RED;
                    timerSeconds = 0.0;
                }
            }
            case RED -> {
                if (timerSeconds >= redDuration) {
                    state = TrafficLightState.GREEN;
                    timerSeconds = 0.0;
                }
            }
        }
    }

    /**
     * Preempts signal: immediately forces GREEN for approaching emergency vehicles.
     */
    public void preemptGreen(double durationSeconds) {
        this.state = TrafficLightState.GREEN;
        this.emergencyOverride = true;
        this.overrideTimer = durationSeconds > 0 ? durationSeconds : 12.0;
    }

    public void releasePreemption() {
        this.emergencyOverride = false;
        this.overrideTimer = 0.0;
    }

    public String getIntersectionId() {
        return intersectionId;
    }

    public void setIntersectionId(String intersectionId) {
        this.intersectionId = intersectionId;
    }

    public TrafficLightState getState() {
        return state;
    }

    public void setState(TrafficLightState state) {
        this.state = state;
    }

    public double getTimerSeconds() {
        return timerSeconds;
    }

    public boolean isEmergencyOverride() {
        return emergencyOverride;
    }
}
