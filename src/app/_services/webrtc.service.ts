import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { WebRTCOptions } from '../_models/webrtc-options.interface';
import { RTCSessionEvent } from '../_models/webrtc-session-event.interface';
import {RTCSession} from "jssip/lib/RTCSession";
import {debug, UA, WebSocketInterface} from "jssip";
import {environment} from "../../environments/environment";
import {UAConfiguration} from "jssip/lib/UA";

@Injectable({
  providedIn: 'root'
})

export class WebRTCService implements OnDestroy {

  connected = new BehaviorSubject<boolean>(false);
  connecting = new BehaviorSubject<boolean>(false);
  activeCall = new BehaviorSubject<RTCSession | null>(null);
  remoteStream = new BehaviorSubject<any>(null);
  callStatus = new BehaviorSubject<string>('');

  private ua: UA | null = null;
  private options: WebRTCOptions = {};

  constructor() {
    debug.enable('JsSIP:*');
  }

  ngOnDestroy(): void {
    this.stop();
  }

  start(linkId: string) {

    if (this.ua && this.ua.isConnected()) {
      this.ua.stop();
    }

    // Setup UA configuration params
    const config: UAConfiguration = {
      sockets     : environment.addresses.map((addr: string) => new WebSocketInterface(addr)),
      uri         : `sip:Anonymous@${environment.domain}`,
      display_name : 'Anonymous',
      register    : false,
      extra_headers: [`link-id: ${linkId}`]
    };
    // Setup call OPTIONS
    this.options = {
      mediaConstraints: { audio: true, video: false },
      pcConfig: {
        iceServers: environment.iceServers.map((addr) => ({ urls: `stun:${addr}` }))
      },
      extraHeaders: []
    };

    // Initialize observables
    this.callStatus.next('');

    // Initialize UA
    this.ua = new UA(config);

    // Initialize UA Event handlers
    this.ua.on('connecting', (e) => {
      console.log('[WEBRTC][UA] LoginStateChanged: Connecting', e);
      this.connected.next(false);
      this.connecting.next(true);
    });
    this.ua.on('connected', (e) => {
      console.log('[WEBRTC][UA] LoginStateChanged: Connected', e);
      this.connected.next(true);
      this.connecting.next(false);
      this.callStatus.next('');
    });
    this.ua.on('disconnected', (e) => {
      console.log('[WEBRTC][UA] LoginStateChanged: Disconnected', e);
      this.connected.next(false);
      this.connecting.next(true);
      this.callStatus.next('');
    });
    this.ua.on('registered', (e) => {
      console.log('[WEBRTC][UA] LoginStateChanged: Login', e);
    });
    this.ua.on('unregistered', (e) => {
      console.log('[WEBRTC][UA] LoginStateChanged: Logout', e);
    });
    this.ua.on('registrationFailed', (e) => {
      console.log('[WEBRTC][UA] LoginStateChanged: Login failed', e);
    });
    this.ua.on('newMessage', (e: any) => {
      console.log('[WEBRTC][UA] newMessage: ', e);
    });
    this.ua.on('newRTCSession', (e: RTCSessionEvent) => {
      console.log('[WEBRTC][UA] New RTCSession: ', e);

      this.activeCall.next(e.session);

      // Register callbacks to desired RTCSession events
      e.session.on('failed', (ee: any) => {
        console.log('[WEBRTC][RTCSession] failed: ', ee);
        this.activeCall.next(null);
        this.callStatus.next('Failed');
      });
      e.session.on('ended', (ee: any) => {
        console.log('[WEBRTC][RTCSession] ended', ee);
        this.activeCall.next(null);
        this.callStatus.next('Ended');
      });
      e.session.on('icecandidate', (ee: any) => {
        console.log('[WEBRTC][RTCSession] icecandidate', ee);
        // ee.ready();
        setTimeout(() => {
          console.log('[WEBRTC][RTCSession][icecandidate] timeout');
          ee.ready();
        }, 5000);
      });
      // e.session.on('sipEvent', (ee: any) => {
      //   console.log('[WEBRTC][RTCSession] SipEvent: ', ee);
      //   if (ee.event.event === 'talk') {
      //     this.answer(e.session);
      //     ee.taken = true;
      //   }
      // });
      // Other events
      e.session.on('progress', (ee: any) => {
        console.log('[WEBRTC][RTCSession] progress', ee);
        this.callStatus.next('In progress');
      });
      e.session.on('confirmed', (ee: any) => {
        console.log('[WEBRTC][RTCSession] confirmed', ee);
        this.callStatus.next('Confirmed');
      });
      e.session.on('connecting', (ee: any) => {
        console.log('[WEBRTC][RTCSession] connecting', ee);
        this.callStatus.next('Connecting');
      });
      e.session.on('sending', (ee: any) => {
        console.log('[WEBRTC][RTCSession] sending', ee);
      });
      e.session.on('accepted', (ee: any) => {
        console.log('[WEBRTC][RTCSession] accepted', ee);
        this.callStatus.next('Accepted');
      });
      e.session.on('newDTMF', (ee: any) => {
        console.log('[WEBRTC][RTCSession] newDTMF', ee);
      });
      e.session.on('newInfo', (ee: any) => {
        console.log('[WEBRTC][RTCSession] newInfo', ee);
      });
      e.session.on('hold', (ee: any) => {
        console.log('[WEBRTC][RTCSession] hold', ee);
      });
      e.session.on('unhold', (ee: any) => {
        console.log('[WEBRTC][RTCSession] unhold', ee);
      });
      e.session.on('muted', (ee: any) => {
        console.log('[WEBRTC][RTCSession] muted', ee);
      });
      e.session.on('unmuted', (ee: any) => {
        console.log('[WEBRTC][RTCSession] unmuted', ee);
      });
      e.session.on('reinvite', (ee: any) => {
        console.log('[WEBRTC][RTCSession] reinvite', ee);
      });
      e.session.on('update', (ee: any) => {
        console.log('[WEBRTC][RTCSession] update', ee);
      });
      e.session.on('refer', (ee: any) => {
        console.log('[WEBRTC][RTCSession] refer', ee);
      });
      e.session.on('replaces', (ee: any) => {
        console.log('[WEBRTC][RTCSession] replaces', ee);
      });
      e.session.on('sdp', (ee: any) => {
        console.log('[WEBRTC][RTCSession] sdp', ee);
      });
      e.session.on('getusermediafailed', (ee: any) => {
        console.log('[WEBRTC][RTCSession] getusermediafailed', ee);
      });

      if (e.session.connection) {
        console.log('[WEBRTC][RTCSession] Peer connection exists');
        this._set_addStream_listener(e.session.connection);
      } else {
        console.log('[WEBRTC][RTCSession] Peer connection does not exist, wait creation');
        e.session.on('peerconnection', (ee: any) => {
          console.log('[WEBRTC][RTCSession] peerconnection created', ee);
          this._set_addStream_listener(e.session.connection);
        });
      }

    });
    this.ua.on('sipEvent', (e) => {
      console.log('[WEBRTC][UA] Sip Event: ', e);
    });
    console.log(`[WEBRTC][UA] Starting`);
    this.ua.start();

  }

