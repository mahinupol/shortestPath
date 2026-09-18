package com.smartcity.repository;

import com.smartcity.entity.IntersectionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IntersectionRepository extends JpaRepository<IntersectionEntity, String> {
    List<IntersectionEntity> findByType(String type);
    List<IntersectionEntity> findByDistrict(String district);
}
