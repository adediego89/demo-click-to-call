
export interface WebRTCOptions {
  mediaConstraints?: {
    audio: boolean;
    video: boolean;
  };
  pcConfig?: {
    iceServers: { urls: string }[];
  };
  extraHeaders?: string[];
}
