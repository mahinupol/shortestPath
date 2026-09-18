package com.smartcity.controller;

import com.smartcity.dto.CityDataDTO;
import com.smartcity.service.CityService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/city")
public class CityController {

    private final CityService cityService;

    public CityController(CityService cityService) {
        this.cityService = cityService;
    }

    @GetMapping
    public ResponseEntity<CityDataDTO> getCityData() {
        return ResponseEntity.ok(cityService.getCityData());
    }
}
