import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

const queryClient=new QueryClient({
  defaultOptions:{
    queries:{
      retry:1,
      staleTime:60000,
      refetchOnWindowFocus:false,
    },
  },
});

interface Props{children:ReactNode;}

export default function QueryProvider({children}:Props){
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
