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
      //restore sesion from SecureStore
      const storedSession = await SecureStore.getItemAsync('supabaseSession') 
      if (storedSession) {
        const parsed = JSON.parse(storedSession) 
        setSession(parsed) 
        //Restore Supabase session
        await supabase.auth.setSession(parsed.access_token) 
      } else {
        // if not, get session from Supabase
        const { data } = await supabase.auth.getSession() 
        if (data.session) {
          setSession(data.session) 
          await SecureStore.setItemAsync('supabaseSession', JSON.stringify(data.session)) 
        }
      }
      setLoading(false) 
    } 
    init() 

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) =>{
      setSession(session) 
      if (session) {
        await SecureStore.setItemAsync('supabaseSession',JSON.stringify(session)) 
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
