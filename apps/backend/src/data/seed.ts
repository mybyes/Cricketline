/**
 * Built-in demo dataset. Served when no CricAPI key is configured (or SEED_DATA=1),
 * so the whole app — live feed, scorecards, ball-by-ball, results, fixtures — is fully
 * functional and demoable without burning API quota. Swap to live data at the last stage.
 */
import type { Match } from '../services/cricapi'

const team = (name: string, shortname: string) => ({ name, shortname, img: '' })

/** Build a plausible ball-by-ball list for an innings from a compact `runs` script. */
function buildBbb(innings: number, batsmen: [string, string], bowler: string, script: (number | 'W')[]) {
  return script.map((r, i) => ({
    ballNbr: i + 1,
    overNum: Math.floor(i / 6) + 1,
    innings,
    event: r === 'W' ? 'W' : String(r),
    runs: r === 'W' ? 0 : r,
    batsman: batsmen[i % 2],
    bowler,
  }))
}

export interface SeedScorecard {
  id: string
  name: string
  matchType: string
  status: string
  venue: string
  date: string
  teams: string[]
  teamInfo: { name: string; shortname: string; img: string }[]
  score: { r: number; w: number; o: number; inning: string }[]
  tossWinner?: string
  tossChoice?: string
  scorecard: {
    inning: string
    batting: { batsman: { id: string; name: string }; 'dismissal-text': string; r: number; b: number; '4s': number; '6s': number; sr: number }[]
    bowling: { bowler: { id: string; name: string }; o: number; m: number; r: number; w: number; eco: number }[]
    extras?: { t: number; b?: number; lb?: number; w?: number; nb?: number; p?: number }
    totals?: { r: number; w: number; o: number }
    fallOfWickets?: { wkt: number; player: string; runs: number; over: number }[]
    didNotBat?: string[]
  }[]
  matchStarted: boolean
  matchEnded: boolean
}

const baseMatch = (m: Partial<Match> & Pick<Match, 'id' | 'name' | 'status' | 'teams' | 'teamInfo'>): Match => ({
  matchType: 't20',
  venue: 'TBC',
  date: '2026-06-19',
  dateTimeGMT: '2026-06-19T14:00:00',
  score: [],
  series_id: 'seed-series',
  fantasyEnabled: true,
  bbbEnabled: true,
  hasSquad: true,
  matchStarted: false,
  matchEnded: false,
  ...m,
})

