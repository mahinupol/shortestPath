package com.smartcity.repository;

import com.smartcity.entity.EmergencyEventEntity;
import com.smartcity.model.enums.EmergencyStatus;
import com.smartcity.model.enums.EmergencyType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmergencyEventRepository extends JpaRepository<EmergencyEventEntity, String> {
    List<EmergencyEventEntity> findByStatus(EmergencyStatus status);
    List<EmergencyEventEntity> findByType(EmergencyType type);
    List<EmergencyEventEntity> findTop20ByOrderByStartTimeEpochDesc();
}
