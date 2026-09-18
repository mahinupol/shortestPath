package com.smartcity.dto;

import com.smartcity.algorithm.PathResult;

public class VehicleDeployResponseDTO {
    private VehicleDTO vehicle;
    private PathResult route;

    public VehicleDeployResponseDTO() {
    }

    public VehicleDeployResponseDTO(VehicleDTO vehicle, PathResult route) {
        this.vehicle = vehicle;
        this.route = route;
    }

    public VehicleDTO getVehicle() {
        return vehicle;
    }

    public void setVehicle(VehicleDTO vehicle) {
        this.vehicle = vehicle;
    }

    public PathResult getRoute() {
        return route;
    }

    public void setRoute(PathResult route) {
        this.route = route;
    }
}
