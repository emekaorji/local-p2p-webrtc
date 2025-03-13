import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Dialog, DialogContent, DialogTrigger } from './dialog';
import { QrCodeScanner } from 'react-simple-qr-code-scanner';

const Receiver: React.FC = () => {
  const [peerConnection, setPeerConnection] =
    useState<RTCPeerConnection | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [dataChannel, setDataChannel] = useState<RTCDataChannel | null>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOfferScan = (scannedOffer: string) => {
    setIsModalOpen(false);

    const pc = new RTCPeerConnection();

    pc.ondatachannel = (event) => {
      const dc = event.channel;
      dc.onmessage = (e) => {
        setMessages((prev) => [...prev, `Received: ${e.data}`]);
      };
      setDataChannel(dc);
    };

    pc.onconnectionstatechange = () => {
      setIsConnected(pc.connectionState === 'connected');
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('ICE Candidate:', event.candidate);
      }
    };

    const offerDesc = new RTCSessionDescription(JSON.parse(scannedOffer));
    pc.setRemoteDescription(offerDesc)
      .then(() => pc.createAnswer())
      .then((answer) => pc.setLocalDescription(answer))
      .then(() => setAnswer(JSON.stringify(pc.localDescription)));

    setPeerConnection(pc);
  };

  const sendMessage = () => {
    if (dataChannel) {
      dataChannel.send(message);
      setMessages((prev) => [...prev, `Sent: ${message}`]);
      setMessage('');
    }
  };

  return (
    <div>
      <h2>Receiver</h2>
      {!answer ? (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
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
      ) : null}

      {answer && !isConnected ? (
        <>
          <p>Receiver's QR Code</p>
          <QRCodeSVG value={answer} />
          <p>Scan the QR code above on the Initiator's device</p>
        </>
      ) : null}

      {/* {dataChannel && ( */}
      <>
        <input
          type='text'
          placeholder='Type a message'
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button onClick={sendMessage}>Send</button>
      </>
      {/* )} */}

      <ul>
        {messages.map((msg, i) => (
          <li key={i}>{msg}</li>
        ))}
      </ul>
    </div>
  );
};

export default Receiver;
