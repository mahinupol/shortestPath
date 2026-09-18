package com.smartcity.repository;

import com.smartcity.entity.SimulationEventLogEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SimulationEventLogRepository extends JpaRepository<SimulationEventLogEntity, Long> {
    List<SimulationEventLogEntity> findTop50ByOrderByTimestampEpochDesc();
    List<SimulationEventLogEntity> findByEventTypeOrderByTimestampEpochDesc(String eventType);
}
