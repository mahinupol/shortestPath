package com.smartcity;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Main Spring Boot Application Entry Point for Smart City Simulator.
 * Demonstrates an interactive, real-time AOOP simulation platform with:
 * - A* Graph Pathfinding
 * - Polymorphic Vehicle & Emergency Hierarchy
 * - Strategy, Factory, and Observer Design Patterns
 * - Dynamic Traffic and Emergency Green Wave Routing
 */
@SpringBootApplication
@EnableScheduling
public class SmartCityApplication {

    public static void main(String[] args) {
        SpringApplication.run(SmartCityApplication.class, args);
    }
}
