export interface User {
  id: number;
  name: string;
}

export interface BeerRecord {
  id: number;
  user_id: number;
  weight: number;
  timestamp: number;
}

export interface AlcoholRecord {
  id: number;
  user_id: number;
  alcohol: number;
  timestamp: number;
}
