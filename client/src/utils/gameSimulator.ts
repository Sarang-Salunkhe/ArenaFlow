import { MatchPhase } from '../types';

export interface GameEvent {
  minute: number;
  text: string;
  type: 'goal' | 'card' | 'sub' | 'info';
}

export interface MatchStats {
  homeScore: number;
  awayScore: number;
  homeTeam: string;
  awayTeam: string;
  possession: [number, number]; // home, away
  shots: [number, number];
  fouls: [number, number];
  yellowCards: [number, number];
  corners: [number, number];
  commentary: GameEvent[];
  activeMinute: number;
}

export function getMatchStats(phase: MatchPhase, tickCount: number): MatchStats {
  const homeTeam = "USA";
  const awayTeam = "GER";

  const preMatchStats: MatchStats = {
    homeScore: 0,
    awayScore: 0,
    homeTeam,
    awayTeam,
    possession: [50, 50],
    shots: [0, 0],
    fouls: [0, 0],
    yellowCards: [0, 0],
    corners: [0, 0],
    activeMinute: 0,
    commentary: [
      { minute: 0, type: 'info', text: 'Teams have concluded their technical warm-ups. Stadium doors are open.' },
      { minute: 0, type: 'info', text: 'Stunning sunny skies over MetLife Stadium with optimal pitch conditions.' }
    ]
  };

  const entrySurgeStats: MatchStats = {
    ...preMatchStats,
    commentary: [
      { minute: 0, type: 'info', text: 'Opening ceremonies are underway. Spectacular standard displays visible.' },
      { minute: 0, type: 'info', text: 'Managers Gregg Berhalter and Julian Nagelsmann sharing details in their pre-match briefs.' },
      { minute: 0, type: 'info', text: 'MetLife Stadium capacity is near 100% full as national anthems commence.' }
    ]
  };

  const halfTimeStats: MatchStats = {
    homeScore: 1,
    awayScore: 1,
    homeTeam,
    awayTeam,
    possession: [47, 53],
    shots: [6, 8],
    fouls: [5, 4],
    yellowCards: [0, 1],
    corners: [2, 3],
    activeMinute: 45,
    commentary: [
      { minute: 45, type: 'info', text: 'Halftime whistle blows. A thrilling first half ends 1-1.' },
      { minute: 44, type: 'goal', text: 'GOAL! GERMANY. Jamal Musiala dribbles past two defenders and fires a low shot into the bottom corner.' },
      { minute: 32, type: 'card', text: 'Yellow Card GER: Antonio Rüdiger for a late tactical tackle on Balogun.' },
      { minute: 24, type: 'goal', text: 'GOAL! USA. Christian Pulisic receives a superb cross-field pass, cuts inside, and fires an unstoppable curler into the top corner!' },
      { minute: 12, type: 'info', text: 'Close chance! McKennie meets a corner with a header, but it just skims the crossbar.' },
      { minute: 1, type: 'info', text: 'Kickoff! USA vs Germany Group Match 18 is officially underway.' }
    ]
  };

  // Match Active evolving ticks
  if (phase === 'MATCH_ACTIVE') {
    // We map ticks 0, 1, 2, 3, 4, 5+ to progressive states
    const activeCommentary: GameEvent[] = [
      { minute: 1, type: 'info', text: 'Kickoff! USA vs Germany Group Match 18 is officially underway.' }
    ];
    let activeMinute = Math.min(45, Math.max(1, tickCount * 9));
    let homeScore = 0;
    let awayScore = 0;
    let shots: [number, number] = [0, 0];
    let fouls: [number, number] = [0, 0];
    let corners: [number, number] = [0, 0];
    let yellowCards: [number, number] = [0, 0];
    let possession: [number, number] = [50, 50];

    if (tickCount >= 1) {
      shots = [2, 1];
      fouls = [1, 1];
      corners = [1, 0];
      possession = [52, 48];
      activeCommentary.unshift({ minute: 8, type: 'info', text: 'USA pressuring high. Robinson swings a dangerous ball across, cleared by Süle.' });
    }
    if (tickCount >= 2) {
      homeScore = 1;
      shots = [4, 3];
      fouls = [2, 2];
      corners = [2, 1];
      possession = [49, 51];
      activeCommentary.unshift({ minute: 17, type: 'info', text: 'German keeper Ter Stegen handles a strong header from Weah.' });
      activeCommentary.unshift({ minute: 24, type: 'goal', text: 'GOAL! USA. Christian Pulisic receives a superb cross-field pass, cuts inside, and fires an unstoppable curler into the top corner!' });
    }
    if (tickCount >= 3) {
      shots = [5, 5];
      fouls = [3, 4];
      corners = [2, 2];
      yellowCards = [0, 1];
      possession = [46, 54];
      activeCommentary.unshift({ minute: 32, type: 'card', text: 'Yellow Card GER: Antonio Rüdiger for a late tactical tackle on Balogun.' });
      activeCommentary.unshift({ minute: 38, type: 'info', text: 'Germany dominating possession now, probing the USA low block.' });
    }
    if (tickCount >= 4) {
      awayScore = 1;
      shots = [6, 8];
      fouls = [5, 4];
      corners = [2, 3];
      possession = [47, 53];
      activeCommentary.unshift({ minute: 44, type: 'goal', text: 'GOAL! GERMANY. Jamal Musiala dribbles past two defenders and fires a low shot into the bottom corner.' });
    }
    if (tickCount >= 5) {
      activeMinute = 45;
      shots = [6, 8];
      fouls = [5, 4];
      corners = [2, 3];
      possession = [47, 53];
      activeCommentary.unshift({ minute: 45, type: 'info', text: 'Ref blows the whistle for halftime. A breath-taking first half draws to a close at 1-1.' });
    }

    return {
      homeScore,
      awayScore,
      homeTeam,
      awayTeam,
      possession,
      shots,
      fouls,
      yellowCards,
      corners,
      activeMinute,
      commentary: activeCommentary
    };
  }

  // End of match phases
  if (phase === 'MATCH_END' || phase === 'EXIT_SURGE') {
    const activeCommentary: GameEvent[] = [
      { minute: 90, type: 'info', text: 'Full Time! A thrilling, dramatic 2-2 draw between USA and Germany!' },
      { minute: 84, type: 'goal', text: 'GOAL! GERMANY. Kai Havertz jumps highest to score a thunderous header from a corner kick! GER tie it 2-2.' },
      { minute: 78, type: 'card', text: 'Yellow Card USA: Weston McKennie for persistent inflowing fouls.' },
      { minute: 72, type: 'goal', text: 'GOAL! USA. Folarin Balogun hammers in a rebound off the post! USA leads 2-1.' },
      { minute: 58, type: 'sub', text: 'Substitution USA: Gio Reyna replaces Timothy Weah in search of creative sparks.' },
      { minute: 46, type: 'info', text: 'Second Half Kickoff! Neither side made tactical substitutions during the break.' },
      ...halfTimeStats.commentary
    ];

    let homeScore = 2;
    let awayScore = 2;
    let possession: [number, number] = [45, 55];
    let shots: [number, number] = [11, 15];
    let fouls: [number, number] = [12, 10];
    let yellowCards: [number, number] = [1, 2];
    let corners: [number, number] = [4, 7];
    let activeMinute = 90;

    // Evolve second half if tickCount is low during MATCH_END
    if (tickCount === 0) {
      activeMinute = 46;
      homeScore = 1;
      awayScore = 1;
      possession = [47, 53];
      shots = [6, 8];
      fouls = [5, 4];
      yellowCards = [0, 1];
      corners = [2, 3];
      return {
        homeScore,
        awayScore,
        homeTeam,
        awayTeam,
        possession,
        shots,
        fouls,
        yellowCards,
        corners,
        activeMinute,
        commentary: [
          { minute: 46, type: 'info', text: 'Second Half Kickoff! Neither side made tactical substitutions during the break.' },
          ...halfTimeStats.commentary
        ]
      };
    } else if (tickCount === 1) {
      activeMinute = 60;
      homeScore = 1;
      awayScore = 1;
      possession = [46, 54];
      shots = [7, 10];
      fouls = [7, 6];
      yellowCards = [0, 1];
      corners = [3, 4];
      return {
        homeScore,
        awayScore,
        homeTeam,
        awayTeam,
        possession,
        shots,
        fouls,
        yellowCards,
        corners,
        activeMinute,
        commentary: [
          { minute: 58, type: 'sub', text: 'Substitution USA: Gio Reyna replaces Timothy Weah in search of creative sparks.' },
          { minute: 46, type: 'info', text: 'Second Half Kickoff! Neither side made tactical substitutions during the break.' },
          ...halfTimeStats.commentary
        ]
      };
    } else if (tickCount === 2) {
      activeMinute = 75;
      homeScore = 2;
      awayScore = 1;
      possession = [48, 52];
      shots = [9, 11];
      fouls = [9, 8];
      yellowCards = [0, 2];
      corners = [4, 5];
      return {
        homeScore,
        awayScore,
        homeTeam,
        awayTeam,
        possession,
        shots,
        fouls,
        yellowCards,
        corners,
        activeMinute,
        commentary: [
          { minute: 72, type: 'goal', text: 'GOAL! USA. Folarin Balogun hammers in a rebound off the post! USA leads 2-1.' },
          { minute: 58, type: 'sub', text: 'Substitution USA: Gio Reyna replaces Timothy Weah in search of creative sparks.' },
          ...halfTimeStats.commentary
        ]
      };
    } else if (tickCount === 3) {
      activeMinute = 85;
      homeScore = 2;
      awayScore = 2;
      possession = [45, 55];
      shots = [10, 14];
      fouls = [11, 10];
      yellowCards = [1, 2];
      corners = [4, 7];
      return {
        homeScore,
        awayScore,
        homeTeam,
        awayTeam,
        possession,
        shots,
        fouls,
        yellowCards,
        corners,
        activeMinute,
        commentary: [
          { minute: 84, type: 'goal', text: 'GOAL! GERMANY. Kai Havertz jumps highest to score a thunderous header from a corner kick! GER tie it 2-2.' },
          { minute: 78, type: 'card', text: 'Yellow Card USA: Weston McKennie for persistent inflowing fouls.' },
          { minute: 72, type: 'goal', text: 'GOAL! USA. Folarin Balogun hammers in a rebound off the post! USA leads 2-1.' },
          ...halfTimeStats.commentary
        ]
      };
    }

    return {
      homeScore,
      awayScore,
      homeTeam,
      awayTeam,
      possession,
      shots,
      fouls,
      yellowCards,
      corners,
      activeMinute,
      commentary: activeCommentary
    };
  }

  if (phase === 'ENTRY_SURGE') {
    return entrySurgeStats;
  }

  if (phase === 'HALF_TIME') {
    return halfTimeStats;
  }

  // Pre-match fallback
  return preMatchStats;
}
