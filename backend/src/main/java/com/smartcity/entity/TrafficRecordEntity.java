package com.smartcity.entity;

import com.smartcity.model.enums.TrafficLevel;
import jakarta.persistence.*;

@Entity
@Table(name = "traffic_records")
public class TrafficRecordEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String roadId;

    @Enumerated(EnumType.STRING)
    private TrafficLevel trafficLevel;

    private double congestionIndex;
    private long recordedAtEpoch;

    public TrafficRecordEntity() {
    }

    public TrafficRecordEntity(String roadId, TrafficLevel trafficLevel, double congestionIndex, long recordedAtEpoch) {
        this.roadId = roadId;
        this.trafficLevel = trafficLevel;
        this.congestionIndex = congestionIndex;
        this.recordedAtEpoch = recordedAtEpoch;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getRoadId() {
        return roadId;
    }

    public void setRoadId(String roadId) {
        this.roadId = roadId;
    }

    public TrafficLevel getTrafficLevel() {
        return trafficLevel;
    }

    public void setTrafficLevel(TrafficLevel trafficLevel) {
        this.trafficLevel = trafficLevel;
    }

    public double getCongestionIndex() {
        return congestionIndex;
    }

    public void setCongestionIndex(double congestionIndex) {
        this.congestionIndex = congestionIndex;
    }

    public long getRecordedAtEpoch() {
        return recordedAtEpoch;
    }

    public void setRecordedAtEpoch(long recordedAtEpoch) {
        this.recordedAtEpoch = recordedAtEpoch;
    }
}
