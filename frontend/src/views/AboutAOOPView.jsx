import React from 'react';
import { 
  BookOpen, 
  Layers, 
  Code, 
  Cpu, 
  ShieldCheck, 
  GitBranch, 
  CheckCircle2, 
  Terminal, 
  Route,
  Zap,
  Boxes
} from 'lucide-react';

export default function AboutAOOPView() {
  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Hero Header */}
      <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-cyan-950/40 border border-cyan-500/20 shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono mb-3">
            <Cpu className="w-3.5 h-3.5" />
            <span>Advanced Object-Oriented Programming (AOOP) Capstone Project</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight">
            Smart City Traffic & Emergency Simulator
          </h1>
          <p className="mt-3 text-slate-300 text-sm lg:text-base max-w-3xl leading-relaxed">
            A state-of-the-art urban simulation engine developed in Java 17+ and Spring Boot, paired with a high-performance React command center. Demonstrates clean OOP architectural principles, graph algorithms (A* Pathfinding), dynamic priority routing, and design patterns.
          </p>
        </div>
      </div>

      {/* Core AOOP Principles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Encapsulation */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">1. Encapsulation</h2>
              <span className="text-xs text-slate-400 font-mono">Private state & invariant protection</span>
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            All core models (<code className="text-cyan-300">AbstractVehicle</code>, <code className="text-cyan-300">GraphEdge</code>, <code className="text-cyan-300">TrafficLight</code>, <code className="text-cyan-300">City</code>) encapsulate internal spatial coordinates, progress percentages, speed states, and priority flags with strict access controls and validation rules.
          </p>
        </div>

        {/* 2. Inheritance & Hierarchy */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">2. Inheritance Hierarchy</h2>
              <span className="text-xs text-slate-400 font-mono">Specialized polymorphic subclasses</span>
            </div>
          </div>
          <div className="text-xs text-slate-300 font-mono space-y-1 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <div>AbstractVehicle (base vehicle)</div>
            <div className="pl-4">├── NormalVehicle (civilian commute cars)</div>
            <div className="pl-4">└── EmergencyVehicle (sirens & preemption)</div>
            <div className="pl-8">├── Ambulance (priority 9, medical)</div>
            <div className="pl-8">├── FireTruck (priority 10, fire/hazard)</div>
            <div className="pl-8">└── PoliceVehicle (priority 8, pursuit)</div>
          </div>
        </div>

        {/* 3. Polymorphism */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">3. Polymorphism in Action</h2>
              <span className="text-xs text-slate-400 font-mono">Overridden contracts & dynamic dispatch</span>
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            The simulation loop advances generic <code className="text-emerald-300">AbstractVehicle</code> references. Concrete instances dynamically execute overridden implementations of <code className="text-emerald-300">calculatePriority()</code>, <code className="text-emerald-300">getSpeedMultiplier()</code>, and <code className="text-emerald-300">canPreemptTrafficLights()</code> without conditional branching.
          </p>
        </div>

        {/* 4. Abstraction */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">4. Abstraction & Interfaces</h2>
              <span className="text-xs text-slate-400 font-mono">Decoupled contracts</span>
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            High-level services interact with abstractions such as <code className="text-amber-300">RouteStrategy</code>, <code className="text-amber-300">TrafficObserver</code>, and <code className="text-amber-300">SimulationEventListener</code>, isolating the algorithmic implementation from state management and API delivery.
          </p>
        </div>
      </div>

      {/* Design Patterns Showcase */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl">
        <h2 className="font-bold text-lg text-white mb-4 flex items-center space-x-2">
          <Code className="w-5 h-5 text-cyan-400" />
          <span>Architectural Design Patterns</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <h3 className="font-bold text-xs text-cyan-300 uppercase font-mono">Strategy Pattern</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              <code className="text-slate-200">RouteStrategy</code> defines routing contracts. At runtime, the simulator switches between <code className="text-slate-200">ShortestDistanceStrategy</code>, <code className="text-slate-200">FastestTimeStrategy</code>, and <code className="text-slate-200">EmergencyPriorityRouteStrategy</code>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <h3 className="font-bold text-xs text-purple-300 uppercase font-mono">Observer Pattern</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              <code className="text-slate-200">TrafficSubject</code> notifies registered <code className="text-slate-200">TrafficObserver</code> instances. When a road is blocked or congested, affected vehicles receive immediate notifications and recalculate their A* path.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <h3 className="font-bold text-xs text-emerald-300 uppercase font-mono">Factory Pattern</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              <code className="text-slate-200">VehicleFactory</code> and <code className="text-slate-200">EmergencyFactory</code> decouple object creation from application logic, instantiating polymorphic instances with correct base speeds and priorities.
            </p>
          </div>
        </div>
      </div>

      {/* A* Algorithm Mathematical Formulation */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <h2 className="font-bold text-lg text-white flex items-center space-x-2">
          <Route className="w-5 h-5 text-cyan-400" />
          <span>A* Pathfinding Mathematical Formulation</span>
        </h2>

        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 font-mono text-xs space-y-3">
          <div className="text-base text-cyan-400 font-bold">
            F(n) = G(n) + H(n)
          </div>
          <div className="text-slate-300 space-y-1.5">
            <p>• <strong className="text-white">G(n)</strong> = Accumulated movement cost from origin to node <code className="text-cyan-300">n</code>: <code className="text-slate-400">distance × trafficMultiplier × priorityDiscount</code></p>
            <p>• <strong className="text-white">H(n)</strong> = Euclidean heuristic distance from node <code className="text-cyan-300">n</code> to destination <code className="text-cyan-300">(x_dest, y_dest)</code>: <code className="text-slate-400">√((x_n - x_dest)² + (y_n - y_dest)²)</code></p>
            <p>• <strong className="text-white">Traffic Multipliers:</strong> LOW = 1.0x (cost 1), MEDIUM = 2.0x (cost 2), HIGH = 4.0x (cost 4), CRITICAL = 8.0x (cost 8).</p>
            <p>• <strong className="text-white">Blocked Roads:</strong> Assigned infinite cost (skipped in open queue traversal), guaranteeing road closure avoidance.</p>
            <p>• <strong className="text-white">Data Structure:</strong> Implemented via Java <code className="text-cyan-300">PriorityQueue&lt;NodeRecord&gt;</code> with custom <code className="text-cyan-300">Comparator</code> for optimal O(E log V) performance.</p>
          </div>
        </div>
      </div>

      {/* Execution Commands */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
        <h2 className="font-bold text-sm text-white uppercase font-mono tracking-wider flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span>Local Launch Commands</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-slate-500 block text-[10px]">BACKEND (SPRING BOOT)</span>
            <div className="text-cyan-400">cd backend</div>
            <div className="text-emerald-400">mvn spring-boot:run</div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-slate-500 block text-[10px]">FRONTEND (REACT + VITE)</span>
            <div className="text-cyan-400">cd frontend</div>
            <div className="text-emerald-400">npm install &amp;&amp; npm run dev</div>
          </div>
        </div>
      </div>
    </div>
  );
}
