# Smart City Traffic & Emergency Simulator 🚦🚑🔥

An Advanced Object-Oriented Programming (AOOP) Capstone Platform built with **Spring Boot** (Java 17+) and **React** (Vite + Tailwind CSS).

---

## 1. Project Overview

The **Smart City Traffic & Emergency Simulator** is a full-stack, real-time autonomous simulation platform that models an intelligent metropolis where:
* Autonomous vehicles navigate a graph network of roads, intersections, and landmarks.
* Traffic density changes dynamically across multiple congestion levels (Low, Medium, High, Critical).
* Intersections cycle realistic traffic light state machines (Red, Yellow, Green).
* First responders (Ambulances, Fire Trucks, Police Patrols) receive **priority A* routing** and can trigger **Emergency Green Waves** that force traffic lights ahead of them to turn green.
* Users can trigger accidents or manually block roads, which immediately causes affected vehicles to recalculate optimal bypass routes using the **A* pathfinding algorithm**.

---

## 2. Technology Stack

### Backend
* **Language**: Java 17+ (JDK 21/26 compatible)
* **Framework**: Spring Boot 3.3.4
* **Web**: Spring Web (REST Controllers, CORS, Exception Handlers)
* **Persistence**: Spring Data JPA
* **Database**:
  * **H2 Database** (Default in-memory development profile with H2 web console)
  * **MySQL** (Production profile included via `application-mysql.properties`)
* **Build System**: Apache Maven (`mvn` or included `./mvnw`)

### Frontend
* **Core**: React 18 + Vite
* **Styling**: Tailwind CSS (Cyberpunk Dark Command Center design system)
* **Icons**: Lucide React
* **Graphics**: HTML5 Canvas 60fps vector graphics renderer with camera pan/zoom and dynamic path interpolation

---

## 3. Advanced Object-Oriented Programming (AOOP) Architecture

The backend architecture implements key OOP principles:

### 3.1 Encapsulation
* All entities and domain models (`AbstractVehicle`, `GraphEdge`, `GraphNode`, `TrafficLight`, `City`) protect their internal state behind private attributes, offering controlled mutation via getters, setters, and state-transition methods (e.g. `advance()`, `preemptGreen()`, `recalculateRoute()`).

### 3.2 Inheritance Hierarchy
```
                       AbstractVehicle
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
        NormalVehicle                  EmergencyVehicle
        (Civilian Cars)                       │
                        ┌─────────────────────┼─────────────────────┐
                        ▼                     ▼                     ▼
                    Ambulance             FireTruck            PoliceVehicle
                  (Priority 9)          (Priority 10)           (Priority 8)
```
* **Emergencies**: `AbstractEmergency` $\to$ `MedicalEmergency`, `FireEmergency`, `PoliceIncident`.

### 3.3 Polymorphism
* Dynamic method dispatch on generic `AbstractVehicle` and `AbstractEmergency` references:
  * `calculatePriority()`: Returns priority score (FireTruck=10, Ambulance=9, Police=8, Car=1).
  * `getSpeedMultiplier()`: Adjusts vehicle transit speeds.
  * `canPreemptTrafficLights()`: Returns `true` for emergency responders, overriding traffic light stops.
  * `calculateRouteCost()`: Overrides standard road traversal penalties for emergency vehicles.

### 3.4 Abstraction & Interfaces
* Abstract classes (`AbstractVehicle`, `AbstractEmergency`) define baseline behaviors while enforcing implementation contracts for subclasses.
* Interfaces decouple algorithmic and dispatch logic:
  * `RouteStrategy`: Contract for pathfinding strategies.
  * `TrafficObserver`: Contract for receiving real-time congestion and blockage updates.
  * `SimulationEventListener`: Contract for audit logging.

### 3.5 Design Patterns
1. **Strategy Pattern** (`com.smartcity.patterns.strategy`):
   * `RouteStrategy` interface with implementations:
     * `ShortestDistanceStrategy`: Minimizes physical Euclidean distance.
     * `FastestTimeStrategy`: Minimizes travel time factoring in road traffic congestion.
     * `EmergencyPriorityRouteStrategy`: Minimizes response latency and avoids critical choke points.
2. **Observer Pattern** (`com.smartcity.patterns.observer`):
   * `TrafficSubject` coordinates registered `TrafficObserver` instances. When a road is blocked (e.g., accident), observers are notified, triggering automatic route recalculation for all affected vehicles.
3. **Factory Pattern** (`com.smartcity.patterns.factory`):
   * `VehicleFactory` and `EmergencyFactory` instantiate polymorphic vehicles and emergencies cleanly without hardcoding class names in business services.

### 3.6 Collections & Comparators
* `PriorityQueue<NodeRecord>`: Used in the A* algorithm with a custom heuristic comparator for $O(E \log V)$ node evaluation.
* `PriorityQueue<AbstractVehicle>`: Evaluates dispatch priority ordering based on vehicle priority.
* Thread-safe collections: `ConcurrentHashMap`, `CopyOnWriteArrayList`, and `Collections.synchronizedList`.