export const SEED_MATCHES: Match[] = [
  // ----- LIVE -----
  baseMatch({
    id: 'seed-live-1',
    name: 'Royal Challengers Bengaluru vs Mumbai Indians, 34th Match, IPL 2026',
    matchType: 't20',
    status: 'Mumbai Indians need 48 runs in 36 balls',
    venue: 'M. Chinnaswamy Stadium, Bengaluru',
    teams: ['Royal Challengers Bengaluru', 'Mumbai Indians'],
    teamInfo: [team('Royal Challengers Bengaluru', 'RCB'), team('Mumbai Indians', 'MI')],
    score: [
      { inning: 'Royal Challengers Bengaluru Inning', r: 201, w: 5, o: 20 },
      { inning: 'Mumbai Indians Inning', r: 154, w: 3, o: 14 },
    ],
    matchStarted: true,
    matchEnded: false,
  }),
  baseMatch({
    id: 'seed-live-2',
    name: 'India vs England, 2nd Test, England tour of India 2026',
    matchType: 'test',
    status: 'Day 2: India lead by 312 runs',
    venue: 'MA Chidambaram Stadium, Chennai',
    teams: ['India', 'England'],
    teamInfo: [team('India', 'IND'), team('England', 'ENG')],
    score: [
      { inning: 'India Inning 1', r: 438, w: 10, o: 121.3 },
      { inning: 'England Inning 1', r: 226, w: 10, o: 64.2 },
      { inning: 'India Inning 2', r: 100, w: 2, o: 28 },
    ],
    matchStarted: true,
    matchEnded: false,
  }),
  // ----- RECENT (ended) -----
  baseMatch({
    id: 'seed-recent-1',
    name: 'Chennai Super Kings vs Kolkata Knight Riders, 31st Match, IPL 2026',
    matchType: 't20',
    status: 'Chennai Super Kings won by 6 wickets',
    venue: 'MA Chidambaram Stadium, Chennai',
    dateTimeGMT: '2026-06-17T14:00:00',
    teams: ['Chennai Super Kings', 'Kolkata Knight Riders'],
    teamInfo: [team('Chennai Super Kings', 'CSK'), team('Kolkata Knight Riders', 'KKR')],
    score: [
      { inning: 'Kolkata Knight Riders Inning', r: 167, w: 8, o: 20 },
      { inning: 'Chennai Super Kings Inning', r: 168, w: 4, o: 18.5 },
    ],
    matchStarted: true,
    matchEnded: true,
  }),
  baseMatch({
    id: 'seed-recent-2',
    name: 'Australia vs South Africa, Final, ODI Series 2026',
    matchType: 'odi',
    status: 'Australia won by 22 runs',
    venue: 'Melbourne Cricket Ground, Melbourne',
    dateTimeGMT: '2026-06-15T03:30:00',
    teams: ['Australia', 'South Africa'],
    teamInfo: [team('Australia', 'AUS'), team('South Africa', 'SA')],
    score: [
      { inning: 'Australia Inning', r: 318, w: 7, o: 50 },
      { inning: 'South Africa Inning', r: 296, w: 10, o: 48.4 },
    ],
    matchStarted: true,
    matchEnded: true,
  }),
  // ----- UPCOMING -----
  baseMatch({
    id: 'seed-up-1',
    name: 'Gujarat Titans vs Rajasthan Royals, 36th Match, IPL 2026',
    status: 'Match starts at Jun 20, 14:00 GMT',
    venue: 'Narendra Modi Stadium, Ahmedabad',
    date: '2026-06-20', dateTimeGMT: '2026-06-20T14:00:00',
    teams: ['Gujarat Titans', 'Rajasthan Royals'],
    teamInfo: [team('Gujarat Titans', 'GT'), team('Rajasthan Royals', 'RR')],
  }),
  baseMatch({
    id: 'seed-up-2',
    name: 'Delhi Capitals vs Punjab Kings, 37th Match, IPL 2026',
    status: 'Match starts at Jun 21, 10:00 GMT',
    venue: 'Arun Jaitley Stadium, Delhi',
    date: '2026-06-21', dateTimeGMT: '2026-06-21T10:00:00',
    teams: ['Delhi Capitals', 'Punjab Kings'],
    teamInfo: [team('Delhi Capitals', 'DC'), team('Punjab Kings', 'PBKS')],
  }),
  baseMatch({
    id: 'seed-up-3',
    name: 'New Zealand vs Pakistan, 1st T20I, Pakistan tour of New Zealand 2026',
    status: 'Match starts at Jun 22, 07:00 GMT',
    venue: 'Eden Park, Auckland',
    date: '2026-06-22', dateTimeGMT: '2026-06-22T07:00:00',
    teams: ['New Zealand', 'Pakistan'],
    teamInfo: [team('New Zealand', 'NZ'), team('Pakistan', 'PAK')],
  }),
]