  stop() {
    if (this.ua) {
      this.ua.unregister({ all: true });
      this.ua.stop();
      this.ua = null;
      console.log(`[WEBRTC][UA] Stopped`);
    }
  }

  private _set_addStream_listener(connection: RTCPeerConnection) { // RTCPeerConnection

    connection.ontrack = (e: RTCTrackEvent) => {
      console.log('[WEBRTC][RTCSession][peerconnection] ontrack', e);

      const remoteStream = e.streams[0];
      // const remoteView = document.getElementById('remote_video') as HTMLMediaElement;

      remoteStream.onremovetrack = (ee: any) => {
        console.log('[WEBRTC][RTCSession][peerconnection][ontrack][remote-stream] onremovetrack', ee);
      };
      remoteStream.onaddtrack = (ee: any) => {
        console.log('[WEBRTC][RTCSession][peerconnection][ontrack][remote-stream] onaddtrack', ee);
      };
      // e.track.onunmute = () => {
      //   // don't set srcObject again if it is already set.
      //   if (!remoteView.srcObject) {
      //     remoteView.srcObject = remoteStream;
      //   }
      // };

      // set remote video element
      this.remoteStream.next(remoteStream);
      // remoteView.srcObject = remoteStream;
    };

  }

  call(target: string) {
    if (this.ua && this.ua.isConnected()) {
      this.callStatus.next('');
      console.log(this.options);
      this.ua.call(`sip:${target}@${environment.domain}`, this.options);
    }
  }

  hangup() {

    const session = this.activeCall.getValue();
    if (session) {
      session.terminate();
    }

  }

}
