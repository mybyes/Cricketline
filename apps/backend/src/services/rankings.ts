/**
 * ICC-style rankings. CricAPI doesn't expose rankings, so these are a curated/static
 * dataset (rankings move slowly). Update periodically or wire a feed later.
 */
export interface RankRow { rank: number; team: string; short: string; rating: number; points?: number }
export interface PlayerRank { rank: number; name: string; team: string; rating: number }

export interface Rankings {
  teams: { test: RankRow[]; odi: RankRow[]; t20: RankRow[] }
  batters: { test: PlayerRank[]; odi: PlayerRank[]; t20: PlayerRank[] }
  bowlers: { test: PlayerRank[]; odi: PlayerRank[]; t20: PlayerRank[] }
  updated: string
}

const t = (rank: number, team: string, short: string, rating: number): RankRow => ({ rank, team, short, rating })
const p = (rank: number, name: string, team: string, rating: number): PlayerRank => ({ rank, name, team, rating })

export const RANKINGS: Rankings = {
  teams: {
    test: [t(1,'Australia','AUS',124), t(2,'India','IND',120), t(3,'England','ENG',113), t(4,'South Africa','SA',106), t(5,'New Zealand','NZ',102), t(6,'Sri Lanka','SL',92), t(7,'Pakistan','PAK',88), t(8,'West Indies','WI',76)],
    odi: [t(1,'India','IND',122), t(2,'Australia','AUS',118), t(3,'South Africa','SA',110), t(4,'New Zealand','NZ',104), t(5,'Pakistan','PAK',99), t(6,'England','ENG',97), t(7,'Sri Lanka','SL',90), t(8,'Bangladesh','BAN',85)],
    t20: [t(1,'India','IND',267), t(2,'Australia','AUS',258), t(3,'England','ENG',251), t(4,'West Indies','WI',244), t(5,'South Africa','SA',240), t(6,'New Zealand','NZ',234), t(7,'Pakistan','PAK',230), t(8,'Sri Lanka','SL',222)],
  },
  batters: {
    test: [p(1,'Joe Root','ENG',899), p(2,'Kane Williamson','NZ',872), p(3,'Steve Smith','AUS',845)],
    odi: [p(1,'Shubman Gill','IND',784), p(2,'Babar Azam','PAK',771), p(3,'Rohit Sharma','IND',756)],
    t20: [p(1,'Suryakumar Yadav','IND',861), p(2,'Phil Salt','ENG',810), p(3,'Travis Head','AUS',792)],
  },
  bowlers: {
    test: [p(1,'Jasprit Bumrah','IND',886), p(2,'Pat Cummins','AUS',858), p(3,'Kagiso Rabada','SA',842)],
    odi: [p(1,'Keshav Maharaj','SA',682), p(2,'Kuldeep Yadav','IND',675), p(3,'Rashid Khan','AFG',668)],
    t20: [p(1,'Rashid Khan','AFG',745), p(2,'Adil Rashid','ENG',712), p(3,'Wanindu Hasaranga','SL',701)],
  },
  updated: '2026-06-01',
}
