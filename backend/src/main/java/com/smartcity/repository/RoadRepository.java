package com.smartcity.repository;

import com.smartcity.entity.RoadEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RoadRepository extends JpaRepository<RoadEntity, String> {
    List<RoadEntity> findByBlocked(boolean blocked);
    List<RoadEntity> findBySourceNodeId(String sourceNodeId);
}
