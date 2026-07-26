/**
 * Built-in demo dataset. Served when no CricAPI key is configured (or SEED_DATA=1),
 * so the whole app — live feed, scorecards, ball-by-ball, results, fixtures — is fully
 * functional and demoable without burning API quota. Swap to live data at the last stage.
 */
import type { Match } from '../services/cricapi'

const team = (name: string, shortname: string) => ({ name, shortname, img: '' })

/** Build a plausible ball-by-ball list. `startBall` continues numbering across overs. */
function buildBbb(
  innings: number,
  batsmen: [string, string],
  bowler: string,
  script: (number | 'W')[],
  startBall = 0,
) {
  return script.map((r, i) => {
    const n = startBall + i
    return {
      ballNbr: n + 1,
      overNum: Math.floor(n / 6) + 1,
      innings,
      event: r === 'W' ? 'W' : String(r),
      runs: r === 'W' ? 0 : r,
      batsman: batsmen[i % 2],
      bowler,
    }
  })
}

/** Concatenate over scripts with continuous ballNbr / overNum. */
function chainBbb(
  innings: number,
  overs: { batsmen: [string, string]; bowler: string; script: (number | 'W')[] }[],
  startBall = 0,
) {
  let start = startBall
  const out: ReturnType<typeof buildBbb> = []
  for (const o of overs) {
    out.push(...buildBbb(innings, o.batsmen, o.bowler, o.script, start))
    start += o.script.length
  }
  return out
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
    overRuns?: number[]
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

  // ----- HISTORIC RESULTS (archive / form / head-to-head) -----
  baseMatch({
    id: 'seed-h-1', matchType: 't20', matchStarted: true, matchEnded: true,
    name: 'Mumbai Indians vs Royal Challengers Bengaluru, 22nd Match, IPL 2026',
    status: 'Mumbai Indians won by 7 wickets', venue: 'Wankhede Stadium, Mumbai',
    date: '2026-06-05', dateTimeGMT: '2026-06-05T14:00:00',
    teams: ['Mumbai Indians', 'Royal Challengers Bengaluru'],
    teamInfo: [team('Mumbai Indians', 'MI'), team('Royal Challengers Bengaluru', 'RCB')],
    score: [{ inning: 'Royal Challengers Bengaluru Inning', r: 178, w: 6, o: 20 }, { inning: 'Mumbai Indians Inning', r: 179, w: 3, o: 18.4 }],
  }),
  baseMatch({
    id: 'seed-h-2', matchType: 'odi', matchStarted: true, matchEnded: true,
    name: 'India vs England, 3rd ODI, England tour of India 2026',
    status: 'India won by 4 wickets', venue: 'Eden Gardens, Kolkata',
    date: '2026-06-02', dateTimeGMT: '2026-06-02T08:30:00',
    teams: ['India', 'England'],
    teamInfo: [team('India', 'IND'), team('England', 'ENG')],
    score: [{ inning: 'England Inning', r: 289, w: 9, o: 50 }, { inning: 'India Inning', r: 292, w: 6, o: 48.5 }],
  }),
  baseMatch({
    id: 'seed-h-3', matchType: 't20', matchStarted: true, matchEnded: true,
    name: 'Chennai Super Kings vs Mumbai Indians, 18th Match, IPL 2026',
    status: 'Chennai Super Kings won by 5 runs', venue: 'MA Chidambaram Stadium, Chennai',
    date: '2026-05-30', dateTimeGMT: '2026-05-30T14:00:00',
    teams: ['Chennai Super Kings', 'Mumbai Indians'],
    teamInfo: [team('Chennai Super Kings', 'CSK'), team('Mumbai Indians', 'MI')],
    score: [{ inning: 'Chennai Super Kings Inning', r: 192, w: 5, o: 20 }, { inning: 'Mumbai Indians Inning', r: 187, w: 8, o: 20 }],
  }),
  baseMatch({
    id: 'seed-h-4', matchType: 't20', matchStarted: true, matchEnded: true,
    name: 'Kolkata Knight Riders vs Gujarat Titans, 15th Match, IPL 2026',
    status: 'Gujarat Titans won by 3 wickets', venue: 'Eden Gardens, Kolkata',
    date: '2026-05-27', dateTimeGMT: '2026-05-27T14:00:00',
    teams: ['Kolkata Knight Riders', 'Gujarat Titans'],
    teamInfo: [team('Kolkata Knight Riders', 'KKR'), team('Gujarat Titans', 'GT')],
    score: [{ inning: 'Kolkata Knight Riders Inning', r: 165, w: 7, o: 20 }, { inning: 'Gujarat Titans Inning', r: 166, w: 7, o: 19.5 }],
  }),
  baseMatch({
    id: 'seed-h-5', matchType: 'odi', matchStarted: true, matchEnded: true,
    name: 'Australia vs South Africa, 2nd ODI, South Africa tour of Australia 2026',
    status: 'South Africa won by 18 runs', venue: 'Adelaide Oval, Adelaide',
    date: '2026-06-12', dateTimeGMT: '2026-06-12T03:30:00',
    teams: ['Australia', 'South Africa'],
    teamInfo: [team('Australia', 'AUS'), team('South Africa', 'SA')],
    score: [{ inning: 'South Africa Inning', r: 301, w: 8, o: 50 }, { inning: 'Australia Inning', r: 283, w: 10, o: 48.2 }],
  }),
  baseMatch({
    id: 'seed-h-6', matchType: 't20', matchStarted: true, matchEnded: true,
    name: 'Rajasthan Royals vs Punjab Kings, 12th Match, IPL 2026',
    status: 'Rajasthan Royals won by 9 wickets', venue: 'Sawai Mansingh Stadium, Jaipur',
    date: '2026-05-24', dateTimeGMT: '2026-05-24T14:00:00',
    teams: ['Rajasthan Royals', 'Punjab Kings'],
    teamInfo: [team('Rajasthan Royals', 'RR'), team('Punjab Kings', 'PBKS')],
    score: [{ inning: 'Punjab Kings Inning', r: 156, w: 9, o: 20 }, { inning: 'Rajasthan Royals Inning', r: 157, w: 1, o: 17.2 }],
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
      overRuns: [8, 12, 14, 6, 11, 9, 7, 10, 13, 8, 9, 11, 7, 12, 10, 14, 9, 12, 8, 11],
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
      overRuns: [11, 9, 14, 10, 12, 9, 10, 13, 9, 12, 14, 11, 10, 10],
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

const SC_IND_ENG: SeedScorecard = {
  id: 'seed-live-2',
  name: 'India vs England, 2nd Test, England tour of India 2026',
  matchType: 'test',
  status: 'Day 2: India lead by 312 runs',
  venue: 'MA Chidambaram Stadium, Chennai',
  date: '2026-06-19',
  teams: ['India', 'England'],
  teamInfo: [team('India', 'IND'), team('England', 'ENG')],
  score: [
    { inning: 'India Inning 1', r: 438, w: 10, o: 121.3 },
    { inning: 'England Inning 1', r: 226, w: 10, o: 64.2 },
    { inning: 'India Inning 2', r: 100, w: 2, o: 28 },
  ],
  tossWinner: 'India',
  tossChoice: 'bat',
  matchStarted: true,
  matchEnded: false,
  scorecard: [
    {
      inning: 'India Inning 1',
      totals: { r: 438, w: 10, o: 121.3 },
      extras: { t: 18, b: 4, lb: 8, w: 4, nb: 2 },
      batting: [
        { batsman: { id: 'i1', name: 'Y Jaiswal' }, 'dismissal-text': 'c Root b Anderson', r: 112, b: 148, '4s': 14, '6s': 2, sr: 75.7 },
        { batsman: { id: 'i2', name: 'R Sharma' }, 'dismissal-text': 'lbw b Stokes', r: 86, b: 132, '4s': 9, '6s': 1, sr: 65.2 },
        { batsman: { id: 'i3', name: 'V Kohli' }, 'dismissal-text': 'c Foakes b Wood', r: 74, b: 98, '4s': 8, '6s': 1, sr: 75.5 },
        { batsman: { id: 'i4', name: 'R Pant' }, 'dismissal-text': 'b Atkinson', r: 61, b: 55, '4s': 6, '6s': 3, sr: 110.9 },
      ],
      bowling: [
        { bowler: { id: 'e1', name: 'J Anderson' }, o: 24, m: 4, r: 78, w: 3, eco: 3.25 },
        { bowler: { id: 'e2', name: 'B Stokes' }, o: 18, m: 2, r: 66, w: 2, eco: 3.67 },
        { bowler: { id: 'e3', name: 'M Wood' }, o: 20, m: 1, r: 92, w: 2, eco: 4.60 },
      ],
      fallOfWickets: [
        { wkt: 1, player: 'Y Jaiswal', runs: 198, over: 52.3 },
        { wkt: 2, player: 'R Sharma', runs: 286, over: 78.1 },
      ],
      overRuns: [],
    },
    {
      inning: 'England Inning 1',
      totals: { r: 226, w: 10, o: 64.2 },
      extras: { t: 12, b: 2, lb: 6, w: 2, nb: 2 },
      batting: [
        { batsman: { id: 'e4', name: 'Z Crawley' }, 'dismissal-text': 'c Pant b Bumrah', r: 38, b: 44, '4s': 5, '6s': 0, sr: 86.4 },
        { batsman: { id: 'e5', name: 'J Root' }, 'dismissal-text': 'b Ashwin', r: 67, b: 102, '4s': 6, '6s': 0, sr: 65.7 },
        { batsman: { id: 'e6', name: 'H Brook' }, 'dismissal-text': 'c Kohli b Siraj', r: 41, b: 48, '4s': 4, '6s': 1, sr: 85.4 },
      ],
      bowling: [
        { bowler: { id: 'i5', name: 'J Bumrah' }, o: 16, m: 3, r: 48, w: 4, eco: 3.00 },
        { bowler: { id: 'i6', name: 'R Ashwin' }, o: 18, m: 2, r: 62, w: 3, eco: 3.44 },
        { bowler: { id: 'i7', name: 'M Siraj' }, o: 12, m: 1, r: 44, w: 2, eco: 3.67 },
      ],
      fallOfWickets: [
        { wkt: 1, player: 'Z Crawley', runs: 54, over: 12.2 },
        { wkt: 2, player: 'J Root', runs: 148, over: 42.5 },
      ],
      overRuns: [],
    },
    {
      inning: 'India Inning 2',
      totals: { r: 100, w: 2, o: 28 },
      extras: { t: 4, lb: 2, w: 1, nb: 1 },
      batting: [
        { batsman: { id: 'i1', name: 'Y Jaiswal' }, 'dismissal-text': 'batting', r: 48, b: 72, '4s': 6, '6s': 0, sr: 66.7 },
        { batsman: { id: 'i2', name: 'R Sharma' }, 'dismissal-text': 'c Foakes b Anderson', r: 22, b: 41, '4s': 3, '6s': 0, sr: 53.7 },
        { batsman: { id: 'i8', name: 'S Gill' }, 'dismissal-text': 'c Brook b Stokes', r: 12, b: 18, '4s': 2, '6s': 0, sr: 66.7 },
        { batsman: { id: 'i3', name: 'V Kohli' }, 'dismissal-text': 'batting', r: 14, b: 27, '4s': 2, '6s': 0, sr: 51.9 },
      ],
      bowling: [
        { bowler: { id: 'e1', name: 'J Anderson' }, o: 8, m: 2, r: 22, w: 1, eco: 2.75 },
        { bowler: { id: 'e2', name: 'B Stokes' }, o: 7, m: 1, r: 28, w: 1, eco: 4.00 },
        { bowler: { id: 'e3', name: 'M Wood' }, o: 6, m: 0, r: 24, w: 0, eco: 4.00 },
      ],
      fallOfWickets: [
        { wkt: 1, player: 'R Sharma', runs: 58, over: 16.3 },
        { wkt: 2, player: 'S Gill', runs: 78, over: 21.1 },
      ],
      overRuns: [],
    },
  ],
}

export const SEED_SCORECARDS: Record<string, SeedScorecard> = {
  'seed-live-1': SC_RCB_MI,
  'seed-live-2': SC_IND_ENG,
  'seed-recent-1': SC_CSK_KKR,
}

export const SEED_BBB: Record<string, ReturnType<typeof buildBbb>> = {
  // RCB v MI — Mumbai chase overs 11–14 (startBall = 60 → Over 11)
  'seed-live-1': chainBbb(2, [
    { batsmen: ['Rohit Sharma', 'S Yadav'], bowler: 'M Siraj', script: [1, 4, 0, 6, 1, 2] },
    { batsmen: ['S Yadav', 'Rohit Sharma'], bowler: 'J Hazlewood', script: [4, 1, 6, 0, 'W', 1] },
    { batsmen: ['Rohit Sharma', 'I Kishan'], bowler: 'M Siraj', script: [6, 2, 1, 4, 1, 0] },
    { batsmen: ['S Yadav', 'I Kishan'], bowler: 'G Maxwell', script: [1, 6, 4, 2, 1, 4] },
  ], 60),
  // India 2nd innings — Test (sample overs 28–29)
  'seed-live-2': chainBbb(3, [
    { batsmen: ['R Sharma', 'Y Jaiswal'], bowler: 'J Anderson', script: [0, 4, 1, 0, 2, 1] },
    { batsmen: ['Y Jaiswal', 'R Sharma'], bowler: 'B Stokes', script: [1, 0, 4, 0, 0, 'W'] },
  ], 27 * 6),
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
  'seed-live-2': [
    {
      team: 'India',
      players: [
        { player: { id: 'i1', name: 'Y Jaiswal' }, role: 'Batsman' },
        { player: { id: 'i2', name: 'R Sharma' }, role: 'Batsman' },
        { player: { id: 'i3', name: 'V Kohli' }, role: 'Batsman' },
        { player: { id: 'i5', name: 'J Bumrah' }, role: 'Bowler' },
      ],
    },
    {
      team: 'England',
      players: [
        { player: { id: 'e4', name: 'Z Crawley' }, role: 'Batsman' },
        { player: { id: 'e5', name: 'J Root' }, role: 'Batsman' },
        { player: { id: 'e1', name: 'J Anderson' }, role: 'Bowler' },
        { player: { id: 'e2', name: 'B Stokes' }, role: 'All-rounder' },
      ],
    },
  ],
}
