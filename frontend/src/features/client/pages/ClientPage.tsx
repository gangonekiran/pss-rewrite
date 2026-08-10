import { useState } from "react";

import PageContainer from "../../../layouts/PageContainer";

import ClientLookup from "../components/ClientLookup/ClientLookup";
import ClientForm from "../components/ClientForm/ClientForm";
import ClientActions from "../components/ClientActions/ClientActions";
import ClientTabs from "../components/ClientTabs/ClientTabs";

import type { Client } from "../../../types/client";

export default function ClientPage() {

  const emptyClient: Client = {
    childId: undefined,
    region: "",
    lastName: "",
    firstName: "",
    ss: "",
    ssTemp: false,
    dob: "",
    gender: "",
    notes: "",
    nonEarlyIntervention: false,
  };

  const [client, setClient] = useState<Client>(emptyClient);
  const [isNewClient, setIsNewClient] = useState(true);

  const clearClient = () => {
    setClient(emptyClient);
    setIsNewClient(true);
  };

  return (
    <PageContainer>
      <ClientLookup
        client={client}
        setClient={setClient}
      />
      <ClientActions
        client={client}
        setClient={setClient}
        isNewClient={isNewClient}
        setIsNewClient={setIsNewClient}
        clearClient={clearClient}
      />
      <ClientTabs client={client} />
    </PageContainer>
  );
}