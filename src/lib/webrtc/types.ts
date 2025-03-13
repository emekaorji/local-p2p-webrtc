export type ConnectionState =
  | 'new'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'failed'
  | 'closed';

export type DataChannelState = 'connecting' | 'open' | 'closing' | 'closed';

export interface PeerConnectionConfig {
  iceServers?: RTCIceServer[];
  optional?: RTCConfiguration;
}

export interface DataChannelConfig {
  ordered?: boolean;
  maxRetransmits?: number;
  maxPacketLifeTime?: number;
  protocol?: string;
  negotiated?: boolean;
  id?: number;
}

export interface ConnectionEvents {
  onConnectionStateChange?: (state: ConnectionState) => void;
  onDataChannelOpen?: () => void;
  onDataChannelClose?: () => void;
  onDataChannelError?: (error: Event) => void;
  onMessage?: (message: string | ArrayBuffer | Blob) => void;
  onError?: (error: Error) => void;
}

export interface SerializedOffer {
  type: 'offer' | 'answer';
  sdp: string;
  iceCandidates: RTCIceCandidate[];
}

export interface PeerMetadata {
  id: string;
  [key: string]: any;
}
