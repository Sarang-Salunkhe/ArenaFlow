import { StadiumZone, Incident, CrowdInsight, CrowdLevel, AttentionLevel } from '../types.js';

export function calculateCrowdInsight(zone: StadiumZone, incidents: Incident[]): CrowdInsight {
  const occupancyPct = Math.round((zone.occupancy / zone.capacity) * 100);
  
  // Deterministic crowd level
  let crowdLevel: CrowdLevel = 'LOW';
  if (occupancyPct >= 85) crowdLevel = 'CRITICAL';
  else if (occupancyPct >= 65) crowdLevel = 'HIGH';
  else if (occupancyPct >= 35) crowdLevel = 'MODERATE';

  // Risk score calculations (0 - 100)
  let riskScore = occupancyPct;
  const reasons: string[] = [];
  const thresholdViolations: string[] = [];

  reasons.push(`Occupancy is at ${occupancyPct}% of capacity.`);

  if (occupancyPct >= 90) {
    thresholdViolations.push('OCCUPANCY_CRITICAL');
    reasons.push('Zone occupancy has exceeded the critical 90% threshold.');
  } else if (occupancyPct >= 75) {
    thresholdViolations.push('OCCUPANCY_HIGH');
    reasons.push('Zone occupancy is high (exceeded 75%).');
  }

  // Trend penalty
  if (zone.trend === 'RAPIDLY_RISING') {
    riskScore += 20;
    reasons.push('Crowd size is rising rapidly.');
  } else if (zone.trend === 'RISING') {
    riskScore += 10;
    reasons.push('Crowd size is increasing.');
  } else if (zone.trend === 'FALLING') {
    riskScore -= 5;
    reasons.push('Crowd density is decreasing.');
  }

  // Incident penalty
  const zoneIncidents = incidents.filter(inc => inc.zoneId === zone.id && inc.active);
  if (zoneIncidents.length > 0) {
    thresholdViolations.push('ACTIVE_INCIDENT');
    zoneIncidents.forEach(inc => {
      let penalty = 0;
      if (inc.severity === 'CRITICAL') {
        penalty = 40;
      } else if (inc.severity === 'HIGH') {
        penalty = 25;
      } else if (inc.severity === 'MEDIUM') {
        penalty = 15;
      } else {
        penalty = 5;
      }
      riskScore += penalty;
      reasons.push(`Active ${inc.severity} incident: "${inc.title}".`);
    });
  }

  // Cap risk score between 0 and 100
  riskScore = Math.max(0, Math.min(100, Math.round(riskScore)));

  if (riskScore >= 80) {
    thresholdViolations.push('RISK_CRITICAL');
  }

  // Attention level
  let recommendedAttentionLevel: AttentionLevel = 'NORMAL';
  if (riskScore >= 80) recommendedAttentionLevel = 'CRITICAL';
  else if (riskScore >= 60) recommendedAttentionLevel = 'HIGH';
  else if (riskScore >= 35) recommendedAttentionLevel = 'WATCH';

  return {
    zoneId: zone.id,
    occupancyPct,
    crowdLevel,
    trend: zone.trend,
    riskScore,
    thresholdViolations,
    reasons,
    recommendedAttentionLevel,
  };
}

export function generateAllInsights(zones: StadiumZone[], incidents: Incident[]): CrowdInsight[] {
  return zones.map(zone => calculateCrowdInsight(zone, incidents));
}
