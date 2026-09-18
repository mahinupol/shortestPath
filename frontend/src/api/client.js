const BASE_URL = '/api';

async function handleResponse(response) {
  if (!response.ok) {
    let errorDetail;
    try {
      errorDetail = await response.json();
    } catch {
      errorDetail = { message: `Request failed with status ${response.status}: ${response.statusText}` };
    }
    throw new Error(errorDetail.message || 'Simulation API request failed.');
  }
  return response.json();
}

export const api = {
  // City Map & Full Snapshot
  async getCityData() {
    const res = await fetch(`${BASE_URL}/city`);
    return handleResponse(res);
  },

  // Simulation Controls
  async getSimulationState() {
    const res = await fetch(`${BASE_URL}/simulation/state`);
    return handleResponse(res);
  },

  async controlSimulation(action, speedMultiplier = null) {
    const res = await fetch(`${BASE_URL}/simulation/control`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, speedMultiplier })
    });
    return handleResponse(res);
  },

  async startSimulation() {
    const res = await fetch(`${BASE_URL}/simulation/start`, { method: 'POST' });
    return handleResponse(res);
  },

  async pauseSimulation() {
    const res = await fetch(`${BASE_URL}/simulation/pause`, { method: 'POST' });
    return handleResponse(res);
  },

  async resumeSimulation() {
    const res = await fetch(`${BASE_URL}/simulation/resume`, { method: 'POST' });
    return handleResponse(res);
  },

  async resetSimulation() {
    const res = await fetch(`${BASE_URL}/simulation/reset`, { method: 'POST' });
    return handleResponse(res);
  },

  async setSpeed(multiplier) {
    const res = await fetch(`${BASE_URL}/simulation/speed/${multiplier}`, { method: 'POST' });
    return handleResponse(res);
  },

  async triggerTick() {
    const res = await fetch(`${BASE_URL}/simulation/tick`, { method: 'POST' });
    return handleResponse(res);
  },

  // Vehicles
  async getVehicles() {
    const res = await fetch(`${BASE_URL}/vehicles`);
    return handleResponse(res);
  },

  async getVehicle(id) {
    const res = await fetch(`${BASE_URL}/vehicles/${id}`);
    return handleResponse(res);
  },

  async spawnVehicle(type, startNodeId, targetNodeId) {
    const res = await fetch(`${BASE_URL}/vehicles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, startNodeId, targetNodeId })
    });
    return handleResponse(res);
  },

  async deployVehicle({ type, startNodeId, targetNodeId, algorithm, speed }) {
    const res = await fetch(`${BASE_URL}/vehicles/deploy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, startNodeId, targetNodeId, algorithm, speed })
    });
    return handleResponse(res);
  },

  async updateVehicleSpeed(id, speed) {
    const res = await fetch(`${BASE_URL}/vehicles/${id}/speed/${speed}`, {
      method: 'PUT'
    });
    return handleResponse(res);
  },

  async clearVehicles() {
    const res = await fetch(`${BASE_URL}/vehicles`, {
      method: 'DELETE'
    });
    return handleResponse(res);
  },

  // Roads & Traffic
  async getRoads() {
    const res = await fetch(`${BASE_URL}/roads`);
    return handleResponse(res);
  },

  async blockRoad(roadId) {
    const res = await fetch(`${BASE_URL}/roads/${roadId}/block`, { method: 'PUT' });
    return handleResponse(res);
  },

  async restoreRoad(roadId) {
    const res = await fetch(`${BASE_URL}/roads/${roadId}/restore`, { method: 'PUT' });
    return handleResponse(res);
  },

  async updateTraffic(roadId, trafficLevel) {
    const res = await fetch(`${BASE_URL}/traffic/${roadId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trafficLevel })
    });
    return handleResponse(res);
  },

  async simulateAccident() {
    const res = await fetch(`${BASE_URL}/traffic/accident`, { method: 'POST' });
    return handleResponse(res);
  },

  async simulateRushHour() {
    const res = await fetch(`${BASE_URL}/traffic/rush-hour`, { method: 'POST' });
    return handleResponse(res);
  },

  // Emergencies
  async getEmergencies() {
    const res = await fetch(`${BASE_URL}/emergencies`);
    return handleResponse(res);
  },

  async dispatchEmergency(request) {
    const res = await fetch(`${BASE_URL}/emergencies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });
    return handleResponse(res);
  },

  async resolveEmergency(id) {
    const res = await fetch(`${BASE_URL}/emergencies/${id}/resolve`, { method: 'POST' });
    return handleResponse(res);
  },

  // A* Routing
  async calculateRoute(sourceNodeId, targetNodeId, strategy = 'FASTEST', isEmergency = false) {
    const res = await fetch(`${BASE_URL}/routes/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceNodeId, targetNodeId, strategy, isEmergency })
    });
    return handleResponse(res);
  },

  // Analytics
  async getAnalytics() {
    const res = await fetch(`${BASE_URL}/analytics`);
    return handleResponse(res);
  }
};
