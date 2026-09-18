package com.smartcity.repository;

import com.smartcity.entity.TrafficRecordEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TrafficRecordRepository extends JpaRepository<TrafficRecordEntity, Long> {
    List<TrafficRecordEntity> findTop50ByOrderByRecordedAtEpochDesc();
    List<TrafficRecordEntity> findByRoadIdOrderByRecordedAtEpochDesc(String roadId);
}
