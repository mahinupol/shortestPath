package com.smartcity.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "simulation_event_logs")
public class SimulationEventLogEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String eventType;

    @Column(nullable = false, length = 1000)
    private String message;

    private String entityId;
    private long timestampEpoch;

    public SimulationEventLogEntity() {
    }

    public SimulationEventLogEntity(String eventType, String message, String entityId, long timestampEpoch) {
        this.eventType = eventType;
        this.message = message;
        this.entityId = entityId;
        this.timestampEpoch = timestampEpoch;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getEntityId() {
        return entityId;
    }

    public void setEntityId(String entityId) {
        this.entityId = entityId;
    }

    public long getTimestampEpoch() {
        return timestampEpoch;
    }

    public void setTimestampEpoch(long timestampEpoch) {
        this.timestampEpoch = timestampEpoch;
    }
}
