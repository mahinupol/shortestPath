package com.smartcity.service;

import com.smartcity.dto.SimulationControlRequest;
import com.smartcity.dto.SimulationStateDTO;
import com.smartcity.simulation.SimulationEngine;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class SimulationService {

    private final SimulationEngine simulationEngine;
    private final CityService cityService;

    public SimulationService(SimulationEngine simulationEngine, CityService cityService) {
        this.simulationEngine = simulationEngine;
        this.cityService = cityService;
    }

    /**
     * Automatic background simulation tick running every second.
     */
    @Scheduled(fixedRate = 1000)
    public void backgroundTick() {
        simulationEngine.tick(1.0);
    }

    public SimulationStateDTO handleControlAction(SimulationControlRequest request) {
        if (request != null) {
            String action = request.getAction();
            if (action != null) {
                switch (action.toUpperCase()) {
                    case "START" -> simulationEngine.start();
                    case "PAUSE" -> simulationEngine.pause();
                    case "RESUME" -> simulationEngine.resume();
                    case "RESET" -> simulationEngine.reset();
                    case "STEP" -> simulationEngine.tick(1.0);
                }
            }
            if (request.getSpeedMultiplier() != null) {
                simulationEngine.setSpeedMultiplier(request.getSpeedMultiplier());
            }
        }
        return cityService.getCityData().getSimulationState();
    }

    public SimulationStateDTO getSimulationState() {
        return cityService.getCityData().getSimulationState();
    }
}
