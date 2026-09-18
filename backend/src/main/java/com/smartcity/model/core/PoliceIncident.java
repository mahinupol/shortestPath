package com.smartcity.model.core;

import com.smartcity.model.enums.EmergencyType;

/**
 * Concrete Emergency: Security, Public Safety, or Traffic Collisions.
 */
public class PoliceIncident extends AbstractEmergency {

    public PoliceIncident(String id, String title, String description,
                          String policeStationNodeId, String incidentNodeId) {
        super(id, EmergencyType.POLICE, title, description, policeStationNodeId, incidentNodeId);
    }

    @Override
    public int getSeverityWeight() {
        return 8; // High security priority
    }
}
