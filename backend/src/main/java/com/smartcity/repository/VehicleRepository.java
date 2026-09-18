package com.smartcity.repository;

import com.smartcity.entity.VehicleEntity;
import com.smartcity.model.enums.VehicleType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VehicleRepository extends JpaRepository<VehicleEntity, String> {
    List<VehicleEntity> findByType(VehicleType type);
    List<VehicleEntity> findByActive(boolean active);
}
