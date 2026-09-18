package com.smartcity.model.core;

import com.smartcity.model.enums.EmergencyType;

/**
 * Concrete Emergency: Medical Trauma / Cardiac / Critical Care.
 */
public class MedicalEmergency extends AbstractEmergency {

    public MedicalEmergency(String id, String title, String description,
                            String hospitalNodeId, String incidentNodeId) {
        super(id, EmergencyType.MEDICAL, title, description, hospitalNodeId, incidentNodeId);
    }

    @Override
    public int getSeverityWeight() {
        return 9; // High life-critical severity
    }
}
