package com.smartcity.patterns.factory;

import com.smartcity.model.core.*;
import com.smartcity.model.enums.EmergencyType;

/**
 * Factory Pattern implementation for polymorphic emergency instantiation.
 */
public class EmergencyFactory {

    public static AbstractEmergency createEmergency(EmergencyType type, String id, String title,
                                                    String description, String sourceNodeId, String targetNodeId) {
        if (type == null) {
            type = EmergencyType.MEDICAL;
        }

        return switch (type) {
            case MEDICAL -> new MedicalEmergency(id, title, description, sourceNodeId, targetNodeId);
            case FIRE -> new FireEmergency(id, title, description, sourceNodeId, targetNodeId);
            case POLICE -> new PoliceIncident(id, title, description, sourceNodeId, targetNodeId);
        };
    }
}
