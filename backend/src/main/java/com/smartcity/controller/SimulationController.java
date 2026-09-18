package com.smartcity.controller;

import com.smartcity.dto.SimulationControlRequest;
import com.smartcity.dto.SimulationStateDTO;
import com.smartcity.service.SimulationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/simulation")
public class SimulationController {

    private final SimulationService simulationService;

    public SimulationController(SimulationService simulationService) {
        this.simulationService = simulationService;
    }

    @GetMapping("/state")
    public ResponseEntity<SimulationStateDTO> getSimulationState() {
        return ResponseEntity.ok(simulationService.getSimulationState());
    }

    @PostMapping("/control")
    public ResponseEntity<SimulationStateDTO> controlSimulation(@RequestBody SimulationControlRequest request) {
        return ResponseEntity.ok(simulationService.handleControlAction(request));
    }

    @PostMapping("/start")
    public ResponseEntity<SimulationStateDTO> startSimulation() {
        return ResponseEntity.ok(simulationService.handleControlAction(new SimulationControlRequest("START", null)));
    }

    @PostMapping("/pause")
    public ResponseEntity<SimulationStateDTO> pauseSimulation() {
        return ResponseEntity.ok(simulationService.handleControlAction(new SimulationControlRequest("PAUSE", null)));
    }

    @PostMapping("/resume")
    public ResponseEntity<SimulationStateDTO> resumeSimulation() {
        return ResponseEntity.ok(simulationService.handleControlAction(new SimulationControlRequest("RESUME", null)));
    }

    @PostMapping("/reset")
    public ResponseEntity<SimulationStateDTO> resetSimulation() {
        return ResponseEntity.ok(simulationService.handleControlAction(new SimulationControlRequest("RESET", null)));
    }

    @PostMapping("/speed/{multiplier}")
    public ResponseEntity<SimulationStateDTO> setSpeed(@PathVariable double multiplier) {
        return ResponseEntity.ok(simulationService.handleControlAction(new SimulationControlRequest(null, multiplier)));
    }

    @PostMapping("/tick")
    public ResponseEntity<SimulationStateDTO> manualTick() {
        return ResponseEntity.ok(simulationService.handleControlAction(new SimulationControlRequest("STEP", null)));
    }
}
