package com.smartcity.patterns.observer;

import com.smartcity.model.enums.TrafficLevel;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Subject implementation managing registered TrafficObservers.
 */
public class TrafficSubject {
    private final List<TrafficObserver> observers = new CopyOnWriteArrayList<>();

    public void registerObserver(TrafficObserver observer) {
        if (observer != null && !observers.contains(observer)) {
            observers.add(observer);
        }
    }

    public void removeObserver(TrafficObserver observer) {
        observers.remove(observer);
    }

    public void notifyTrafficChanged(String roadId, TrafficLevel oldLevel, TrafficLevel newLevel, boolean isBlocked) {
        for (TrafficObserver observer : observers) {
            observer.onTrafficChanged(roadId, oldLevel, newLevel, isBlocked);
        }
    }
}
