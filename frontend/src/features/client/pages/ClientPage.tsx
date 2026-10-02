import { useEffect, useRef, useState } from 'react';

import PageContainer from '../../../layouts/PageContainer';

import ClientLookup, { type ClientLookupRef } from '../components/ClientLookup/ClientLookup';

import ClientActions from '../components/ClientActions/ClientActions';
import ClientTabs from '../components/ClientTabs/ClientTabs';

import type { Client } from '../../../types/client';
import type { RegionLookup } from '../../../types';
import commonInfoService from '../../../services/common-info.service';

export default function ClientPage() {
  const emptyClient: Client = {
    childId: undefined,
    region: 0,
    lastName: '',
    firstName: '',
    ss: '',
    ssTemp: false,
    dob: '',
    gender: '',
    notes: '',
    nonEarlyIntervention: false,
  };

  const [client, setClient] = useState<Client>(emptyClient);
  const [isNewClient, setIsNewClient] = useState(true);
  const [isLocked, setIsLocked] = useState(true);
  const clientLookupRef = useRef<ClientLookupRef>(null);
  const [regions, setRegions] = useState<RegionLookup[]>([]);

  const clearClient = () => {
    setClient(emptyClient);
    setIsNewClient(true);
  };

  // Notes on the Client Status tab edit client.notes, which Done
  // saves together with the rest of the client (POST / PUT).
  const handleClientNotesChange = (notes: string) => {
    setClient((current) => ({ ...current, notes }));
  };

  const clearClientLookup = () => {
    clientLookupRef.current?.clearLookup();
  };

  useEffect(() => {
    const loadRegions = async () => {
      try {
        const data = await commonInfoService.regions();
        setRegions(data);
      } catch (error) {
        console.error('Failed to load regions:', error);
        setRegions([]);
      }
    };

    void loadRegions();
  }, []);

  return (
    <PageContainer>
      <ClientLookup
        ref={clientLookupRef}
        client={client}
        setClient={setClient}
        isLocked={isLocked}
      />
      <ClientActions
        client={client}
        setClient={setClient}
        isNewClient={isNewClient}
        setIsNewClient={setIsNewClient}
        clearClient={clearClient}
        isLocked={isLocked}
        setIsLocked={setIsLocked}
        clearClientLookup={clearClientLookup}
      />
      <ClientTabs
        client={client}
        regions={regions}
        isLocked={isLocked}
        onClientNotesChange={handleClientNotesChange}
      />
    </PageContainer>
  );
}
