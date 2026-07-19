import { StadiumState, OperationalDecision } from '../types.js';

export function evaluateDecisions(stadiumState: StadiumState): OperationalDecision[] {
  const decisions: OperationalDecision[] = [];
  const nowStr = new Date().toISOString();

  // Helper to find a zone's name
  const getZoneName = (zoneId: string) => {
    return stadiumState.zones.find(z => z.id === zoneId)?.name || zoneId;
  };

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
          situationSummary: `Critical ticket-scanning queue buildup detected at ${gate.name} due to peak arrival waves.`,
          riskScore: queueMinutes >= 12 ? 88 : 74,
          confidenceScore: 93,
          estimatedResolutionTime: '15 minutes',
          requiredPersonnel: ['Volunteer Section 1A (4 members)', 'Gate Supervisor'],
          resourcesSuggested: {
            securityUnit: 'Security Unit Charlie',
            volunteerGroup: 'Volunteer Section 1A',
            equipment: 'Mobile Queuing Stanchions & Directional Signage'
          },
          explanation: `Diverting flow away from ${gate.name} towards ${altGate.name} immediately balances arrival rate. ${altGate.name} has 4 empty reader terminals and zero current queue, reducing overall average wait times by 12 minutes.`,
          status: 'PENDING'
        });
      }
    }
  });

  // 2. INCIDENT-BASED RULES
  stadiumState.incidents.forEach(incident => {
    if (!incident.active) return;

    const titleLower = incident.title.toLowerCase();
    const zoneName = getZoneName(incident.zoneId);

    // MEDICAL EMERGENCY
    if (titleLower.includes('med') || titleLower.includes('cardiac') || titleLower.includes('injury')) {
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
          `Direct pedestrian flows to use opposite concourse walkways.`,
          `Instruct nearby volunteer stewards to shield patient privacy.`
        ],
        communicationRequired: {
          operationsBrief: `Medical responder dispatch active to ${zoneName}. Operations to keep standby corridor open.`,
          fanAlert: `First responders are active near ${zoneName}. Please keep walkways clear and follow staff instructions.`,
          volunteerInstruction: `Clear a 3-meter wide lane in the concourse near ${zoneName} for emergency cart access. Keep pedestrians moving to avoid crowd bottlenecks.`
        },
        timestamp: nowStr,
        situationSummary: `A spectator in ${zoneName} requires immediate medical response. Walkways must be cleared.`,
        riskScore: incident.severity === 'CRITICAL' ? 95 : 78,
        confidenceScore: 98,
        estimatedResolutionTime: '10 minutes',
        requiredPersonnel: ['Medical Team 2 (Paramedics)', 'Emergency Cart Operator'],
        resourcesSuggested: {
          medicalTeam: 'Medical Team 2',
          emergencyVehicle: 'Emergency Cart Alpha',
          volunteerGroup: 'Volunteer Section 3C (2 guides)',
          equipment: 'Trauma Kit, Portable Defibrillator'
        },
        explanation: `Dispatching Medical Team 2 because they are based at the East Medical Annex (only 120 meters away from Section ${zoneName}) and currently unassigned. Placing emergency vehicle Alpha on standby allows rapid transport back to the ambulance bay.`,
        status: 'PENDING'
      });
    }

    // RED CARD
    else if (titleLower.includes('red card')) {
      decisions.push({
        id: `dec_red_${incident.id}`,
        title: `Away Support Separation & Corridor Security - ${incident.title}`,
        priority: 'HIGH',
        source: 'ROUTING',
        affectedLocations: [incident.zoneId],
        rationaleFacts: [
          `Red card shown to player, causing heavy away team booing and crowd tension near ${zoneName}.`,
          `Risk of projectile tossing or fan confrontation near player tunnel.`
        ],
        recommendedActions: [
          `Deploy additional security to secure the player tunnel corridor.`,
          `Instruct stewards near Section ${zoneName} to increase alert levels.`,
          `Establish a visual boundary between home and away fan blocks.`
        ],
        communicationRequired: {
          operationsBrief: `Tension high in ${zoneName} after red card. Deploying tunnel escort security.`,
          fanAlert: `Keep match energy positive. Zero tolerance for aggressive behavior.`,
          volunteerInstruction: `Monitor fan responses closely. Report any verbal or physical abuse to supervisor immediately.`
        },
        timestamp: nowStr,
        situationSummary: `Elevated crowd friction and booing triggered in ${zoneName} following a player expulsion.`,
        riskScore: 72,
        confidenceScore: 91,
        estimatedResolutionTime: '20 minutes',
        requiredPersonnel: ['Security Unit Echo (4 guards)', 'Steward Team S3'],
        resourcesSuggested: {
          securityUnit: 'Security Unit Echo',
          volunteerGroup: 'Tunnel Volunteer Liaison',
          equipment: 'Retractable Tunnel Cover, Crowd Separation Railings'
        },
        explanation: `Deploying Security Unit Echo to Section ${zoneName} and tunnel entrances protects departing team personnel. Projectile risk is minimized by erecting the retractable tunnel cover immediately.`,
        status: 'PENDING'
      });
    }

    // CROWD SURGE
    else if (titleLower.includes('surge') || titleLower.includes('crowd surge')) {
      decisions.push({
        id: `dec_surge_${incident.id}`,
        title: `Crowd Flow Pacing & Stairwell Redirection - ${incident.title}`,
        priority: 'HIGH',
        source: 'CROWD',
        affectedLocations: [incident.zoneId],
        rationaleFacts: [
          `Active crowd surge at ${zoneName}.`,
          `Risk of bottlenecking, crushing, or staircase compression.`
        ],
        recommendedActions: [
          `Implement pacing bar stanchions at the entrance of ${zoneName}.`,
          `Deploy volunteers to redirect arriving fans to side escalators.`,
          `Broadcast visual routing instructions on big boards.`
        ],
        communicationRequired: {
          operationsBrief: `Surge active in ${zoneName}. Pacing activated. Diverting surplus flow.`,
          fanAlert: `${zoneName} is highly crowded. Please take the adjacent side stairwells to keep moving.`,
          volunteerInstruction: `Form a physical hand guide line and gently guide fans away from the central escalator towards side stairs.`
        },
        timestamp: nowStr,
        situationSummary: `Sudden density surge inside ${zoneName} requires dynamic human pacing to prevent compression.`,
        riskScore: 84,
        confidenceScore: 94,
        estimatedResolutionTime: '15 minutes',
        requiredPersonnel: ['Security Patrol Bravo (6 guards)', 'Volunteer Section 4'],
        resourcesSuggested: {
          securityUnit: 'Security Patrol Bravo',
          volunteerGroup: 'Volunteer Crowd Support Group 4',
          equipment: 'Mobile Crowd Barriers, Megaphones'
        },
        explanation: `Pacing the ingress to ${zoneName} by 30 seconds breaks up human velocity waves, flattening density to a safe level of 3.2 persons/sqm. Utilizing side stairs absorbs 25% of the excess concourse volume.`,
        status: 'PENDING'
      });
    }

    // HEAVY RAIN
    else if (titleLower.includes('rain') || titleLower.includes('weather')) {
      decisions.push({
        id: `dec_rain_${incident.id}`,
        title: `Wet-Weather Safety Mode: Shelter Coordination - ${incident.title}`,
        priority: 'MEDIUM',
        source: 'ROUTING',
        affectedLocations: [incident.zoneId],
        rationaleFacts: [
          `Heavy rain causing slips on uncovered plazas.`,
          `Crowds rushing into covered concourses, building secondary congestion.`
        ],
        recommendedActions: [
          `Activate wet-weather safety mode. Deploy janitorial teams with wet floor markers.`,
          `Move outdoor plaza volunteer stations into sheltered gate entries.`,
          `Broadcast slipping warning notifications on the main stadium displays.`
        ],
        communicationRequired: {
          operationsBrief: `Rain triggered wet safety mode. Janitorial deployed. Volts moved inside.`,
          fanAlert: `Weather Advisory: Heavy rain. Plaza surfaces are slippery. Please walk carefully.`,
          volunteerInstruction: `Relocate your position under the portal canopy. Assist fans in finding covered corridors.`
        },
        timestamp: nowStr,
        situationSummary: `Heavy rainfall creating surface slip hazards and sudden rush to covered areas.`,
        riskScore: 58,
        confidenceScore: 89,
        estimatedResolutionTime: '30 minutes',
        requiredPersonnel: ['Janitorial Squad A (4 staff)', 'Plaza Volunteer Section'],
        resourcesSuggested: {
          volunteerGroup: 'Volunteer Shelter Support A',
          equipment: 'Wet Floor Warning Stands, Slip-Resistant Rubber Walkway Mats'
        },
        explanation: `Outdoor tiles become high-risk when wet. Moving outdoor staff under the portals ensures they stay dry and active, while absorbent floor mats at entrance thresholds decrease slipping incidents by 85%.`,
        status: 'PENDING'
      });
    }

    // VIP ARRIVAL
    else if (titleLower.includes('vip') || titleLower.includes('dignitary')) {
      decisions.push({
        id: `dec_vip_${incident.id}`,
        title: `VIP Security Escort & Corridor Isolation - ${incident.title}`,
        priority: 'MEDIUM',
        source: 'ROUTING',
        affectedLocations: [incident.zoneId],
        rationaleFacts: [
          `VIP/Dignitary arrival at West Gate.`,
          `Need to enforce security agreements and prevent fan bottlenecks near VIP elevators.`
        ],
        recommendedActions: [
          `Isolate West VIP elevators and restrict pedestrian flow.`,
          `Deploy designated VIP escort team to secure the vehicles.`,
          `Instruct volunteer marshals to maintain clearance lanes.`
        ],
        communicationRequired: {
          operationsBrief: `VIP motorcade arrived. Isolation protocols active. escort active.`,
          fanAlert: `Portions of West Plaza are temporarily restricted. Thank you for your cooperation.`,
          volunteerInstruction: `Maintain the perimeter line near the West Elevators. Direct standard ticket holders around the barrier.`
        },
        timestamp: nowStr,
        situationSummary: `A high-priority dignitary motorcade has entered West Plaza, triggering escort isolation protocols.`,
        riskScore: 48,
        confidenceScore: 96,
        estimatedResolutionTime: '10 minutes',
        requiredPersonnel: ['VIP Escort Unit 1', 'Elevator Security Officer'],
        resourcesSuggested: {
          securityUnit: 'VIP Protection Unit 1',
          volunteerGroup: 'Liaison Support Team',
          emergencyVehicle: 'Escort Cruiser 2',
          equipment: 'Restricted Access Barriers'
        },
        explanation: `Isolating West Lift Corridor 4 keeps the dignitary transition completely separate from general concourse traffic, minimizing exposure risks and aligning with strict security compliance standards.`,
        status: 'PENDING'
      });
    }

    // SECURITY ALERT / UNATTENDED PACKAGE
    else if (titleLower.includes('security') || titleLower.includes('unattended') || titleLower.includes('package')) {
      decisions.push({
        id: `dec_sec_${incident.id}`,
        title: `Cordon Isolation & Gate Rerouting: ${incident.title}`,
        priority: 'CRITICAL',
        source: 'ROUTING',
        affectedLocations: [incident.zoneId],
        rationaleFacts: [
          `Active threat/suspicious unattended item at ${zoneName}.`,
          `Safety risk to arriving crowds in the immediate vicinity.`
        ],
        recommendedActions: [
          `Establish a 20-meter physical cordon around the item.`,
          `Temporarily suspend nearby gate scanners and route arriving spectators to alternate entries.`,
          `Dispatch K9 explosives division for quick sweep and clearing.`
        ],
        communicationRequired: {
          operationsBrief: `Suspicious package alert at ${zoneName}. Establishing cordon. Rerouting ingress.`,
          fanAlert: `Safety Update: A section of the plaza is closed for a routine review. Please follow staff detours.`,
          volunteerInstruction: `Maintain a strict boundary. Do not let any fan cross the security line. Direct them to the next open sector.`
        },
        timestamp: nowStr,
        situationSummary: `An unattended backpack has been flagged in ${zoneName}. Establishing security cordon immediately.`,
        riskScore: 98,
        confidenceScore: 97,
        estimatedResolutionTime: '25 minutes',
        requiredPersonnel: ['K9 Bomb Sweep Specialist', 'Security Unit Alpha (6 guards)'],
        resourcesSuggested: {
          securityUnit: 'Security Unit Alpha (Cordon Patrol)',
          volunteerGroup: 'Plaza Redirect Team B',
          emergencyVehicle: 'Tactical Command Cruiser 1',
          equipment: 'Hazard Barriers, Cordon Tape'
        },
        explanation: `Isolating ${zoneName} with a 20m cordon protects pedestrians while K9 sweeps the item. Rerouting arrival queues to adjacent gates prevents backpressure at the main entry gates.`,
        status: 'PENDING'
      });
    }

    // LOST CHILD
    else if (titleLower.includes('lost') || titleLower.includes('child')) {
      decisions.push({
        id: `dec_lost_${incident.id}`,
        title: `Secure Boundary Search & Parental Reunification: ${incident.title}`,
        priority: 'LOW',
        source: 'CROWD',
        affectedLocations: [incident.zoneId],
        rationaleFacts: [
          `Separated child reported near North Plaza.`,
          `Description sent to all staff. Exit gates must monitor.`
        ],
        recommendedActions: [
          `Broadcast description to all plaza and egress volunteers.`,
          `Instruct exit turnstile personnel to watch for matching children.`,
          `Open parent reunification room and standby staff.`
        ],
        communicationRequired: {
          operationsBrief: `Lost child report north plaza. Marshals matching description alert.`,
          fanAlert: `Operations support active in North Plaza. Standard safety protocols in effect.`,
          volunteerInstruction: `Look out for an 8-year-old child in a green jersey. If spotted, escort them to the North Plaza Office immediately.`
        },
        timestamp: nowStr,
        situationSummary: `A parent reported separation of their child near North Plaza. Staff on active search.`,
        riskScore: 28,
        confidenceScore: 94,
        estimatedResolutionTime: '15 minutes',
        requiredPersonnel: ['North Plaza Lead Supervisor', 'Parent Reunion Coordinator'],
        resourcesSuggested: {
          volunteerGroup: 'North Plaza Volunteer Squad',
          securityUnit: 'Operations CCTV Monitor Desk',
          equipment: 'Staff Radios with Digital Photo Profile'
        },
        explanation: `Alerting volunteers at exit turnstiles prevents the child from wandering outside stadium gates, while central CCTV monitors cross-reference previous frames to trace the child's movement history.`,
        status: 'PENDING'
      });
    }

    // PUBLIC TRANSPORT DELAY
    else if (titleLower.includes('transport') || titleLower.includes('metro') || titleLower.includes('delay')) {
      decisions.push({
        id: `dec_trans_${incident.id}`,
        title: `Transport Pacing & Shuttle Bus Dispatch: ${incident.title}`,
        priority: 'HIGH',
        source: 'EXIT',
        affectedLocations: [incident.zoneId, 'BUS_STATION'],
        rationaleFacts: [
          `Metro service experiencing signals issues, building dangerous platform crowds.`,
          `Post-match egress active. Shuttle buses have empty capacity.`
        ],
        recommendedActions: [
          `Setup pacing/holding gates at the main Metro Plaza.`,
          `Divert exiting spectator flows toward the Bus Terminal.`,
          `Request additional bus dispatches from transit command.`
        ],
        communicationRequired: {
          operationsBrief: `Metro delays active. Platform over-density warning. Activating shuttle bus routing.`,
          fanAlert: `Metro services are currently delayed. Please use the free Shuttle Buses departing from Bus Terminal for a faster journey.`,
          volunteerInstruction: `Redirect all departing fans towards the Shuttle Bus Terminal. Explain that metro wait times exceed 20 minutes.`
        },
        timestamp: nowStr,
        situationSummary: `Metro signalling failure causing critical platform queue pressure during egress.`,
        riskScore: 82,
        confidenceScore: 95,
        estimatedResolutionTime: '45 minutes',
        requiredPersonnel: ['Transport Guides Group 1', 'Transit Police Support'],
        resourcesSuggested: {
          volunteerGroup: 'Transport Guides Group 1',
          securityUnit: 'Transit Police Support Unit',
          emergencyVehicle: 'Express Shuttle Buses #12-16',
          equipment: 'Mobile Signage, Barrier Stanchions'
        },
        explanation: `Holding fans outside the metro doors prevents platform overcrowding that could lead to accidental tracks falls. Promoting shuttle buses reduces metro platform strain immediately.`,
        status: 'PENDING'
      });
    }

    // POWER FAILURE
    else if (titleLower.includes('power') || titleLower.includes('blackout') || titleLower.includes('electricity')) {
      decisions.push({
        id: `dec_power_${incident.id}`,
        title: `Emergency Backup Generator Sync & Exit Lighting Guide: ${incident.title}`,
        priority: 'CRITICAL',
        source: 'ROUTING',
        affectedLocations: [incident.zoneId],
        rationaleFacts: [
          `Partial power blackout in Upper Concourse stairwells.`,
          `Auxiliary backup lights active, but visibility is reduced.`
        ],
        recommendedActions: [
          `Deploy patrol guards with flashlights to upper stairwell landings.`,
          `Confirm auxiliary power is feeding emergency corridor lighting.`,
          `Guide spectators toward illuminated lower level exits.`
        ],
        communicationRequired: {
          operationsBrief: `Upper level power drop. Backup generator synced. Flashlight patrols dispatched.`,
          fanAlert: `Operations update: Partial power issue on upper levels. Emergency lights are active. Please exit calmly.`,
          volunteerInstruction: `Stand at the top and bottom of Stairwell 3 and use your torch to highlight steps. Keep fans moving slowly and calmly.`
        },
        timestamp: nowStr,
        situationSummary: `A substation power dropout has affected Upper Concourse circuits. Generators running.`,
        riskScore: 92,
        confidenceScore: 90,
        estimatedResolutionTime: '20 minutes',
        requiredPersonnel: ['Substation Electrician Lead', 'Patrol Unit Delta (4 guards)'],
        resourcesSuggested: {
          securityUnit: 'Patrol Unit Delta',
          volunteerGroup: 'Upper Level Volunteer Squad',
          equipment: 'Emergency Megaphones, High-Lumen Flashlights'
        },
        explanation: `Placing Patrol Unit Delta at main staircase steps ensures fans walk rather than jog or push during dim lighting periods, mitigating stampede hazards and ensuring calm exits.`,
        status: 'PENDING'
      });
    }

    // DEFAULT OR OTHER INCIDENT
    else {
      // Create a fallback decision so we don't skip any incidents
      const risk = incident.severity === 'CRITICAL' ? 90 : incident.severity === 'HIGH' ? 75 : incident.severity === 'MEDIUM' ? 50 : 25;
      decisions.push({
        id: `dec_gen_${incident.id}`,
        title: `Incident Response Protocol - ${incident.title}`,
        priority: incident.severity === 'CRITICAL' ? 'CRITICAL' : incident.severity === 'HIGH' ? 'HIGH' : incident.severity === 'MEDIUM' ? 'MEDIUM' : 'LOW',
        source: 'ROUTING',
        affectedLocations: [incident.zoneId],
        rationaleFacts: [
          `Active Incident: "${incident.title}" in ${zoneName}.`,
          `Details: ${incident.description}`
        ],
        recommendedActions: [
          `Dispatch closest responder team to investigate and secure the site.`,
          `Keep surrounding volunteers updated with operational briefs.`,
          `Monitor CCTV feeds for further crowd impact.`
        ],
        communicationRequired: {
          operationsBrief: `Incident protocol active in ${zoneName}. Monitoring situation closely.`,
          fanAlert: `Please follow steward directives around ${zoneName}.`,
          volunteerInstruction: `Remain at your post. Report any crowd changes in ${zoneName} to the supervisor.`
        },
        timestamp: nowStr,
        situationSummary: `Active stadium incident "${incident.title}" requires dedicated field evaluation.`,
        riskScore: risk,
        confidenceScore: 85,
        estimatedResolutionTime: '15 minutes',
        requiredPersonnel: ['Incident Command Lead', 'Local Sector Guard'],
        resourcesSuggested: {
          securityUnit: 'Local Sector Guard Unit',
          volunteerGroup: 'Nearby Portal Volunteers',
          equipment: 'Mobile Radios, Incident Report Board'
        },
        explanation: `Standard tactical guidelines indicate dispatching local stewards to assess the situation directly. This keeps central reserves idle in case a higher-priority medical or structural alarm triggers.`,
        status: 'PENDING'
      });
    }
  });

  // 3. EXIT SURGE RULE (as fallback if no active incident is already handling it)
  if (stadiumState.matchPhase === 'EXIT_SURGE' || stadiumState.matchPhase === 'MATCH_END') {
    const hasExitDecisionAlready = decisions.some(d => d.id.includes('trans') || d.id.includes('exit_surge'));
    if (!hasExitDecisionAlready) {
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
          situationSummary: `Egress surge post-match causing peak crowd density at the central Metro hub.`,
          riskScore: metroQueue > 720 ? 91 : 78,
          confidenceScore: 95,
          estimatedResolutionTime: '45 minutes',
          requiredPersonnel: ['Transit Guide Group 1', 'Metro Station Security'],
          resourcesSuggested: {
            volunteerGroup: 'Volunteer Transport Guides 1',
            securityUnit: 'Transit Patrol Unit 3',
            emergencyVehicle: 'Transit Shuttle Buses #12-16',
            equipment: 'Mobile Signage, Queue Stanchions'
          },
          explanation: `Pacing prevents platforms from exceeding safe capacities (5 persons/sqm). Promoting the shuttle bus terminal balances travel times, routing fans home with minimal average stadium egress overhead.`,
          status: 'PENDING'
        });
      }
    }
  }

  return decisions;
}
