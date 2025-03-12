import React, { useState } from 'react';
import Initiator from './components/initiator';
import Receiver from './components/receiver';

const App: React.FC = () => {
  const [role, setRole] = useState<'initiator' | 'receiver' | null>(null);

  return (
    <div>
      <h1>Local Wifi P2P WebRTC Connection</h1>
      {!role ? (
        <>
          <button onClick={() => setRole('initiator')}>
            Start as Initiator
          </button>
          <button onClick={() => setRole('receiver')}>Start as Receiver</button>
        </>
      ) : role === 'initiator' ? (
        <Initiator />
      ) : (
        <Receiver />
      )}
    </div>
  );
};

export default App;
