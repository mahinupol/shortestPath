package com.smartcity.model.enums;

public enum TrafficLightState {
    RED("#ef4444", "STOP"),
    YELLOW("#eab308", "CAUTION"),
    GREEN("#22c55e", "GO");

    private final String hexColor;
    private final String action;

    TrafficLightState(String hexColor, String action) {
        this.hexColor = hexColor;
        this.action = action;
    }

    public String getHexColor() {
        return hexColor;
    }

    public String getAction() {
        return action;
    }
}
