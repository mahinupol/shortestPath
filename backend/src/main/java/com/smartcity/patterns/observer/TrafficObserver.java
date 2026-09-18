package com.smartcity.patterns.observer;

import com.smartcity.model.enums.TrafficLevel;

/**
 * Observer interface for components that react to road traffic and blockage updates.
 */
public interface TrafficObserver {
    void onTrafficChanged(String roadId, TrafficLevel oldLevel, TrafficLevel newLevel, boolean isBlocked);
}
