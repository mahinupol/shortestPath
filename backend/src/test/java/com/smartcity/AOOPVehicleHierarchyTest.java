package com.smartcity;

import com.smartcity.model.core.*;
import com.smartcity.model.enums.VehicleType;
import com.smartcity.patterns.factory.VehicleFactory;
import org.junit.jupiter.api.Test;

import java.util.PriorityQueue;

import static org.junit.jupiter.api.Assertions.*;

public class AOOPVehicleHierarchyTest {

    @Test
    void testPolymorphicPrioritySorting() {
        AbstractVehicle car = VehicleFactory.createVehicle(VehicleType.CAR, "V-1", "Car 1", 50, 0, 0, "N1", null);
        AbstractVehicle amb = VehicleFactory.createVehicle(VehicleType.AMBULANCE, "V-2", "Amb 1", 65, 0, 0, "N1", "N1");
        AbstractVehicle fire = VehicleFactory.createVehicle(VehicleType.FIRE_TRUCK, "V-3", "Fire 1", 55, 0, 0, "N1", "N1");
        AbstractVehicle police = VehicleFactory.createVehicle(VehicleType.POLICE, "V-4", "Police 1", 70, 0, 0, "N1", "N1");

        assertEquals(1, car.calculatePriority());
        assertEquals(9, amb.calculatePriority());
        assertEquals(10, fire.calculatePriority());
        assertEquals(8, police.calculatePriority());

        // Test PriorityQueue ordering (Highest priority first)
        PriorityQueue<AbstractVehicle> pq = new PriorityQueue<>();
        pq.add(car);
        pq.add(amb);
        pq.add(fire);
        pq.add(police);

        assertEquals("V-3", pq.poll().getId(), "Fire Truck (priority 10) must be first in dispatch queue");
        assertEquals("V-2", pq.poll().getId(), "Ambulance (priority 9) must be second");
        assertEquals("V-4", pq.poll().getId(), "Police (priority 8) must be third");
        assertEquals("V-1", pq.poll().getId(), "Civilian car (priority 1) must be last");
    }

    @Test
    void testTrafficLightPreemption() {
        AbstractVehicle car = VehicleFactory.createVehicle(VehicleType.CAR, "C1", "Civilian", 50, 0, 0, "N1", null);
        AbstractVehicle amb = VehicleFactory.createVehicle(VehicleType.AMBULANCE, "A1", "Ambulance", 65, 0, 0, "N1", "N1");

        assertFalse(car.canPreemptTrafficLights(), "Civilian vehicle cannot preempt traffic lights");
        assertTrue(amb.canPreemptTrafficLights(), "Emergency vehicle can preempt traffic lights");
    }
}
