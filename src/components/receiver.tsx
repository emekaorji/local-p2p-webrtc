import React, { useState } from 'react';
import { useWebRTC } from '../lib/webrtc';

const Receiver: React.FC = () => {
  const [messageInput, setMessageInput] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);

  const {
    connectionState,
    dataChannelState,
    error,
    handleOffer,
    send,
    messages,
  } = useWebRTC({
    metadata: { id: 'receiver' },
    isInitiator: false,
  });

  const handleOfferScan = async (scannedOffer: string) => {
    try {
      const offer = JSON.parse(scannedOffer);
      const generatedAnswer = await handleOffer(offer);
      setAnswer(JSON.stringify(generatedAnswer));
    } catch (err) {
      console.error('Failed to handle offer:', err);
    }
  };

  const sendMessage = () => {
    if (messageInput.trim()) {
      send(messageInput);
      setMessageInput('');
    }
  };

  return (
    <div>
      <h2>Receiver</h2>
      <p>Connection State: {connectionState}</p>
      <p>Data Channel State: {dataChannelState}</p>
      {error && <p style={{ color: 'red' }}>Error: {error.message}</p>}

      {connectionState === 'new' && (
        <>
          <p>Paste Initiator's Offer</p>
          <textarea
            rows={10}
            cols={50}
            onChange={(e) => handleOfferScan(e.target.value)}
          />
          {/* <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger>Scan Initiator's QR Code</DialogTrigger>
          <DialogContent title="Scan Initiator's QR Code" description=''>
            <QrCodeScanner
              onResult={(result, rawResult) => {
                console.log(result);
                console.log(rawResult.getText());
                handleOfferScan(rawResult.getText());
              }}
              onError={(error) => {
                console.log(error);
              }}
              facingMode={'environment'}>
              {(videoElement) => (
                <div
                  style={{
                    borderColor: 'rgb(147 197 253)',
                    borderWidth: '4px',
                    width: '100%',
                  }}>
                  <video
                    ref={videoElement}
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '1rem',
                    }}
                  />
                </div>
              )}
            </QrCodeScanner>
          </DialogContent>
        </Dialog> */}
        </>
      )}

      {answer && connectionState !== 'connected' && (
        <>
          <p>Receiver's Answer</p>
          {/* <QRCodeSVG value={answer} size={256} />
          <p>Scan the QR code above on the Initiator's device</p> */}
          <div>
            {/* <QRCodeSVG value={offer} size={256} /> */}
            <textarea rows={10} cols={50} defaultValue={answer} />
          </div>
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

export default Receiver;
