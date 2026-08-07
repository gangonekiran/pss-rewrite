export interface Client {
  childId?: number;
  region?: string;
  lastName: string;
  firstName: string;
  ss?: string;
  ssTemp?: boolean;
  dob?: string;
  gender?: string;
  notes?: string;
  insertDate?: Date;
  insertUser?: string;
  lastUpdateDate?: Date;
  lastUpdateUser?: string;
  nonEarlyIntervention?: boolean;
}