### 3.7 Custom Exceptions
* `RoadBlockedException`: Thrown when an inaccessible road is requested.
* `VehicleNotFoundException`: Thrown when querying a non-existent vehicle.
* `InvalidRouteException`: Thrown when no valid path exists between endpoints.
* `EmergencyNotFoundException`: Thrown when an incident ID cannot be located.
* Handled centrally via `GlobalExceptionHandler` (`@RestControllerAdvice`).

---

## 4. How A* Pathfinding Works

The A* pathfinding algorithm calculates the optimal path between graph nodes using:

$$F(n) = G(n) + H(n)$$

Where:
1. **$G(n)$ (Actual Cost)**:
   $$\text{Cost} = \text{Distance} \times \text{Traffic Multiplier} \times \text{Priority Factor}$$
   * Low Traffic: multiplier = $1.0\times$ (cost weight = 1)
   * Medium Traffic: multiplier = $2.0\times$ (cost weight = 2)
   * High Traffic: multiplier = $4.0\times$ (cost weight = 4)
   * Critical Congestion: multiplier = $8.0\times$ (cost weight = 8)
   * Blocked Road: cost = $\infty$ (edge completely omitted from open queue)
2. **$H(n)$ (Heuristic Cost)**:
   Admissible Euclidean straight-line distance from current node $(x_1, y_1)$ to target destination $(x_2, y_2)$:
   $$H(n) = \sqrt{(x_1 - x_2)^2 + (y_1 - y_2)^2}$$

---

## 5. REST API Documentation

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/city` | Returns full city map snapshot, vehicles, roads, traffic lights, and stats |
| `GET` | `/api/simulation/state` | Returns current simulation status (speed, tick, clock, counts) |
| `POST` | `/api/simulation/control` | Dispatches control actions (`START`, `PAUSE`, `RESUME`, `RESET`, `STEP`) |
| `POST` | `/api/simulation/start` | Starts the simulation loop |
| `POST` | `/api/simulation/pause` | Pauses the simulation loop |
| `POST` | `/api/simulation/resume` | Resumes the simulation loop |
| `POST` | `/api/simulation/reset` | Resets the simulation and city network to initial state |
| `POST` | `/api/simulation/speed/{multiplier}` | Sets simulation speed (`0.5`, `1.0`, `2.0`, `5.0`, `10.0`) |
| `POST` | `/api/simulation/tick` | Advances a single simulation step |
| `GET` | `/api/vehicles` | Returns all vehicles with positions and routes |
| `GET` | `/api/vehicles/{id}` | Returns single vehicle by ID |
| `POST` | `/api/vehicles` | Spawns a vehicle (`type`, `startNodeId`, `targetNodeId`) |
| `GET` | `/api/roads` | Returns all road segments with traffic and blockage status |
| `PUT` | `/api/roads/{id}/block` | Blocks road segment and triggers dynamic vehicle rerouting |
| `PUT` | `/api/roads/{id}/restore` | Reopens blocked road segment |
| `PUT` | `/api/traffic/{roadId}` | Sets traffic level (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) |
| `POST` | `/api/traffic/accident` | Simulates a random accident, blocks road, and recalculates routes |
| `POST` | `/api/traffic/rush-hour` | Simulates city-wide rush hour traffic spike |
| `GET` | `/api/emergencies` | Lists all active and resolved emergency incidents |
| `POST` | `/api/emergencies` | Dispatches first responder (`type`, `targetNodeId`, `sourceNodeId`) |
| `POST` | `/api/emergencies/{id}/resolve` | Resolves emergency and returns responder to idle |
| `POST` | `/api/routes/calculate` | Calculates A* path (`sourceNodeId`, `targetNodeId`, `strategy`) |
| `GET` | `/api/analytics` | Returns real-time KPI metrics, traffic distribution, and event logs |

---

## 6. How to Run Locally

### Prerequisites
* Java 17 or higher (`java -version`)
* Maven (`mvn` or use `./mvnw`)
* Node.js 18+ and npm (`node -v`, `npm -v`)

### Backend Setup
```bash
# 1. Navigate to backend directory
cd backend

# 2. Run with Maven (or ./mvnw spring-boot:run)
mvn spring-boot:run
```
* Backend starts at `http://localhost:8080`.
* H2 Database Console is available at `http://localhost:8080/h2-console` (JDBC URL: `jdbc:h2:mem:smartcitydb`, User: `sa`, Password: *empty*).

### Frontend Setup
```bash
# 1. Open a new terminal and navigate to frontend
cd frontend

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```
* Frontend starts at `http://localhost:5173`.

---

## 7. Features & Interactive Guide

1. **Smart City Map**: 25 Intersections (5x5 grid with diagonal avenues), 48 roads, 3 Hospitals, 2 Fire Stations, 2 Police Stations, and major landmarks.
2. **Animated Vehicles**: 30+ vehicles moving smoothly along their calculated routes.
3. **Emergency Dispatcher**: Dispatch Ambulances, Fire Trucks, or Police with priority A* corridors and Green Wave traffic signal preemption.
4. **Dynamic Road Blocking**: Click any road on the map to block or restore it, and observe vehicles recalculating their paths.
5. **Accident Simulator**: One-click accident injection that blocks roads and alerts the city command center.
6. **Analytics Dashboard**: Real-time traffic congestion distribution, fleet breakdown, and response times.
