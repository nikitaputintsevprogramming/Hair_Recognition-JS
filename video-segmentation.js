import { ImageSegmenter, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.2";

const demosSection = document.getElementById("demos");
let runningMode = "IMAGE";
const resultWidthHeigth = 256;
let imageSegmenter;
let labels;
const legendColors = [
    [255, 197, 0, 255], // 0: Vivid Yellow
    [128, 62, 117, 255], // 1: Deep Purple
    [255, 104, 0, 255], // 2: Vivid Orange
    [166, 189, 215, 255], // 3: Soft Blue
    [193, 0, 32, 255], // 4: Crimson Red
    [206, 162, 98, 255], // 5: Sandy Brown
    [129, 112, 102, 255], // 6: Muted Gray
    [0, 125, 52, 255], // 7: Forest Green
    [246, 118, 142, 255], // 8: Vivid Pink
    [0, 83, 138, 255], // 9: Dark Blue
    [255, 112, 92, 255], // 10: Light Red
    [83, 55, 112, 255], // 11: Purple Gray
    [255, 142, 0, 255], // 12: Bright Orange
    [179, 40, 81, 255], // 13: Magenta
    [244, 200, 0, 255], // 14: Golden Yellow
    [127, 24, 13, 255], // 15: Deep Brown
    [147, 170, 0, 255], // 16: Olive Green
    [89, 51, 21, 255], // 17: Dark Brownвсего
    [241, 58, 19, 255], // 18: Bright Red
    [35, 44, 22, 255], // 19: Dark Olive
    [0, 161, 194, 255]  // 20: Vivid Blue
];

const createImageSegmenter = async () => {
    const audio = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.2/wasm");
    imageSegmenter = await ImageSegmenter.createFromOptions(audio, {
        baseOptions: {
            // ***Расскоментировать для выбора нужной модели (ниже представлены варианты)***
            // # https://ai.google.dev/edge/mediapipe/solutions/vision/image_segmenter#selfie-model *(Selfie segmentation model)*
            // modelAssetPath: "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite", // *SelfieSegmenter (square)* 
            // modelAssetPath: "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter_landscape/float16/latest/selfie_segmenter_landscape.tflite", // *SelfieSegmenter (landscape)*

            // https://ai.google.dev/edge/mediapipe/solutions/vision/image_segmenter#hair-model *(Hair segmentation model)*
            // modelAssetPath: "https://storage.googleapis.com/mediapipe-models/image_segmenter/hair_segmenter/float32/latest/hair_segmenter.tflite", // *HairSegmenter*

            // https://ai.google.dev/edge/mediapipe/solutions/vision/image_segmenter#multiclass-model *(Multi-class selfie segmentation model)*
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite", // *SelfieMulticlass (256 x 256)*
            // распознает в целом волосы, без пустых мест и обводка с запасом (отступом), точная

            // https://ai.google.dev/edge/mediapipe/solutions/vision/image_segmenter#deeplab-v3 *(DeepLab-v3 model)*
            // modelAssetPath: "https://storage.googleapis.com/mediapipe-models/image_segmenter/deeplab_v3/float32/latest/deeplab_v3.tflite", // *DeepLab-V3*
            // распознает в целом волосы, без пусты мест и обводка с запасом (отступом), неточная
            delegate: "GPU"
        },
        runningMode: runningMode,
        outputCategoryMask: true,
        outputConfidenceMasks: false
    });
    labels = imageSegmenter.getLabels();
    demosSection.classList.remove("invisible");
};
createImageSegmenter();

// Get DOM elements
const video = document.getElementById("webcam");
const canvasElement = document.getElementById("canvas");
const canvasCtx = canvasElement.getContext("2d");
const webcamPredictions = document.getElementById("webcamPredictions");

let enableWebcamButton;
let webcamRunning = false;
const videoHeight = "360px";
const videoWidth = "480px";

function callbackForVideo(result) {
    let imageData = canvasCtx.getImageData(0, 0, video.videoWidth, video.videoHeight).data;
    const mask = result.categoryMask.getAsFloat32Array();
    // let j = 0; // OLD
    // NEW 
    const contourWidth = parseInt(document.getElementById("contourWidth").value); // Get the contour width from the slider
    const hairColorIndex = 1; // Hair category index

    // Create a new ImageData for drawing the contours
    const newCanvas = document.createElement("canvas");
    const newCtx = newCanvas.getContext("2d");
    newCanvas.width = video.videoWidth;
    newCanvas.height = video.videoHeight;
    // NEW END

    const showBackground = document.getElementById("showBackground").checked;
    const showHair = document.getElementById("showHair").checked;
    const showBodySkin = document.getElementById("showBodySkin").checked;
    const showFaceSkin = document.getElementById("showFaceSkin").checked;
    const showClothes = document.getElementById("showClothes").checked;
    const showOthers = document.getElementById("showOthers").checked;

    // Draw the segmentation result on the new canvas
    for (let i = 0; i < mask.length; ++i) {
        const maskVal = Math.round(mask[i] * 255.0);

        // const segment = mask[i];
        const segment = Math.round(mask[i] * 255.0);
        // Фильтрация по чекбоксам
        if (
            (segment === 0 && !showBackground) ||
            (segment === 1 && !showHair) ||
            (segment === 2 && !showBodySkin) ||
            (segment === 3 && !showFaceSkin) ||
            (segment === 4 && !showClothes) ||
            (segment === 5 && !showOthers)
        ) {
            continue; // Пропускаем этот сегмент, если он не выбран
        }
        const legendColor = legendColors[maskVal % legendColors.length];
       
        imageData[i * 4] = (legendColor[0] + imageData[i * 4]) / 2;
        imageData[i * 4 + 1] = (legendColor[1] + imageData[i * 4 + 1]) / 2;
        imageData[i * 4 + 2] = (legendColor[2] + imageData[i * 4 + 2]) / 2;
        imageData[i * 4 + 3] = (legendColor[3] + imageData[i * 4 + 3]) / 2;
        
        // If the current pixel is part of the hair category, draw a contour
        if (mask[i] === hairColorIndex) {
            const x = (i % video.videoWidth);
            const y = Math.floor(i / video.videoWidth);

            // Draw a black contour
            for (let dx = -contourWidth; dx <= contourWidth; dx++) {
                for (let dy = -contourWidth; dy <= contourWidth; dy++) {
                    if (dx !== 0 || dy !== 0) {
                        const newX = x + dx;
                        const newY = y + dy;
                        if (newX >= 0 && newX < video.videoWidth && newY >= 0 && newY < video.videoHeight) {
                            const idx = (newY * video.videoWidth + newX) * 4;
                            imageData[idx] = 0;     // Set red channel to 0
                            imageData[idx + 1] = 0; // Set green channel to 0
                            imageData[idx + 2] = 0; // Set blue channel to 0
                            imageData[idx + 3] = 255; // Set alpha channel to fully opaque
                        }
                    }
                }
            }
        }
    }

    const uint8Array = new Uint8ClampedArray(imageData.buffer);
    const dataNew = new ImageData(uint8Array, video.videoWidth, video.videoHeight);
    canvasCtx.putImageData(dataNew, 0, 0);

    if (webcamRunning === true) {
        window.requestAnimationFrame(predictWebcam);
    }
    // NEW END
}
/********************************************************************
// Demo 2: Continuously grab image from webcam stream and segmented it.
********************************************************************/
// Check if webcam access is supported.
function hasGetUserMedia() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}
// Get segmentation from the webcam
let lastWebcamTime = -1;
async function predictWebcam() {
    if (video.currentTime === lastWebcamTime) {
        if (webcamRunning === true) {
            window.requestAnimationFrame(predictWebcam);
        }
        return;
    }
    lastWebcamTime = video.currentTime;
    canvasCtx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    // Do not segmented if imageSegmenter hasn't loaded
    if (imageSegmenter === undefined) {
        return;
    }
    // if image mode is initialized, create a new segmented with video runningMode
    if (runningMode === "IMAGE") {
        runningMode = "VIDEO";
        await imageSegmenter.setOptions({
            runningMode: runningMode
        });
    }
    let startTimeMs = performance.now();
    // Start segmenting the stream.
    imageSegmenter.segmentForVideo(video, startTimeMs, callbackForVideo);
}
// Enable the live webcam view and start imageSegmentation.
async function enableCam(event) {
    if (imageSegmenter === undefined) {
        return;
    }
    if (webcamRunning === true) {
        webcamRunning = false;
        enableWebcamButton.innerText = "ENABLE SEGMENTATION";
    }
    else {
        webcamRunning = true;
        enableWebcamButton.innerText = "DISABLE SEGMENTATION";
    }
    // getUsermedia parameters.
    const constraints = {
        video: true
    };
    // Activate the webcam stream.
    video.srcObject = await navigator.mediaDevices.getUserMedia(constraints);
    video.addEventListener("loadeddata", predictWebcam);
}
// If webcam supported, add event listener to button.
if (hasGetUserMedia()) {
    enableWebcamButton = document.getElementById("webcamButton");
    enableWebcamButton.addEventListener("click", enableCam);
}
else {
    console.warn("getUserMedia() is not supported by your browser");
}