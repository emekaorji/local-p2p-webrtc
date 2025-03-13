import React, { useCallback, useEffect, useState } from 'react';
import { useWebRTC } from '../lib/webrtc';

const Initiator: React.FC = () => {
  const [messageInput, setMessageInput] = useState('');
  const [offer, setOffer] = useState<string | null>(null);
  const [answerProcessed, setAnswerProcessed] = useState(false);

  const {
    connectionState,
    dataChannelState,
    error,
    createOffer,
    handleAnswer,
    send,
    messages,
  } = useWebRTC({
    metadata: { id: 'initiator' },
    isInitiator: true,
  });

  const handleAnswerScan = async (scannedAnswer: string) => {
    if (answerProcessed || connectionState === 'connected') {
      console.log('Answer already processed or connection already established');
      return;
    }

    try {
      const answer = JSON.parse(scannedAnswer);
      setAnswerProcessed(true);
      await handleAnswer(answer);
    } catch (error) {
      console.error('Failed to handle answer:', error);
      setAnswerProcessed(false);
    }
  };

  const sendMessage = () => {
    if (messageInput.trim()) {
      send(messageInput);
      setMessageInput('');
    }
  };

  const generateOffer = useCallback(async () => {
    try {
      const newOffer = await createOffer();
      const offerString = JSON.stringify(newOffer);
      setOffer(offerString);
      setAnswerProcessed(false); // Reset answer processed state when generating a new offer
    } catch (error) {
      console.error('Failed to create offer:', error);
    }
  }, [createOffer]);

  useEffect(() => {
    if (connectionState === 'new') {
      generateOffer();
    }
  }, [connectionState, generateOffer]);

  // Reset answer processed state if connection fails
  useEffect(() => {
    if (connectionState === 'failed' || connectionState === 'disconnected') {
      setAnswerProcessed(false);
    }
  }, [connectionState]);

  return (
    <div>
      <h2>Initiator</h2>
      <p>Connection State: {connectionState}</p>
      <p>Data Channel State: {dataChannelState}</p>
      {error && <p style={{ color: 'red' }}>Error: {error.message}</p>}

      {connectionState !== 'connected' && offer && (
        <>
          <p>Initiator's offer</p>
          <div>
            <textarea rows={10} cols={50} defaultValue={offer} />
          </div>
        </>
      )}

      {connectionState !== 'connected' && !answerProcessed && (
        <>
          <p>Paste Receiver's Answer</p>
          <textarea
            rows={10}
            cols={50}
            onChange={(e) => handleAnswerScan(e.target.value)}
          />
        </>
      )}

      {/* {dataChannelState === 'open' && ( */}
      <div>
        <input
          type='text'
          placeholder='Type a message'
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
      {/* )} */}

      <ul>
        {messages.map((msg, i) => (
          <li key={i}>{msg.toString()}</li>
        ))}
      </ul>
    </div>
  );
};

export default Initiator;
