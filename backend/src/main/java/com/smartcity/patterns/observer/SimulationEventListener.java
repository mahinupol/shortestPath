package com.smartcity.patterns.observer;

/**
 * Observer interface for listening to simulation lifecycle and telemetry events.
 */
public interface SimulationEventListener {
    void onSimulationEvent(String eventType, String message, Object payload);
}
