package com.smartcity.controller;

import com.smartcity.dto.RoadDTO;
import com.smartcity.model.enums.TrafficLevel;
import com.smartcity.service.TrafficService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/traffic")
public class TrafficController {

    private final TrafficService trafficService;

    public TrafficController(TrafficService trafficService) {
        this.trafficService = trafficService;
    }

    @PutMapping("/{roadId}")
    public ResponseEntity<RoadDTO> updateTraffic(@PathVariable String roadId, @RequestBody Map<String, String> body) {
        String levelStr = body.getOrDefault("trafficLevel", "LOW");
        TrafficLevel level;
        try {
            level = TrafficLevel.valueOf(levelStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            level = TrafficLevel.LOW;
        }
        return ResponseEntity.ok(trafficService.updateTraffic(roadId, level));
    }

    @PostMapping("/accident")
    public ResponseEntity<RoadDTO> simulateAccident() {
        return ResponseEntity.ok(trafficService.simulateAccident());
    }

    @PostMapping("/rush-hour")
    public ResponseEntity<Map<String, String>> simulateRushHour() {
        trafficService.generateRushHourTraffic();
        return ResponseEntity.ok(Map.of("message", "Rush hour traffic conditions simulated successfully."));
    }
}
