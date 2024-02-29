import {Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {WebRTCService} from "./_services/webrtc.service";
import {debounceTime, map, Subscription} from "rxjs";
import {ActivatedRoute} from "@angular/router";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {

  @ViewChild('remote_video', { static: false }) videoComponent!: ElementRef;
  private subs = new Subscription();
  constructor(
    private readonly zone: NgZone,
    private readonly route: ActivatedRoute,
    public webrtcSvc: WebRTCService) {}

  ngOnInit(): void {
    this.subs.add(this.webrtcSvc.remoteStream.subscribe( remoteStream => {
      this.zone.run(() => {
        if (remoteStream) {
          this.videoComponent.nativeElement.srcObject = remoteStream;
        }
      });
    }));

    this.webrtcSvc.connecting.next(true);
    this.subs.add(this.route.queryParams.pipe(
      map(params => params['id']),
      debounceTime(1000)).subscribe((linkId: string) => {
        console.log(linkId);
        this.webrtcSvc.start(linkId);
    }));

  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  startCall() {
    console.log('startCall');
    this.webrtcSvc.call('+4822333444')
  }

  stopCall() {
    console.log('stopCall');
    this.webrtcSvc.hangup();
  }

  resetCallStatus() {}

}
