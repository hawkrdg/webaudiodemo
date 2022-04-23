import { Component, NgZone, OnInit, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'webaudio';
  showHelp = false;
  useWebAudio = false;
  @ViewChild('audio1') audio1!: ElementRef;
  @ViewChild('audio2') audio2!: ElementRef;
  @ViewChild('video1') video1!: ElementRef;
  @ViewChild('webaudio1') webaudio1!: ElementRef;
  @ViewChild('webaudio2') webaudio2!: ElementRef;
  @ViewChild('webvideo1') webvideo1!: ElementRef;
  @ViewChild('seekSlider') seekSlider!: ElementRef;

  //-- create AudioContext, GainNodes, PannerNodes, ReverbNodes...
  //
  c4Ctx = new (window as any).AudioContext();
  a3Ctx = new (window as any).AudioContext();
  bufferCtx = new (window as any).AudioContext();
  videoTagCtx = new (window as any).AudioContext();

  c4GainNode = this.c4Ctx.createGain();
  a3GainNode = this.a3Ctx.createGain();
  bufferGainNode = this.bufferCtx.createGain();
  videoTagGainNode = this.videoTagCtx.createGain();

  c4PanNode = this.c4Ctx.createStereoPanner();
  a3PanNode = this.a3Ctx.createStereoPanner();
  bufferPanNode = this.bufferCtx.createStereoPanner();
  videoTagPanNode = this.videoTagCtx.createStereoPanner();

  c4ReverbNode = this.c4Ctx.createConvolver();
  a3ReverbNode = this.a3Ctx.createConvolver();
  bufferReverbNode = this.bufferCtx.createConvolver();
  reverbRoomBuffer;

  c4Track;
  a3Track;
  bufferTrack1;
  bufferTrack2;
  audioBuffer1;
  audioBuffer2;
  videoTagTrack;

  c4Level = 0.3;
  a3Level = 0.3;
  bufferLevel = 0.3;
  videoTagLevel = 0.2;

  c4Pan = 0.0;
  a3Pan = 0.0;
  bufferPan = 0.0;
  videoTagPan = 0.0;

  c4Reverb = false;
  a3Reverb = false;
  bufferReverb = false;

  c4IsPlaying = false;
  a3IsPlaying = false;
  bufferIsPlaying = false;
  videoTagIsPlaying = false;
  videoTagSeekTimer;
  videoTagSeekTimeout = false;

  videoTagTime = 0;
  videoTagLength = 0;

  constructor(
		private zone: NgZone
	) {}

	async ngOnInit() {
		console.log('ngOnInit()...');

    // set levels and pan to center...
    //
    this.c4GainNode.gain.value = this.c4Level;
    this.a3GainNode.gain.value = this.a3Level;
    this.bufferGainNode.gain.value = this.bufferLevel;
    this.videoTagGainNode.gain.value = this.videoTagLevel;
    this.c4PanNode.pan.value = this.c4Pan;
    this.a3PanNode.pan.value = this.a3Pan;
    this.bufferPanNode.pan.value = this.bufferPan;
    this.videoTagPanNode.pan.value = this.videoTagPan;

    // setup reverb...
    //
    await fetch('assets/TijuanaAqueductTunnel.wav')
    // await fetch('assets/SaltonSeaDrainagePipe.wav')
    // await fetch('assets/CathedralRoom.wav')
      .then(data => data.arrayBuffer())
      .then(arrayBuffer => this.bufferCtx.decodeAudioData(arrayBuffer))
      .then(decodedAudio => {
        this.reverbRoomBuffer = decodedAudio;
    	}
    )
    this.c4ReverbNode.buffer = this.reverbRoomBuffer;
    this.a3ReverbNode.buffer = this.reverbRoomBuffer;
    this.bufferReverbNode.buffer = this.reverbRoomBuffer;
	}

	async ngAfterViewInit() {
    console.log('ngAfterViewInit()...');

    //-- set HTML tag default levels
    //
    this.audio1.nativeElement.volume = 0.3;
    this.audio2.nativeElement.volume = 0.3;
    this.video1.nativeElement.volume = 0.2;

    //-- setup WebAudio tracks & defaults...\
    //
    this.videoTagTrack = await this.videoTagCtx.createMediaElementSource(this.webvideo1.nativeElement);
    this.c4Track = await this.c4Ctx.createMediaElementSource(this.webaudio1.nativeElement);
    this.a3Track = await this.a3Ctx.createMediaElementSource(this.webaudio2.nativeElement);
    setTimeout(() => {
      this.videoTagLength = this.videoTagTrack.mediaElement.duration;
    }, 1000);

    await fetch('assets/C4.mp3')
    .then(data => data.arrayBuffer())
    .then(arrayBuffer => this.bufferCtx.decodeAudioData(arrayBuffer))
    .then(decodedAudio => {
      this.audioBuffer1 = decodedAudio;
    });
    await fetch('assets/A3.mp3')
    .then(data => data.arrayBuffer())
    .then(arrayBuffer => this.bufferCtx.decodeAudioData(arrayBuffer))
    .then(decodedAudio => {
      this.audioBuffer2 = decodedAudio;
    });

    this.c4Track.mediaElement.volume = this.c4Level;
    this.a3Track.mediaElement.volume = this.a3Level;
    this.videoTagTrack.mediaElement.volume = this.videoTagLevel;
	}

  log = (msg) => {
    console.log(msg);
  }

  //-- logic to prevent feedback from video playback controlling seek slider...
  //
	setVideoTagTimeDelay = () => {
    if (!this.videoTagSeekTimeout) {
      this.videoTagSeekTimeout = true;
      this.videoTagTrack.mediaElement.pause();
      this.videoTagSeekTimer = setTimeout(() => {
        this.videoTagSeekTimeout = false;
        //-- make sure mouseover doesn't trigger play when seek - 0.0
        if (this.videoTagTime > 0.0) {
          if (this.videoTagIsPlaying) {
            this.videoTagTrack.mediaElement.play();
          } else {
            this.videoTagIsPlaying = false;
            this.playVideoTag();
          }
        }
      }, 4000);
    }
  }

  setVideoTagTime = () => {
		this.videoTagTrack.mediaElement.currentTime = this.videoTagTime;
  }


	playC4 = async () => {
    console.log('playC4()...');
    if (this.c4IsPlaying) {
      this.c4Track.mediaElement.pause();
      this.c4IsPlaying = false;
    } else {
      if (this.c4Reverb) {
        this.c4Track.connect(this.c4GainNode).connect(this.c4PanNode).connect(this.c4ReverbNode).connect(this.c4Ctx.destination);
      } else {
        this.c4Track.connect(this.c4GainNode).connect(this.c4PanNode).connect(this.c4Ctx.destination);
      }
      this.c4Track.mediaElement.onended = () => {
        console.log('onended()...')
        this.c4Track.mediaElement.currentTime = 0;
        if (this.c4Reverb) {
          this.c4ReverbNode.disconnect();
        }
        this.c4PanNode.disconnect();
        this.c4GainNode.disconnect();
        this.c4Track.disconnect();
        this.c4IsPlaying = false;
      }
      this.c4Track.mediaElement.play();
      this.c4IsPlaying = true;
    }
	}

  playA3 = async () => {
    console.log('playA3()...');
    if (this.a3IsPlaying) {
			this.a3Track.mediaElement.pause();
			this.a3IsPlaying = false;
		} else {
      if (this.a3Reverb) {
        this.a3Track.connect(this.a3GainNode).connect(this.a3PanNode).connect(this.a3ReverbNode).connect(this.a3Ctx.destination);
      } else {
        this.a3Track.connect(this.a3GainNode).connect(this.a3PanNode).connect(this.a3Ctx.destination);
      }
      this.a3Track.mediaElement.onended = () => {
        console.log('onended()...')
        this.a3Track.mediaElement.currentTime = 0;
        if (this.a3Reverb) {
          this.a3ReverbNode.disconnect();
        }
        this.a3PanNode.disconnect();
        this.a3GainNode.disconnect();
        this.a3Track.disconnect();
        this.a3IsPlaying = false;
      }
      this.a3Track.mediaElement.play();
      this.a3IsPlaying = true;
		}
	}

	playBuffer = async () => {
    console.log('playBuffer()...');
    this.bufferTrack1 = this.bufferCtx.createBufferSource();
    this.bufferTrack1.buffer = this.audioBuffer1;
    this.bufferTrack2 = this.bufferCtx.createBufferSource();
    this.bufferTrack2.buffer = this.audioBuffer2;

    if (this.bufferReverb) {
      this.bufferTrack1.connect(this.bufferGainNode).connect(this.bufferPanNode).connect(this.bufferReverbNode).connect(this.bufferCtx.destination);
      this.bufferTrack2.connect(this.bufferGainNode).connect(this.bufferPanNode).connect(this.bufferReverbNode).connect(this.bufferCtx.destination);
    } else {
      this.bufferTrack1.connect(this.bufferGainNode).connect(this.bufferPanNode).connect(this.bufferCtx.destination);
      this.bufferTrack2.connect(this.bufferGainNode).connect(this.bufferPanNode).connect(this.bufferCtx.destination);
    }

		this.bufferTrack1.onended = () => {
      console.log('onended()...');
      if (this.bufferReverb) {
        this.bufferReverbNode.disconnect();
      }
      this.bufferPanNode.disconnect();
      this.bufferGainNode.disconnect();
      this.bufferTrack1.disconnect();
      this.bufferTrack2.disconnect();
      this.bufferIsPlaying = false;
      this.zone.run(() => {});
    }
    this.bufferTrack1.start(this.bufferCtx.currentTime);
    this.bufferTrack2.start(this.bufferCtx.currentTime);
    this.bufferIsPlaying = true;
	}

  playVideoTag = async () => {
    console.log('playVideoTag()...');
    const myTimer = setInterval(() => {
      this.videoTagTime = this.videoTagTrack.mediaElement.currentTime;
    }, 2500);

    if (this.videoTagIsPlaying) {
			this.videoTagTrack.mediaElement.pause();
			this.videoTagIsPlaying = false;
		} else {
      this.videoTagTrack.connect(this.videoTagGainNode).connect(this.videoTagPanNode).connect(this.videoTagCtx.destination);

      this.videoTagTrack.mediaElement.onended = () => {
        console.log('onended()...')
        this.videoTagPanNode.disconnect();
        this.videoTagGainNode.disconnect();
        this.videoTagTrack.disconnect();
        clearInterval(myTimer);
        this.videoTagIsPlaying = false;
      }
      this.videoTagTrack.mediaElement.play();
			this.videoTagIsPlaying = true;
		}
	}

	openHelp() {
		this.showHelp = true;
	}
	closeHelp() {
		this.showHelp = false;
	}

}
