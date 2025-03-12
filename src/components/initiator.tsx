import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import QrScanner from 'qr-scanner';

const Initiator: React.FC = () => {
  const [peerConnection, setPeerConnection] =
    useState<RTCPeerConnection | null>(null);
  const [offer, setOffer] = useState<string | null>(null);
  const [dataChannel, setDataChannel] = useState<RTCDataChannel | null>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<string[]>([]);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    const pc = new RTCPeerConnection();
    const dc = pc.createDataChannel('chat');

    dc.onmessage = (event) => {
      setMessages((prev) => [...prev, `Received: ${event.data}`]);
    };

    setDataChannel(dc);

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
    if (peerConnection) {
      const answerDesc = new RTCSessionDescription(JSON.parse(scannedAnswer));
      peerConnection.setRemoteDescription(answerDesc);
    }
  };

  useEffect(() => {
    if (scanning) {
      const scanner = new QrScanner(
        document.getElementById('video') as HTMLVideoElement,
        (result) => {
          if (result) {
            handleAnswerScan(result.data);
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

  const sendMessage = () => {
    if (dataChannel) {
      dataChannel.send(message);
      setMessages((prev) => [...prev, `Sent: ${message}`]);
      setMessage('');
    }
  };

  return (
    <div>
      <h2>Initiator</h2>
      {offer ? (
        <>
          <p>Scan this QR code with the Receiver:</p>
          <QRCodeSVG value={offer} />
          <button onClick={() => setScanning(true)}>Scan Answer QR Code</button>
        </>
      ) : (
        <p>Generating Offer...</p>
      )}

      {scanning && (
        <div>
          <video id='video' style={{ width: '300px', height: '300px' }}></video>
          <button onClick={() => setScanning(false)}>Stop Scanning</button>
        </div>
      )}

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

export default Initiator;
