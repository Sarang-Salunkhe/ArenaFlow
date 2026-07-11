import { StadiumState, OperationalDecision } from '../types.js';

export function evaluateDecisions(stadiumState: StadiumState): OperationalDecision[] {
  const decisions: OperationalDecision[] = [];
  const nowStr = new Date().toISOString();

  // 1. GATE CONGESTION RULE
  stadiumState.gates.forEach(gate => {
    const queueRatio = gate.occupancy / gate.capacity;
    const isCongested = gate.status === 'BUSY' || gate.status === 'RESTRICTED' || queueRatio >= 0.7;
    const isRising = gate.trend === 'RISING' || gate.trend === 'RAPIDLY_RISING';

    if (isCongested && isRising) {
      // Look for alternative gate that has low pressure
      const altGate = stadiumState.gates.find(g => g.id !== gate.id && g.status === 'OPEN' && (g.occupancy / g.capacity) < 0.4);
      if (altGate) {
        const queueMinutes = Math.round(gate.avgQueueSeconds / 60);
        const altQueueMinutes = Math.round(altGate.avgQueueSeconds / 60);
        
        decisions.push({
          id: `dec_gate_cong_${gate.id}_${stadiumState.tickCount}`,
          title: `Gate Congestion Diversion: Redirect Ingress from ${gate.name} to ${altGate.name}`,
          priority: queueMinutes >= 12 || gate.status === 'RESTRICTED' ? 'CRITICAL' : 'HIGH',
          source: 'CROWD',
          affectedLocations: [gate.id, altGate.id],
          rationaleFacts: [
            `${gate.name} queue is heavily congested with approximately ${queueMinutes} mins wait time.`,
            `Crowd inflow trend at ${gate.name} is ${gate.trend}.`,
            `${altGate.name} is operating normally with a low wait time of ${altQueueMinutes} mins.`
          ],
          recommendedActions: [
            `Divert arriving fans at the main plaza approach from ${gate.name} to ${altGate.name}.`,
            `Deploy 4 volunteers to the plaza intersection to guide fans.`,
            `Update digital signage boards at the transport terminals.`
          ],
          communicationRequired: {
            operationsBrief: `Ingress surge at ${gate.name} exceeds threshold (${queueMinutes}m queue). Commencing diversion to ${altGate.name}. Dispatching volunteers.`,
            fanAlert: `${gate.name} is experiencing long wait times. For faster entry, please route to ${altGate.name} where queues are under 2 minutes.`,
            volunteerInstruction: `Stand at the North-South concourse fork and redirect fans arriving from the transport hubs away from ${gate.name} toward ${altGate.name}.`
          },
          timestamp: nowStr,
        });
      }
    }
  });

  // 2. MEDICAL INCIDENT RULE
  const medicalIncidents = stadiumState.incidents.filter(
    inc => inc.active && (inc.severity === 'HIGH' || inc.severity === 'CRITICAL') &&
    (inc.title.toLowerCase().includes('medical') || inc.title.toLowerCase().includes('cardiac') || inc.title.toLowerCase().includes('injury'))
  );

  medicalIncidents.forEach(incident => {
    const zoneName = stadiumState.zones.find(z => z.id === incident.zoneId)?.name || incident.zoneId;
    decisions.push({
      id: `dec_med_${incident.id}`,
      title: `Emergency Medical Dispatch & Access: ${incident.title} in ${zoneName}`,
      priority: incident.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
      source: 'MEDICAL',
      affectedLocations: [incident.zoneId],
      rationaleFacts: [
        `Active medical incident: "${incident.title}" (Severity: ${incident.severity}).`,
        `Location: ${zoneName}.`,
        `Description: ${incident.description}`
      ],
      recommendedActions: [
        `Clear emergency access corridor leading to ${zoneName}.`,
        `Secure the immediate area in ${zoneName} to allow medical crew space to operate.`,
        `Direct pedestrian flows to use opposite concourse walkways.`
      ],
      communicationRequired: {
        operationsBrief: `Medical responder dispatch active to ${zoneName}. Operations to keep standby corridor open.`,
        fanAlert: `First responders are active near ${zoneName}. Please keep walkways clear and follow staff instructions.`,
        volunteerInstruction: `Clear a 3-meter wide lane in the concourse near ${zoneName} for emergency cart access. Keep pedestrians moving to avoid crowd bottlenecks.`
      },
      timestamp: nowStr,
    });
  });

  // 3. ROUTE CLOSURE RULE
  const closureIncidents = stadiumState.incidents.filter(
    inc => inc.active &&
    (inc.title.toLowerCase().includes('close') || inc.title.toLowerCase().includes('block') || inc.title.toLowerCase().includes('obstruction') || inc.zoneId === 'EMERGENCY_CORRIDOR')
  );

  closureIncidents.forEach(incident => {
    const zoneName = stadiumState.zones.find(z => z.id === incident.zoneId)?.name || incident.zoneId;
    decisions.push({
      id: `dec_close_${incident.id}`,
      title: `Pedestrian Re-routing: ${zoneName} Blockage`,
      priority: incident.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
      source: 'ROUTING',
      affectedLocations: [incident.zoneId],
      rationaleFacts: [
        `Active blockage/closure incident: "${incident.title}".`,
        `Location: ${zoneName}.`,
        `Status: Zone is impassable.`
      ],
      recommendedActions: [
        `Update digital pathfinding graph to mark ${incident.zoneId} as blocked.`,
        `Deploy volunteers to the entry points of ${zoneName} to enforce the closure.`,
        `Set up detour barricades and redirect signage.`
      ],
      communicationRequired: {
        operationsBrief: `${zoneName} is blocked. Routing engine updated. Detours established.`,
        fanAlert: `${zoneName} is temporarily closed. Please follow detour signs to navigate around the area.`,
        volunteerInstruction: `Position at the entrance of ${zoneName} and divert all fans to alternative walkways. Explain that the route is closed for safety reasons.`
      },
      timestamp: nowStr,
    });
  });

  // 4. EXIT SURGE RULE
  if (stadiumState.matchPhase === 'EXIT_SURGE' || stadiumState.matchPhase === 'MATCH_END') {
    const metro = stadiumState.zones.find(z => z.id === 'METRO_STATION');

    const metroQueue = stadiumState.transport.metroQueueSeconds;
    const busQueue = stadiumState.transport.busQueueSeconds;

    if (metro && metroQueue > 400) {
      const metroMins = Math.round(metroQueue / 60);
      const busMins = Math.round(busQueue / 60);

      decisions.push({
        id: `dec_exit_surge_${stadiumState.tickCount}`,
        title: `Transport Load Balancing: Pacing Metro and Promoting Shuttle Bus Service`,
        priority: metroQueue > 720 ? 'CRITICAL' : 'HIGH',
        source: 'EXIT',
        affectedLocations: ['METRO_STATION', 'BUS_STATION'],
        rationaleFacts: [
          `Post-match exit surge active.`,
          `Metro station platform is experiencing critical wait times of ${metroMins} minutes.`,
          `Shuttle bus terminal at Bus Station is operating with a lower wait time of ${busMins} minutes.`
        ],
        recommendedActions: [
          `Enact queue pacing/holding at Metro Entrance gates.`,
          `Redirect exit flows from South Stand/Plaza to the Bus Station Plaza shuttle terminal.`,
          `Request transport authority to dispatch 5 additional shuttle buses.`
        ],
        communicationRequired: {
          operationsBrief: `Metro station queue is ${metroMins}m. Implementing pacing restrictions. Promoting shuttle buses.`,
          fanAlert: `Metro station is highly congested (wait time ~${metroMins}m). Shuttle buses are available at the Bus Terminal with only a ${busMins}m wait.`,
          volunteerInstruction: `Direct fans leaving the stadium toward the Bus Station terminal. Inform them that the metro is experiencing major queues.`
        },
        timestamp: nowStr,
      });
    }
  }

  return decisions;
}
