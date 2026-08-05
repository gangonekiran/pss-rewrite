export interface Client {
  id?: number;
  clientNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: string;
  birthDate: string;
  ssn: string;
  region: string;
  nonEI: boolean;
  status: string;
}
