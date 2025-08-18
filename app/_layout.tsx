// app/_layout.js
import { Slot } from 'expo-router';
import { SessionProvider } from '../hooks/useSession';

export default function Layout() {
  return (
    <SessionProvider>
      <Slot />
    </SessionProvider>
  );
}
