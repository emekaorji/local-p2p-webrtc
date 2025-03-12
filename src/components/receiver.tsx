import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import QrScanner from 'qr-scanner';

const Receiver: React.FC = () => {
  const [peerConnection, setPeerConnection] =
    useState<RTCPeerConnection | null>(null);
  const [offer, setOffer] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [dataChannel, setDataChannel] = useState<RTCDataChannel | null>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<string[]>([]);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (scanning) {
      const scanner = new QrScanner(
        document.getElementById('video') as HTMLVideoElement,
        (result) => {
          if (result) {
            handleOfferScan(result.data);
            scanner.stop();
            setScanning(false);
          }
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );

      scanner.start().catch((err) => {
        console.error('Failed to start scanner:', err);
        setScanning(false);
      });

      return () => {
        scanner.stop();
      };
    }
  }, [scanning]);

  const handleOfferScan = (scannedOffer: string) => {
    const pc = new RTCPeerConnection();

    pc.ondatachannel = (event) => {
      const dc = event.channel;
      dc.onmessage = (e) => {
        setMessages((prev) => [...prev, `Received: ${e.data}`]);
      };
      setDataChannel(dc);
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
      {!scanning ? (
        <button onClick={() => setScanning(true)}>Scan Offer QR Code</button>
      ) : (
        <div>
          <video id='video' style={{ width: '300px', height: '300px' }}></video>
          <button onClick={() => setScanning(false)}>Stop Scanning</button>
        </div>
      )}

      {answer ? (
        <>
          <p>Send this QR code to the Initiator:</p>
          <QRCodeSVG value={answer} />
        </>
      ) : null}

      {dataChannel && (
        <>
          <input
            type='text'
            placeholder='Type a message'
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button onClick={sendMessage}>Send</button>
        </>
      )}

      <ul>
        {messages.map((msg, i) => (
          <li key={i}>{msg}</li>
        ))}
      </ul>
    </div>
  );
};

export default Receiver;
