import { supabase } from './supabase' 

export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password }) 
  if (error) throw error 
  return data.session 
} 

export const signUp = async (email, password) => {
  const { data, error } = await supabase.auth.signUp({ email, password }) 
  if (error) throw error 
  return data.session 
} 
