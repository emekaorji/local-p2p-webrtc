import {
  ConnectionState,
  ConnectionEvents,
  PeerConnectionConfig,
  DataChannelConfig,
  SerializedOffer,
  PeerMetadata,
} from './types';

export class WebRTCConnection {
  private pc: RTCPeerConnection;
  private dc: RTCDataChannel | null = null;
  private iceCandidates: RTCIceCandidate[] = [];
  private events: ConnectionEvents = {};
  private metadata: PeerMetadata;
  private isInitiator: boolean;

  constructor(
    metadata: PeerMetadata,
    config: PeerConnectionConfig = {},
    events: ConnectionEvents = {},
    isInitiator: boolean = false
  ) {
    this.metadata = metadata;
    this.events = events;
    this.isInitiator = isInitiator;

    // Create peer connection
    this.pc = new RTCPeerConnection({
      iceServers: config.iceServers || [
        { urls: 'stun:stun.l.google.com:19302' },
      ],
      ...config.optional,
    });

    // Set up connection state change handler
    this.pc.onconnectionstatechange = () => {
      const state = this.pc.connectionState as ConnectionState;
      this.events.onConnectionStateChange?.(state);
    };

    // Set up ICE candidate handling
    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.iceCandidates.push(event.candidate);
      }
    };

    // If we're the initiator, create the data channel
    if (isInitiator) {
      this.createDataChannel();
    } else {
      // If we're the receiver, wait for the data channel
      this.pc.ondatachannel = (event) => {
        this.setupDataChannel(event.channel);
      };
    }
  }

  private createDataChannel(config: DataChannelConfig = {}) {
    try {
      this.dc = this.pc.createDataChannel('data', {
        ordered: true,
        ...config,
      });
      this.setupDataChannel(this.dc);
    } catch (error) {
      this.events.onError?.(error as Error);
    }
  }

  private setupDataChannel(channel: RTCDataChannel) {
    this.dc = channel;

    channel.onopen = () => {
      this.events.onDataChannelOpen?.();
    };

    channel.onclose = () => {
      this.events.onDataChannelClose?.();
    };

    channel.onerror = (error) => {
      this.events.onDataChannelError?.(error);
    };

    channel.onmessage = (event) => {
      this.events.onMessage?.(event.data);
    };
  }

  public async createOffer(): Promise<SerializedOffer> {
    if (!this.isInitiator) {
      throw new Error('Only initiator can create offer');
    }

    try {
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);

      // Wait for a short time to collect ICE candidates
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return {
        type: 'offer',
        sdp: this.pc.localDescription!.sdp,
        iceCandidates: this.iceCandidates,
      };
    } catch (error) {
      this.events.onError?.(error as Error);
      throw error;
    }
  }

  public async handleOffer(offer: SerializedOffer): Promise<SerializedOffer> {
    if (this.isInitiator) {
      throw new Error('Initiator cannot handle offer');
    }

    try {
      const offerDesc = new RTCSessionDescription({
        type: 'offer',
        sdp: offer.sdp,
      });

      await this.pc.setRemoteDescription(offerDesc);

      // Add ICE candidates
      for (const candidate of offer.iceCandidates) {
        await this.pc.addIceCandidate(candidate);
      }

      // Create answer
      const answer = await this.pc.createAnswer();
      await this.pc.setLocalDescription(answer);

      // Wait for a short time to collect ICE candidates
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return {
        type: 'answer',
        sdp: this.pc.localDescription!.sdp,
        iceCandidates: this.iceCandidates,
      };
    } catch (error) {
      this.events.onError?.(error as Error);
      throw error;
    }
  }

  public async handleAnswer(answer: SerializedOffer): Promise<void> {
    if (!this.isInitiator) {
      throw new Error('Only initiator can handle answer');
    }

    try {
      console.log('handleAnswer', answer);

      // Check if the connection is in a state where it can accept an answer
      if (this.pc.signalingState !== 'have-local-offer') {
        console.warn(
          `Cannot set remote description in state: ${this.pc.signalingState}`
        );

        // If we're already stable, we might have already processed this answer
        if (this.pc.signalingState === 'stable') {
          console.log('Connection is already stable, ignoring answer');
          return;
        }

        throw new Error(
          `Cannot set remote description in state: ${this.pc.signalingState}`
        );
      }

      const answerDesc = new RTCSessionDescription({
        type: 'answer',
        sdp: answer.sdp,
      });

      await this.pc.setRemoteDescription(answerDesc);

      // Add ICE candidates only after setting remote description
      for (const candidate of answer.iceCandidates) {
        try {
          await this.pc.addIceCandidate(candidate);
        } catch (candidateError) {
          console.warn('Failed to add ICE candidate:', candidateError);
        }
      }
    } catch (error) {
      console.error('Error in handleAnswer:', error);
      this.events.onError?.(error as Error);
      throw error;
    }
  }

  public send(data: string | ArrayBuffer | Blob): void {
    if (!this.dc || this.dc.readyState !== 'open') {
      throw new Error('Data channel is not open');
    }

    try {
      this.dc.send(data as string);
    } catch (error) {
      this.events.onError?.(error as Error);
      throw error;
    }
  }

  public close(): void {
    if (this.dc) {
      this.dc.close();
    }
    this.pc.close();
  }

  public getConnectionState(): ConnectionState {
    return this.pc.connectionState as ConnectionState;
  }

  public getDataChannelState(): RTCDataChannelState | null {
    return this.dc?.readyState || null;
  }

  public getMetadata(): PeerMetadata {
    return this.metadata;
  }
}
