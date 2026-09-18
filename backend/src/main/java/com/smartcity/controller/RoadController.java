package com.smartcity.controller;

import com.smartcity.dto.RoadDTO;
import com.smartcity.service.TrafficService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/roads")
public class RoadController {

    private final TrafficService trafficService;

    public RoadController(TrafficService trafficService) {
        this.trafficService = trafficService;
    }

    @GetMapping
    public ResponseEntity<List<RoadDTO>> getAllRoads() {
        return ResponseEntity.ok(trafficService.getAllRoads());
    }

    @PutMapping("/{id}/block")
    public ResponseEntity<RoadDTO> blockRoad(@PathVariable String id) {
        return ResponseEntity.ok(trafficService.blockRoad(id));
    }

    @PutMapping("/{id}/restore")
    public ResponseEntity<RoadDTO> restoreRoad(@PathVariable String id) {
        return ResponseEntity.ok(trafficService.restoreRoad(id));
    }
}
