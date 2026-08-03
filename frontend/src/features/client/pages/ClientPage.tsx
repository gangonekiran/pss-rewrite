import PageContainer from '../../../layouts/PageContainer';
import ClientLookup from '../components/ClientLookup/ClientLookup';
import ClientActions from '../components/ClientActions/ClientActions';
import ClientTabs from '../components/ClientTabs/ClientTabs';
export default function ClientPage() {
  return (
    <PageContainer>
      <ClientLookup />
      <ClientActions />
      <ClientTabs />
    </PageContainer>
  );
}
