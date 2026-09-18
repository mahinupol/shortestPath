package com.smartcity.model.core;

import com.smartcity.model.enums.EmergencyType;

/**
 * Concrete Emergency: Fire / Explosion / Hazardous Material Incident.
 */
public class FireEmergency extends AbstractEmergency {

    public FireEmergency(String id, String title, String description,
                         String fireStationNodeId, String incidentNodeId) {
        super(id, EmergencyType.FIRE, title, description, fireStationNodeId, incidentNodeId);
    }

    @Override
    public int getSeverityWeight() {
        return 10; // Extreme infrastructure and human life danger
    }
}
