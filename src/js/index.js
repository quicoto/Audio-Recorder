const $ = {
  canvas: document.querySelector('.visualizer'),
  download: document.querySelector('.button__download'),
  mainSection: document.querySelector('.main-controls'),
  record: document.querySelector('.button__record'),
  soundClips: document.querySelector('.soundClips'),
  stop: document.querySelector('.button__stop')
};

// disable stop button while not recording

stop.disabled = true;

// visualiser setup - create web audio api context and canvas

let audioCtx;
const canvasCtx = $.canvas.getContext('2d');

// main block for doing the audio recording

if (navigator.mediaDevices.getUserMedia) {
  const constraints = { audio: true };
  let chunks = [];

  const onSuccess = function (stream) {
    const mediaRecorder = new MediaRecorder(stream);

    // eslint-disable-next-line no-use-before-define
    visualize(stream);

    $.record.onclick = function () {
      mediaRecorder.start();

      $.stop.removeAttribute('hidden');
      $.record.setAttribute('hidden', 'true');
    };

    $.stop.onclick = function () {
      mediaRecorder.stop();

      $.record.removeAttribute('hidden');
      $.stop.setAttribute('hidden', 'true');
    };

    mediaRecorder.onstop = function () {
      const date = new Date();
      const minutes = date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes();
      const defaultName = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${minutes}`;

      // eslint-disable-next-line no-alert
      const clipName = prompt('Enter a name for your sound clip', defaultName);

      const $clipContainer = document.createElement('article');
      const $clipLabel = document.createElement('h4');
      const $audio = document.createElement('audio');
      const $downloadLink = document.createElement('a');

      $clipLabel.classList.add('recordingHeading');
      $downloadLink.innerText = 'Download this recording';

      $clipContainer.classList.add('clip');
      $audio.setAttribute('controls', '');

      const $labelImage = '<img src="./assets/icons/music.svg">';

      $clipLabel.innerHTML = $labelImage;

      if (clipName === null) {
        $clipLabel.innerHTML += 'My unnamed clip';
      } else {
        $clipLabel.innerHTML += clipName;
      }

      $clipContainer.appendChild($clipLabel);
      $clipContainer.appendChild($audio);
      $clipContainer.appendChild($downloadLink);
      $.soundClips.appendChild($clipContainer);
      $.soundClips.removeAttribute('hidden');

      $audio.controls = true;
      const blob = new Blob(chunks, { type: 'audio/ogg; codecs=opus' });
      chunks = [];
      const audioURL = window.URL.createObjectURL(blob);
      $audio.src = audioURL;

      $downloadLink.href = audioURL;
      $downloadLink.download = `${clipName}.ogg`;
    };

    mediaRecorder.ondataavailable = function (e) {
      chunks.push(e.data);
    };
  };

  const onError = function (err) {
    // eslint-disable-next-line no-console
    console.log(`The following error occured: ${err}`);
  };

  navigator.mediaDevices.getUserMedia(constraints).then(onSuccess, onError);
} else {
  // eslint-disable-next-line no-console
  console.log('getUserMedia not supported on your browser!');
}

function visualize(stream) {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }

  const source = audioCtx.createMediaStreamSource(stream);

  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 2048;
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  source.connect(analyser);

  // eslint-disable-next-line no-use-before-define
  draw();

  function draw() {
    const WIDTH = $.canvas.width;
    const HEIGHT = $.canvas.height;

    requestAnimationFrame(draw);

    analyser.getByteTimeDomainData(dataArray);

    canvasCtx.fillStyle = 'rgb(255, 255, 255)';
    canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = 'rgb(0, 0, 0)';

    canvasCtx.beginPath();

    const sliceWidth = (WIDTH * 1.0) / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i += 1) {
      const v = dataArray[i] / 128.0;
      const y = (v * HEIGHT) / 2;

      if (i === 0) {
        canvasCtx.moveTo(x, y);
      } else {
        canvasCtx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    canvasCtx.lineTo($.canvas.width, $.canvas.height / 2);
    canvasCtx.stroke();
  }
}