const SC_RCB_MI: SeedScorecard = {
  id: 'seed-live-1',
  name: 'Royal Challengers Bengaluru vs Mumbai Indians, 34th Match, IPL 2026',
  matchType: 't20',
  status: 'Mumbai Indians need 48 runs in 36 balls',
  venue: 'M. Chinnaswamy Stadium, Bengaluru',
  date: '2026-06-19',
  teams: ['Royal Challengers Bengaluru', 'Mumbai Indians'],
  teamInfo: [team('Royal Challengers Bengaluru', 'RCB'), team('Mumbai Indians', 'MI')],
  score: [
    { inning: 'Royal Challengers Bengaluru Inning', r: 201, w: 5, o: 20 },
    { inning: 'Mumbai Indians Inning', r: 154, w: 3, o: 14 },
  ],
  tossWinner: 'Mumbai Indians',
  tossChoice: 'bowl',
  matchStarted: true,
  matchEnded: false,
  scorecard: [
    {
      inning: 'Royal Challengers Bengaluru Inning',
      totals: { r: 201, w: 5, o: 20 },
      extras: { t: 11, w: 6, lb: 3, nb: 2 },
      batting: [
        { batsman: { id: 'p1', name: 'V Kohli' }, 'dismissal-text': 'c Surya b Bumrah', r: 74, b: 44, '4s': 8, '6s': 3, sr: 168.2 },
        { batsman: { id: 'p2', name: 'F du Plessis' }, 'dismissal-text': 'b Boult', r: 31, b: 22, '4s': 4, '6s': 1, sr: 140.9 },
        { batsman: { id: 'p3', name: 'G Maxwell' }, 'dismissal-text': 'c Rohit b Chahar', r: 48, b: 21, '4s': 3, '6s': 4, sr: 228.6 },
        { batsman: { id: 'p4', name: 'D Padikkal' }, 'dismissal-text': 'not out', r: 29, b: 18, '4s': 2, '6s': 1, sr: 161.1 },
      ],
      bowling: [
        { bowler: { id: 'b1', name: 'J Bumrah' }, o: 4, m: 0, r: 31, w: 2, eco: 7.75 },
        { bowler: { id: 'b2', name: 'T Boult' }, o: 4, m: 0, r: 42, w: 1, eco: 10.5 },
        { bowler: { id: 'b3', name: 'D Chahar' }, o: 4, m: 0, r: 38, w: 1, eco: 9.5 },
      ],
      fallOfWickets: [
        { wkt: 1, player: 'F du Plessis', runs: 68, over: 6.3 },
        { wkt: 2, player: 'V Kohli', runs: 142, over: 14.5 },
        { wkt: 3, player: 'G Maxwell', runs: 178, over: 17.2 },
        { wkt: 4, player: 'R Patidar', runs: 190, over: 18.4 },
        { wkt: 5, player: 'D Karthik', runs: 199, over: 19.4 },
      ],
      didNotBat: ['M Siraj', 'J Hazlewood', 'Y Chahal'],
    },
    {
      inning: 'Mumbai Indians Inning',
      totals: { r: 154, w: 3, o: 14 },
      extras: { t: 8, w: 4, lb: 2, nb: 2 },
      batting: [
        { batsman: { id: 'p5', name: 'Rohit Sharma' }, 'dismissal-text': 'c Maxwell b Siraj', r: 42, b: 26, '4s': 5, '6s': 2, sr: 161.5 },
        { batsman: { id: 'p7', name: 'I Kishan' }, 'dismissal-text': 'b Hazlewood', r: 24, b: 17, '4s': 3, '6s': 1, sr: 141.2 },
        { batsman: { id: 'p8', name: 'Tilak Varma' }, 'dismissal-text': 'run out (Kohli)', r: 8, b: 6, '4s': 1, '6s': 0, sr: 133.3 },
        { batsman: { id: 'p6', name: 'S Yadav' }, 'dismissal-text': 'batting', r: 58, b: 31, '4s': 5, '6s': 4, sr: 187.1 },
        { batsman: { id: 'p9', name: 'H Pandya' }, 'dismissal-text': 'batting', r: 14, b: 8, '4s': 1, '6s': 1, sr: 175.0 },
      ],
      bowling: [
        { bowler: { id: 'b4', name: 'M Siraj' }, o: 3, m: 0, r: 28, w: 1, eco: 9.33 },
        { bowler: { id: 'b5', name: 'J Hazlewood' }, o: 3, m: 0, r: 34, w: 1, eco: 11.33 },
        { bowler: { id: 'b3', name: 'G Maxwell' }, o: 3, m: 0, r: 32, w: 0, eco: 10.67 },
        { bowler: { id: 'b6', name: 'Y Chahal' }, o: 3, m: 0, r: 30, w: 1, eco: 10.0 },
        { bowler: { id: 'b7', name: 'K Pandya' }, o: 2, m: 0, r: 28, w: 0, eco: 14.0 },
      ],
      fallOfWickets: [
        { wkt: 1, player: 'Rohit Sharma', runs: 61, over: 4.2 },
        { wkt: 2, player: 'I Kishan', runs: 88, over: 7.4 },
        { wkt: 3, player: 'Tilak Varma', runs: 120, over: 10.5 },
      ],
      didNotBat: ['T David', 'N Wadhera', 'P Chawla', 'A Madhwal'],
    },
  ],
}

