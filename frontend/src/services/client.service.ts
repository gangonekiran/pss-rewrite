import { api } from './api';
import type { Client } from '../types/client';
import type { ServiceHistoryItem } from '../features/client/components/ServiceHistory/ServiceHistoryItem';

const BASE_URL = '/clients';

class ClientService {
  /**
   * Map Backend (PascalCase) -> Frontend (camelCase)
   */
  private mapClient(data: any): Client {
    return {
      childId: data.ChildID,
      region: data.Region,
      lastName: data.LastName,
      firstName: data.FirstName,
      ss: data.SS,
      ssTemp: data.SSTemp,
      dob: data.DOB ? data.DOB.substring(0, 10) : '',
      gender: data.Gender?.trim() ?? '',
      notes: data.Notes ?? '',
      nonEarlyIntervention: data.NonEarlyIntervention,
    };
  }

  /**
   * Map Frontend (camelCase) -> Backend (PascalCase)
   */
  private mapRequest(client: Client) {
    return {
      ChildID: client.childId,
      Region: client.region,
      LastName: client.lastName,
      FirstName: client.firstName,
      SS: client.ss,
      SSTemp: client.ssTemp,
      DOB: client.dob,
      Gender: client.gender,
      Notes: client.notes,
      NonEarlyIntervention: client.nonEarlyIntervention,
    };
  }

  /**
   * Get All Clients
   */
  async getAll(): Promise<Client[]> {
    const response = await api.get(BASE_URL);

    return response.data.map((client: any) => this.mapClient(client));
  }

  /**
   * Get Client By Id
   */
  async getById(childId: number): Promise<Client> {
    const response = await api.get(`${BASE_URL}/${childId}`);

    return this.mapClient(response.data);
  }

  /**
   * Search Last Name
   */
  async searchLastName(search: string): Promise<Client[]> {
    const response = await api.get(`${BASE_URL}/search/lastname`, {
      params: { search },
    });

    return response.data.map((client: any) => this.mapClient(client));
  }

  /**
   * Search First Name
   */
  async searchFirstName(search: string): Promise<Client[]> {
    const response = await api.get(`${BASE_URL}/search/firstname`, {
      params: { search },
    });

    return response.data.map((client: any) => this.mapClient(client));
  }

  /**
   * Search SSN
   */
  async searchSSN(search: string): Promise<Client[]> {
    const response = await api.get(`${BASE_URL}/search/ssn`, {
      params: { search },
    });

    return response.data.map((client: any) => this.mapClient(client));
  }

  /**
   * Create Client
   */
  async create(client: Client): Promise<Client> {
    const response = await api.post(
      BASE_URL,
      //this.mapRequest(client)
      client,
    );

    return this.mapClient(response.data);
  }

  /**
   * Update Client
   */
  async update(childId: number, client: Client): Promise<Client> {
    const response = await api.put(`${BASE_URL}/${childId}`, this.mapRequest(client));

    return this.mapClient(response.data);
  }

  /**
   * Delete Client
   */
  async delete(childId: number): Promise<void> {
    await api.delete(`${BASE_URL}/${childId}`);
  }

  /**
   * Get Client Status
   */
  async getStatus(childId: number, statusDate: string) {
    const response = await api.get(`${BASE_URL}/${childId}/status`, {
      params: {
        date: statusDate,
      },
    });

    return response.data;
  }

  /**
   * Get service history for a client
   */
  async getServiceHistory(childId: number, date?: string): Promise<ServiceHistoryItem[]> {
    const response = await api.get<ServiceHistoryItem[]>(`${BASE_URL}/${childId}/service-history`, {
      params: date ? { date } : undefined,
    });

    return response.data;
  }
}

export default new ClientService();
