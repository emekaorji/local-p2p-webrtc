import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Dialog, DialogContent, DialogTrigger } from './dialog';
import { QrCodeScanner } from 'react-simple-qr-code-scanner';

const Initiator: React.FC = () => {
  const [peerConnection, setPeerConnection] =
    useState<RTCPeerConnection | null>(null);
  const [offer, setOffer] = useState<string | null>(null);
  const [dataChannel, setDataChannel] = useState<RTCDataChannel | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const pc = new RTCPeerConnection();
    const dc = pc.createDataChannel('chat');

    dc.onmessage = (event) => {
      setMessages((prev) => [...prev, `Received: ${event.data}`]);
    };

    setDataChannel(dc);

    pc.onconnectionstatechange = () => {
      setIsConnected(pc.connectionState === 'connected');
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('ICE Candidate:', event.candidate);
      }
    };

    pc.createOffer()
      .then((offer) => pc.setLocalDescription(offer))
      .then(() => setOffer(JSON.stringify(pc.localDescription)));

    setPeerConnection(pc);
  }, []);

  const handleAnswerScan = (scannedAnswer: string) => {
    setIsModalOpen(false);

    if (peerConnection) {
      const answerDesc = new RTCSessionDescription(JSON.parse(scannedAnswer));
      peerConnection.setRemoteDescription(answerDesc);
    }
  };

  const sendMessage = () => {
    if (dataChannel) {
      dataChannel.send(messageInput);
      setMessages((prev) => [...prev, `Sent: ${messageInput}`]);
      setMessageInput('');
    }
  };

  return (
    <div>
      <h2>Initiator</h2>
      {!offer ? (
        <p>Generating Offer...</p>
      ) : dataChannel ? null : (
        <>
          <p>Initiator's QR Code</p>
          <div>
            <QRCodeSVG value={offer} size={256} />
          </div>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger>Scan Receiver's QR Code</DialogTrigger>
            <DialogContent title="Scan Receiver's QR Code" description=''>
              <QrCodeScanner
                onResult={(result, rawResult) => {
                  console.log(result);
                  console.log(rawResult.getText());
                  handleAnswerScan(rawResult.getText());
                }}
                onError={(error) => {
                  console.log(error);
                }}
                facingMode={'environment'} // Or "user"
              >
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
          </Dialog>
        </>
      )}

      {dataChannel && isConnected && (
        <div>
          <input
            type='text'
            placeholder='Type a message'
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      )}

      <ul>
        {messages.map((msg, i) => (
          <li key={i}>{msg}</li>
        ))}
      </ul>
    </div>
  );
};

export default Initiator;
