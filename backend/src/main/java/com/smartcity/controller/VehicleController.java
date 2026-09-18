package com.smartcity.controller;

import com.smartcity.dto.VehicleDTO;
import com.smartcity.model.enums.VehicleType;
import com.smartcity.service.VehicleService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/vehicles")
public class VehicleController {

    private final VehicleService vehicleService;

    public VehicleController(VehicleService vehicleService) {
        this.vehicleService = vehicleService;
    }

    @GetMapping
    public ResponseEntity<List<VehicleDTO>> getAllVehicles() {
        return ResponseEntity.ok(vehicleService.getAllVehicles());
    }

    @GetMapping("/{id}")
    public ResponseEntity<VehicleDTO> getVehicleById(@PathVariable String id) {
        return ResponseEntity.ok(vehicleService.getVehicleById(id));
    }

    @PutMapping("/{id}/speed/{speed}")
    public ResponseEntity<VehicleDTO> updateVehicleSpeed(@PathVariable String id, @PathVariable double speed) {
        return ResponseEntity.ok(vehicleService.updateVehicleSpeed(id, speed));
    }

    @PostMapping
    public ResponseEntity<VehicleDTO> spawnVehicle(@RequestBody Map<String, String> request) {
        String typeStr = request.getOrDefault("type", "CAR");
        VehicleType type;
        try {
            type = VehicleType.valueOf(typeStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            type = VehicleType.CAR;
        }

        String startNodeId = request.getOrDefault("startNodeId", "N13");
        String targetNodeId = request.get("targetNodeId");

        VehicleDTO spawned = vehicleService.spawnVehicle(type, startNodeId, targetNodeId);
        return ResponseEntity.ok(spawned);
    }

    @PostMapping("/deploy")
    public ResponseEntity<com.smartcity.dto.VehicleDeployResponseDTO> deployVehicle(@RequestBody Map<String, Object> request) {
        String typeStr = request.containsKey("type") ? String.valueOf(request.get("type")) : "CAR";
        VehicleType type;
        try {
            type = VehicleType.valueOf(typeStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            type = VehicleType.CAR;
        }

        String startNodeId = request.containsKey("startNodeId") ? String.valueOf(request.get("startNodeId")) : "N1";
        String targetNodeId = request.containsKey("targetNodeId") ? String.valueOf(request.get("targetNodeId")) : "N25";
        String algorithm = request.containsKey("algorithm") ? String.valueOf(request.get("algorithm")) : "FASTEST";

        Double speed = null;
        if (request.containsKey("speed") && request.get("speed") != null) {
            try {
                speed = Double.parseDouble(String.valueOf(request.get("speed")));
            } catch (NumberFormatException ignored) {}
        }

        com.smartcity.dto.VehicleDeployResponseDTO response = vehicleService.deployVehicle(type, startNodeId, targetNodeId, algorithm, speed);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping
    public ResponseEntity<Map<String, Object>> clearVehicles() {
        vehicleService.clearAllVehicles();
        return ResponseEntity.ok(Map.of("message", "All vehicles successfully cleared.", "totalVehicles", 0));
    }
}
