import { useRef, useState } from 'react';

import PageContainer from '../../../layouts/PageContainer';

import ClientLookup, { type ClientLookupRef } from '../components/ClientLookup/ClientLookup';

import ClientActions from '../components/ClientActions/ClientActions';
import ClientTabs from '../components/ClientTabs/ClientTabs';

import type { Client } from '../../../types/client';

export default function ClientPage() {
  const emptyClient: Client = {
    childId: undefined,
    region: '',
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

  const clearClient = () => {
    setClient(emptyClient);
    setIsNewClient(true);
  };

  const clearClientLookup = () => {
    clientLookupRef.current?.clearLookup();
  };

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
      <ClientTabs client={client} />
    </PageContainer>
  );
}
