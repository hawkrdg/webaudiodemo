import { Component, NgZone, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.styl']
})
export class AppComponent implements OnInit {
  title = 'webaudio';
	showHelp = false;
	audioCtx1;
	audioCtx2;
	audioCtx3;
	mp3AudioLevel = 0.4;
	mp4AudioLevel = 0.4;
	mp4Length;
	mp4CurrentTime = 0.0;
	mp3Pan = 0;
	reverb = false;
	mp31IsPlaying = false;
	mp32IsPlaying = false;
	mp4IsPlaying = false;

	mp3Track1;
	mp3Track2;
	mp4Track1;
	mp3Track2Buf;
	mp3GainNode1;
	mp3GainNode2;
	mp4GainNode1;
	mp3PanNode1;
	mp3PanNode2;
	mp3ReverbNode1;
	mp3ReverbNode2;

	constructor(
		private zone: NgZone
	) {}

	async ngOnInit() {
		console.log('ngOnInit()...');
		this.audioCtx1 = new (window as any).AudioContext();
		this.audioCtx2 = new (window as any).AudioContext();
		this.audioCtx3 = new (window as any).AudioContext();

		// the <video> track
		//
		const videoEl = document.querySelector('video');
		this.mp4Track1 = this.audioCtx3.createMediaElementSource(videoEl);

		// the <audio> track
		//
		const audioEl = document.querySelector('audio');
		this.mp3Track1 = this.audioCtx1.createMediaElementSource(audioEl);

		// the buffer track
		//
		await fetch('assets/A3.mp3')
			.then(mp3 => mp3.arrayBuffer())
			.then(aBuf => this.audioCtx2.decodeAudioData(aBuf))
			.then(audioBuf => this.mp3Track2Buf = audioBuf);
	}

	async ngAfterViewInit() {

		// level control
		//
		this.mp3GainNode1 = this.audioCtx1.createGain();
		this.mp3GainNode2 = this.audioCtx2.createGain();
		this.mp4GainNode1 = this.audioCtx3.createGain();
		this.mp3GainNode1.gain.value = this.mp3AudioLevel;
		this.mp3GainNode2.gain.value = this.mp3AudioLevel;
		this.mp4GainNode1.gain.value = this.mp3AudioLevel;
		this.mp3Track1.mediaElement.volume = this.mp3AudioLevel;

		// panning
		//
		this.mp3PanNode1 = this.audioCtx1.createStereoPanner();
		this.mp3PanNode2 = this.audioCtx2.createStereoPanner();
		this.mp3PanNode1.pan.value = this.mp3Pan
		this.mp3PanNode2.pan.value = this.mp3Pan

		// Reverb
		//
		const reverbBuf = await fetch('assets/CathedralRoom.wav').then(
			// const reverbBuf = await fetch('assets/TijuanaAqueductTunnel.wav').then(
			// const reverbBuf = await fetch('assets/SaltonSeaDrainagePipe.wav').then(
			async (resp) => {
				const buf = await resp.arrayBuffer();
				return buf;
			}
		)
		this.mp3ReverbNode1 = this.audioCtx1.createConvolver();
		this.mp3ReverbNode2 = this.audioCtx2.createConvolver();
		this.mp3ReverbNode1.buffer = await this.audioCtx1.decodeAudioData(reverbBuf.slice(0));
		this.mp3ReverbNode2.buffer = await this.audioCtx2.decodeAudioData(reverbBuf.slice(0));
	}

	toggleReverb = () => {
		console.log('toggleReverb()...', this.reverb);
	}

	seekMp4 = () => {
		console.log('seekMp4()...');
	}

	toggleAudioMp3Play = () => {
		if (this.mp31IsPlaying) {
			this.mp3Track1.mediaElement.pause();
			this.mp31IsPlaying = false;
		} else if (this.audioCtx1.state === 'suspended'){
			this.audioCtx1.resume();
			this.mp31IsPlaying = true;
		} else {
			this.playMp31();
			this.mp31IsPlaying = true;
		}
	}

	toggleMp4Play = () => {
		if (this.mp4IsPlaying) {
			this.mp4Track1.mediaElement.pause();
			this.mp4IsPlaying = false;
		} else if (this.audioCtx3.state === 'suspended'){
			this.audioCtx3.resume();
			this.mp4IsPlaying = true;
		} else {
			this.playMp4();
			this.mp4IsPlaying = true;
		}
	}

	toggleBufferMp3Play = () => {
		if (this.mp32IsPlaying) {
			this.mp3Track2.mediaElement.pause();
			this.mp32IsPlaying = false;
		} else if (this.audioCtx2.state === 'suspended'){
			this.audioCtx2.resume();
			this.mp32IsPlaying = true;
		} else {
			this.playMp32();
			this.mp32IsPlaying = true;
		}
	}

	setMp4Level = () => {
		this.mp4GainNode1.gain.value = this.mp4AudioLevel;
	}

	setMp4Time = () => {
		this.mp4Track1.mediaElement.currentTime = this.mp4CurrentTime;
	}

	setLevel = () => {
		this.mp3GainNode1.gain.value = this.mp3AudioLevel;
		this.mp3GainNode2.gain.value = this.mp3AudioLevel;
		this.mp3Track1.mediaElement.volume = this.mp3AudioLevel;
	}

	setPan = () => {
		this.mp3PanNode1.pan.value = this.mp3Pan
		this.mp3PanNode2.pan.value = this.mp3Pan
	}

	playMp31 = async () => {
		console.log('playMp31()...');

		this.mp3Track1.connect(this.mp3GainNode1).connect(this.mp3PanNode1);
		if (this.reverb) {
			this.mp3PanNode1.connect(this.mp3ReverbNode1).connect(this.audioCtx1.destination);
		} else {
			this.mp3PanNode1.disconnect();
			this.mp3ReverbNode1.disconnect();
			this.mp3PanNode1.connect(this.audioCtx1.destination);
		}

		this.mp3Track1.mediaElement.onended = () => {
			this.mp31IsPlaying = false;
			this.mp3Track1.mediaElement.currentTime = 0;
		}
		this.mp3Track1.mediaElement.play();
	}

	playMp4 = async () => {
		console.log('playMp4()...');

		const trackUpdateTimer = setInterval(() => this.mp4CurrentTime = this.mp4Track1.mediaElement.currentTime, 4000);
		this.mp4Track1.connect(this.mp4GainNode1).connect(this.audioCtx3.destination);

		this.mp4Track1.mediaElement.onended = () => {
			this.mp4IsPlaying = false;
			clearInterval(trackUpdateTimer);
			this.mp4Track1.mediaElement.currentTime = 0;
		}
		this.mp4Track1.mediaElement.play();
	}

	playMp32 = async () => {
		console.log('playMp32()...');

		this.mp3Track2 = this.audioCtx2.createBufferSource();
		this.mp3Track2.buffer = this.mp3Track2Buf;
		this.mp3Track2.connect(this.mp3GainNode2).connect(this.mp3PanNode2);
		if (this.reverb) {
			this.mp3PanNode2.connect(this.mp3ReverbNode2).connect(this.audioCtx2.destination);
		} else {
			this.mp3PanNode2.disconnect();
			this.mp3ReverbNode2.disconnect();
			this.mp3PanNode2.connect(this.audioCtx2.destination);
		}

		this.mp3Track2.onended = () => {
			console.log('mp3Track2.onended()...')
			this.mp32IsPlaying = false;
			this.zone.run(() => {})
		}
		this.mp3Track2.start();
	}

	openHelp() {
		this.showHelp = true;
	}
	closeHelp() {
		this.showHelp = false;
	}
}
