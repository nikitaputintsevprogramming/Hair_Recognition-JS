// // Get DOM elements
// const video = document.getElementById("webcam");
// const canvasElement = document.getElementById("canvas");
// const canvasCtx = canvasElement.getContext("2d");
// const webcamPredictions = document.getElementById("webcamPredictions");

// let enableWebcamButton;
// let webcamRunning = false;
// const videoHeight = "360px";
// const videoWidth = "480px";

// function callbackForVideo(result) {
//     let imageData = canvasCtx.getImageData(0, 0, video.videoWidth, video.videoHeight).data;
//     const mask = result.categoryMask.getAsFloat32Array();
//     // let j = 0; // OLD
//     // NEW 
//     const contourWidth = parseInt(document.getElementById("contourWidth").value); // Get the contour width from the slider
//     const hairColorIndex = 1; // Hair category index

//     // Create a new ImageData for drawing the contours
//     const newCanvas = document.createElement("canvas");
//     const newCtx = newCanvas.getContext("2d");
//     newCanvas.width = video.videoWidth;
//     newCanvas.height = video.videoHeight;
//     // NEW END

//     // Draw the segmentation result on the new canvas
//     for (let i = 0; i < mask.length; ++i) {
//         const maskVal = Math.round(mask[i] * 255.0);
//         const legendColor = legendColors[maskVal % legendColors.length];
//         // OLD START
//     //     imageData[j] = (legendColor[0] + imageData[j]) / 2;
//     //     imageData[j + 1] = (legendColor[1] + imageData[j + 1]) / 2;
//     //     imageData[j + 2] = (legendColor[2] + imageData[j + 2]) / 2;
//     //     imageData[j + 3] = (legendColor[3] + imageData[j + 3]) / 2;
//     //     j += 4;
//     // }
//     // const uint8Array = new Uint8ClampedArray(imageData.buffer);
//     // const dataNew = new ImageData(uint8Array, video.videoWidth, video.videoHeight);
//     // canvasCtx.putImageData(dataNew, 0, 0);
//     // if (webcamRunning === true) {
//     //     window.requestAnimationFrame(predictWebcam);
//     // }
//     // OLD END

//     // NEW START
//         imageData[i * 4] = (legendColor[0] + imageData[i * 4]) / 2;
//         imageData[i * 4 + 1] = (legendColor[1] + imageData[i * 4 + 1]) / 2;
//         imageData[i * 4 + 2] = (legendColor[2] + imageData[i * 4 + 2]) / 2;
//         imageData[i * 4 + 3] = (legendColor[3] + imageData[i * 4 + 3]) / 2;
        
//         // If the current pixel is part of the hair category, draw a contour
//         if (mask[i] === hairColorIndex) {
//             const x = (i % video.videoWidth);
//             const y = Math.floor(i / video.videoWidth);

//             // Draw a black contour
//             for (let dx = -contourWidth; dx <= contourWidth; dx++) {
//                 for (let dy = -contourWidth; dy <= contourWidth; dy++) {
//                     if (dx !== 0 || dy !== 0) {
//                         const newX = x + dx;
//                         const newY = y + dy;
//                         if (newX >= 0 && newX < video.videoWidth && newY >= 0 && newY < video.videoHeight) {
//                             const idx = (newY * video.videoWidth + newX) * 4;
//                             imageData[idx] = 0;     // Set red channel to 0
//                             imageData[idx + 1] = 0; // Set green channel to 0
//                             imageData[idx + 2] = 0; // Set blue channel to 0
//                             imageData[idx + 3] = 255; // Set alpha channel to fully opaque
//                         }
//                     }
//                 }
//             }
//         }
//     }

//     const uint8Array = new Uint8ClampedArray(imageData.buffer);
//     const dataNew = new ImageData(uint8Array, video.videoWidth, video.videoHeight);
//     canvasCtx.putImageData(dataNew, 0, 0);

//     if (webcamRunning === true) {
//         window.requestAnimationFrame(predictWebcam);
//     }
//     // NEW END
// }
// /********************************************************************
// // Demo 2: Continuously grab image from webcam stream and segmented it.
// ********************************************************************/
// // Check if webcam access is supported.
// function hasGetUserMedia() {
//     return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
// }
// // Get segmentation from the webcam
// let lastWebcamTime = -1;
// async function predictWebcam() {
//     if (video.currentTime === lastWebcamTime) {
//         if (webcamRunning === true) {
//             window.requestAnimationFrame(predictWebcam);
//         }
//         return;
//     }
//     lastWebcamTime = video.currentTime;
//     canvasCtx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
//     // Do not segmented if imageSegmenter hasn't loaded
//     if (imageSegmenter === undefined) {
//         return;
//     }
//     // if image mode is initialized, create a new segmented with video runningMode
//     if (runningMode === "IMAGE") {
//         runningMode = "VIDEO";
//         await imageSegmenter.setOptions({
//             runningMode: runningMode
//         });
//     }
//     let startTimeMs = performance.now();
//     // Start segmenting the stream.
//     imageSegmenter.segmentForVideo(video, startTimeMs, callbackForVideo);
// }
// // Enable the live webcam view and start imageSegmentation.
// async function enableCam(event) {
//     if (imageSegmenter === undefined) {
//         return;
//     }
//     if (webcamRunning === true) {
//         webcamRunning = false;
//         enableWebcamButton.innerText = "ENABLE SEGMENTATION";
//     }
//     else {
//         webcamRunning = true;
//         enableWebcamButton.innerText = "DISABLE SEGMENTATION";
//     }
//     // getUsermedia parameters.
//     const constraints = {
//         video: true
//     };
//     // Activate the webcam stream.
//     video.srcObject = await navigator.mediaDevices.getUserMedia(constraints);
//     video.addEventListener("loadeddata", predictWebcam);
// }
// // If webcam supported, add event listener to button.
// if (hasGetUserMedia()) {
//     enableWebcamButton = document.getElementById("webcamButton");
//     enableWebcamButton.addEventListener("click", enableCam);
// }
// else {
//     console.warn("getUserMedia() is not supported by your browser");
// }