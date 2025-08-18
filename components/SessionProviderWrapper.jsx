import React from 'react';
import { SessionProvider } from './hooks/useSession';
import MainApp from './components/MainApp';

export default function App() {
  return (
    <SessionProvider>
      <MainApp />
    </SessionProvider>
  );
}
