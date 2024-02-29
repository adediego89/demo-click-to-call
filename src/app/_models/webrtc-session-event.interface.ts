import * as JsSIP from 'jssip';
import {RTCSession} from "jssip/lib/RTCSession";
import {IncomingRequest} from "jssip/lib/SIPMessage";

export interface RTCSessionEvent {
  originator: 'local' | 'remote';
  request: IncomingRequest;
  session: RTCSession;
}
