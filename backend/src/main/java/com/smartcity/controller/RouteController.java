package com.smartcity.controller;

import com.smartcity.algorithm.PathResult;
import com.smartcity.dto.RouteCalculationRequest;
import com.smartcity.service.RouteService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/routes")
public class RouteController {

    private final RouteService routeService;

    public RouteController(RouteService routeService) {
        this.routeService = routeService;
    }

    @PostMapping("/calculate")
    public ResponseEntity<PathResult> calculateRoute(@RequestBody RouteCalculationRequest request) {
        return ResponseEntity.ok(routeService.calculateRoute(request));
    }
}
