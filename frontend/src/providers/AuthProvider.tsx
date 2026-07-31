import { createContext, ReactNode, useContext, useState } from 'react';

interface AuthContextType{
  isAuthenticated:boolean;
  login:()=>void;
  logout:()=>void;
}

const AuthContext=createContext<AuthContextType|undefined>(undefined);

export function AuthProvider({children}:{children:ReactNode}){
  const [isAuthenticated,setAuthenticated]=useState(false);

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      login:()=>setAuthenticated(true),
      logout:()=>setAuthenticated(false),
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(){
  const context=useContext(AuthContext);
  if(!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
