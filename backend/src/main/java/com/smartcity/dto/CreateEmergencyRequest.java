package com.smartcity.dto;

import com.smartcity.model.enums.EmergencyType;

public class CreateEmergencyRequest {
    private EmergencyType type;
    private String title;
    private String description;
    private String sourceNodeId; // Optional, auto-selects nearest suitable emergency depot if null
    private String targetNodeId; // Target incident intersection / building

    public CreateEmergencyRequest() {
    }

    public CreateEmergencyRequest(EmergencyType type, String title, String description,
                                  String sourceNodeId, String targetNodeId) {
        this.type = type;
        this.title = title;
        this.description = description;
        this.sourceNodeId = sourceNodeId;
        this.targetNodeId = targetNodeId;
    }

    public EmergencyType getType() {
        return type;
    }

    public void setType(EmergencyType type) {
        this.type = type;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getSourceNodeId() {
        return sourceNodeId;
    }

    public void setSourceNodeId(String sourceNodeId) {
        this.sourceNodeId = sourceNodeId;
    }

    public String getTargetNodeId() {
        return targetNodeId;
    }

    public void setTargetNodeId(String targetNodeId) {
        this.targetNodeId = targetNodeId;
    }
}
