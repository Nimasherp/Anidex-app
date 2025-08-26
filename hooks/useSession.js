import { useEffect, useState, createContext, useContext } from 'react' 
import * as SecureStore from 'expo-secure-store' 
import { supabase } from '../lib/supabase' 

const SessionContext = createContext({
  session: null,
  loading: true,
  signOut: async () => {},
}) 

export const SessionProvider = ({ children }) => {
  const [session, setSession] = useState(null) 
  const [loading, setLoading] = useState(true) 

  useEffect(() => {
    const init = async () => {
      setLoading(true) 
  
      const storedSession = await SecureStore.getItemAsync('supabaseSession') 
      if (storedSession) {
        const parsed = JSON.parse(storedSession) 
  
        const { error } = await supabase.auth.setSession({
          access_token: parsed.access_token,
          refresh_token: parsed.refresh_token,
        }) 
  
        if (!error) {
          setSession(parsed) 
        } else {
          await SecureStore.deleteItemAsync('supabaseSession') 
        }
      } else {
        const { data } = await supabase.auth.getSession() 
        if (data.session) {
          setSession(data.session) 
          await SecureStore.setItemAsync('supabaseSession', JSON.stringify(data.session)) 
        }
      }
  
      setLoading(false) 
    } 
  
    init() 
  
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session) 
      if (session) {
        await SecureStore.setItemAsync('supabaseSession', JSON.stringify(session)) 
      } else {
        await SecureStore.deleteItemAsync('supabaseSession') 
      }
    }) 
  
    return () => listener.subscription.unsubscribe() 
  }, []) 
  

  const signOut = async ()=>{
    await supabase.auth.signOut() 
    setSession(null) 
    await SecureStore.deleteItemAsync('supabaseSession') 
  } 

  return (
    <SessionContext.Provider value={{ session, loading, signOut}}>
      {children}
    </SessionContext.Provider>
  ) 
} 

export const useSession =()=> useContext(SessionContext) 
