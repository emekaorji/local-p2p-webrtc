import { useState, useEffect, useCallback, useRef } from 'react';
import { WebRTCConnection } from './WebRTCConnection';
import {
  ConnectionState,
  ConnectionEvents,
  PeerConnectionConfig,
  SerializedOffer,
  PeerMetadata,
} from './types';

interface UseWebRTCOptions {
  metadata: PeerMetadata;
  config?: PeerConnectionConfig;
  isInitiator?: boolean;
}

interface UseWebRTCReturn {
  connectionState: ConnectionState;
  dataChannelState: RTCDataChannelState | null;
  error: Error | null;
  createOffer: () => Promise<SerializedOffer>;
  handleOffer: (offer: SerializedOffer) => Promise<SerializedOffer>;
  handleAnswer: (answer: SerializedOffer) => Promise<void>;
  send: (data: string | ArrayBuffer | Blob) => void;
  messages: (string | ArrayBuffer | Blob)[];
  close: () => void;
}

export function useWebRTC({
  metadata,
  config = {},
  isInitiator = false,
}: UseWebRTCOptions): UseWebRTCReturn {
  const [connectionState, setConnectionState] =
    useState<ConnectionState>('new');
  const [dataChannelState, setDataChannelState] =
    useState<RTCDataChannelState | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [messages, setMessages] = useState<(string | ArrayBuffer | Blob)[]>([]);

  // Use ref to maintain connection instance across renders
  const connectionRef = useRef<WebRTCConnection | null>(null);

  useEffect(() => {
    const events: ConnectionEvents = {
      onConnectionStateChange: (state) => {
        setConnectionState(state);
      },
      onDataChannelOpen: () => {
        setDataChannelState('open');
      },
      onDataChannelClose: () => {
        setDataChannelState('closed');
      },
      onDataChannelError: (event) => {
        setError(new Error('Data channel error'));
      },
      onMessage: (message) => {
        setMessages((prev) => [...prev, message]);
      },
      onError: (err) => {
        setError(err);
      },
    };

    // Create new connection instance
    connectionRef.current = new WebRTCConnection(
      metadata,
      config,
      events,
      isInitiator
    );

    // Cleanup on unmount
    return () => {
      if (connectionRef.current) {
        connectionRef.current.close();
        connectionRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metadata, isInitiator]);

  const createOffer = useCallback(async () => {
    if (!connectionRef.current) {
      throw new Error('Connection not initialized');
    }
    return connectionRef.current.createOffer();
  }, []);

  const handleOffer = useCallback(async (offer: SerializedOffer) => {
    if (!connectionRef.current) {
      throw new Error('Connection not initialized');
    }
    return connectionRef.current.handleOffer(offer);
  }, []);

  const handleAnswer = useCallback(async (answer: SerializedOffer) => {
    if (!connectionRef.current) {
      throw new Error('Connection not initialized');
    }
    return connectionRef.current.handleAnswer(answer);
  }, []);

  const send = useCallback((data: string | ArrayBuffer | Blob) => {
    if (!connectionRef.current) {
      throw new Error('Connection not initialized');
    }
    connectionRef.current.send(data);
  }, []);

  const close = useCallback(() => {
    if (connectionRef.current) {
      connectionRef.current.close();
      connectionRef.current = null;
    }
  }, []);

  return {
    connectionState,
    dataChannelState,
    error,
    createOffer,
    handleOffer,
    handleAnswer,
    send,
    messages,
    close,
  };
}
