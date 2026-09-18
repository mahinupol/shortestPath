package com.smartcity.controller;

import com.smartcity.dto.CreateEmergencyRequest;
import com.smartcity.dto.EmergencyResponseDTO;
import com.smartcity.service.EmergencyService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/emergencies")
public class EmergencyController {

    private final EmergencyService emergencyService;

    public EmergencyController(EmergencyService emergencyService) {
        this.emergencyService = emergencyService;
    }

    @GetMapping
    public ResponseEntity<List<EmergencyResponseDTO>> getAllEmergencies() {
        return ResponseEntity.ok(emergencyService.getAllEmergencies());
    }

    @GetMapping("/{id}")
    public ResponseEntity<EmergencyResponseDTO> getEmergencyById(@PathVariable String id) {
        return ResponseEntity.ok(emergencyService.getEmergencyById(id));
    }

    @PostMapping
    public ResponseEntity<EmergencyResponseDTO> createEmergency(@RequestBody CreateEmergencyRequest request) {
        return ResponseEntity.ok(emergencyService.dispatchEmergency(request));
    }

    @PostMapping("/{id}/resolve")
    public ResponseEntity<EmergencyResponseDTO> resolveEmergency(@PathVariable String id) {
        return ResponseEntity.ok(emergencyService.resolveEmergency(id));
    }
}