const SC_CSK_KKR: SeedScorecard = {
  id: 'seed-recent-1',
  name: 'Chennai Super Kings vs Kolkata Knight Riders, 31st Match, IPL 2026',
  matchType: 't20',
  status: 'Chennai Super Kings won by 6 wickets',
  venue: 'MA Chidambaram Stadium, Chennai',
  date: '2026-06-17',
  teams: ['Chennai Super Kings', 'Kolkata Knight Riders'],
  teamInfo: [team('Chennai Super Kings', 'CSK'), team('Kolkata Knight Riders', 'KKR')],
  score: [
    { inning: 'Kolkata Knight Riders Inning', r: 167, w: 8, o: 20 },
    { inning: 'Chennai Super Kings Inning', r: 168, w: 4, o: 18.5 },
  ],
  tossWinner: 'Chennai Super Kings',
  tossChoice: 'bowl',
  matchStarted: true,
  matchEnded: true,
  scorecard: [
    {
      inning: 'Kolkata Knight Riders Inning',
      totals: { r: 167, w: 8, o: 20 },
      extras: { t: 9, w: 5, lb: 2, nb: 2 },
      batting: [
        { batsman: { id: 'k1', name: 'S Gill' }, 'dismissal-text': 'c Jadeja b Pathirana', r: 52, b: 38, '4s': 5, '6s': 2, sr: 136.8 },
        { batsman: { id: 'k2', name: 'A Russell' }, 'dismissal-text': 'c Dube b Chahar', r: 41, b: 19, '4s': 2, '6s': 4, sr: 215.8 },
      ],
      bowling: [
        { bowler: { id: 'c1', name: 'M Pathirana' }, o: 4, m: 0, r: 29, w: 3, eco: 7.25 },
        { bowler: { id: 'c2', name: 'R Jadeja' }, o: 4, m: 0, r: 26, w: 2, eco: 6.5 },
      ],
      fallOfWickets: [
        { wkt: 1, player: 'N Rana', runs: 34, over: 3.5 },
        { wkt: 2, player: 'S Gill', runs: 98, over: 12.1 },
        { wkt: 3, player: 'A Russell', runs: 142, over: 17.3 },
      ],
      didNotBat: ['H Sharma', 'V Chakaravarthy'],
    },
    {
      inning: 'Chennai Super Kings Inning',
      totals: { r: 168, w: 4, o: 18.5 },
      extras: { t: 7, w: 5, lb: 2 },
      batting: [
        { batsman: { id: 'c3', name: 'R Gaikwad' }, 'dismissal-text': 'c & b Narine', r: 63, b: 41, '4s': 7, '6s': 2, sr: 153.7 },
        { batsman: { id: 'c4', name: 'S Dube' }, 'dismissal-text': 'not out', r: 54, b: 30, '4s': 3, '6s': 4, sr: 180.0 },
      ],
      bowling: [
        { bowler: { id: 'k3', name: 'S Narine' }, o: 4, m: 0, r: 31, w: 2, eco: 7.75 },
        { bowler: { id: 'k4', name: 'V Chakaravarthy' }, o: 3.5, m: 0, r: 38, w: 1, eco: 9.91 },
      ],
      fallOfWickets: [
        { wkt: 1, player: 'D Conway', runs: 41, over: 4.2 },
        { wkt: 2, player: 'A Rahane', runs: 77, over: 9.1 },
        { wkt: 3, player: 'R Gaikwad', runs: 138, over: 15.4 },
        { wkt: 4, player: 'M Ali', runs: 150, over: 16.5 },
      ],
      didNotBat: ['MS Dhoni', 'R Jadeja', 'D Chahar'],
    },
  ],
}

export const SEED_SCORECARDS: Record<string, SeedScorecard> = {
  'seed-live-1': SC_RCB_MI,
  'seed-recent-1': SC_CSK_KKR,
}

export const SEED_BBB: Record<string, ReturnType<typeof buildBbb>> = {
  // RCB v MI — Mumbai's chase, recent overs
  'seed-live-1': [
    ...buildBbb(2, ['Rohit Sharma', 'S Yadav'], 'M Siraj', [1, 4, 0, 6, 1, 2]),
    ...buildBbb(2, ['S Yadav', 'Rohit Sharma'], 'J Hazlewood', [4, 1, 6, 0, 'W', 1]),
    ...buildBbb(2, ['Rohit Sharma', 'I Kishan'], 'M Siraj', [6, 2, 1, 4, 1, 0]),
    ...buildBbb(2, ['S Yadav', 'I Kishan'], 'G Maxwell', [1, 6, 4, 2, 1, 4]),
  ],
  // India 2nd innings — Test, recent over
  'seed-live-2': [
    ...buildBbb(3, ['R Sharma', 'Y Jaiswal'], 'J Anderson', [0, 4, 1, 0, 2, 1]),
    ...buildBbb(3, ['Y Jaiswal', 'R Sharma'], 'B Stokes', [1, 0, 4, 0, 0, 'W']),
  ],
}

export const SEED_SQUADS: Record<string, { team: string; players: { player: { id: string; name: string }; role?: string }[] }[]> = {
  'seed-live-1': [
    {
      team: 'Royal Challengers Bengaluru',
      players: [
        { player: { id: 'p1', name: 'V Kohli' }, role: 'Batsman' },
        { player: { id: 'p2', name: 'F du Plessis' }, role: 'Batsman' },
        { player: { id: 'p3', name: 'G Maxwell' }, role: 'All-rounder' },
        { player: { id: 'b6', name: 'M Siraj' }, role: 'Bowler' },
      ],
    },
    {
      team: 'Mumbai Indians',
      players: [
        { player: { id: 'p5', name: 'Rohit Sharma' }, role: 'Batsman' },
        { player: { id: 'p6', name: 'S Yadav' }, role: 'Batsman' },
        { player: { id: 'b1', name: 'J Bumrah' }, role: 'Bowler' },
        { player: { id: 'b2', name: 'T Boult' }, role: 'Bowler' },
      ],
    },
  ],
}
