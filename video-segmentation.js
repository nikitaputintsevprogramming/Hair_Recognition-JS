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

// Копировка цвета для волос с контура (взаимный цвет)
document.getElementById('copyHairColor').addEventListener('click', function () {
    const contourColorInput = document.getElementById('contourColor');
    const hairColorInput = document.getElementById('hairColor');

    const contourColor = contourColorInput.value; // Получаем выбранный цвет

    // Копируем цвет в буфер обмена
    navigator.clipboard.writeText(contourColor).then(() => {
        // alert('Цвет для волос скопирован: ' + contourColor);
        hairColorInput.value = contourColor; // Устанавливаем цвет контура как цвет волос
    }).catch(err => {
        console.error('Ошибка при копировании цвета: ', err);
    });
});

// ----------------------------


let contourWidth;

document.addEventListener("DOMContentLoaded", () => {
    const contourInput = document.getElementById("contourWidth");
    contourWidth = contourInput.valueAsNumber; // Set initial value from slider input
    console.log("Initial Contour Width:", contourWidth);

    contourInput.addEventListener("input", function () {
        contourWidth = contourInput.valueAsNumber;
        console.log("Contour Width updated:", contourWidth);
    });
});

// Получаем элементы выбора цвета
const contourColorInput = document.getElementById("contourColor");
const hairColorInput = document.getElementById("hairColor");

// Получаем элементы выбора прозрачности
const contourOpacityInput = document.getElementById("contourOpacity");
const hairOpacityInput = document.getElementById("hairOpacity");

let blurIntense;

document.addEventListener("DOMContentLoaded", () => {
    const blurIntenseInput = document.getElementById("blurIntensity");
    blurIntense = blurIntenseInput.valueAsNumber; // Установка начального значения из ползунка
    console.log("Initial Blur Intensity:", blurIntense); // Исправлено имя переменной

    // Добавляем обработчик события для изменения интенсивности размытия
    blurIntenseInput.addEventListener("input", function () {
        blurIntense = blurIntenseInput.valueAsNumber; // Обновляем значение
        console.log("Blur Intensity updated:", blurIntense);
    });
});

let blurWidthListen;

document.addEventListener("DOMContentLoaded", () => {
    const blurWidthInput = document.getElementById("blurWidth");
    blurWidthListen = blurWidthInput.valueAsNumber; // Установка начального значения из ползунка
    console.log("Initial Blur Width:", blurWidthListen); // Исправлено имя переменной

    // Добавляем обработчик события для изменения интенсивности размытия
    blurWidthInput.addEventListener("input", function () {
        blurWidthListen = blurWidthInput.valueAsNumber; // Обновляем значение
        console.log("Blur Width updated:", blurWidthListen);
    });
});

// Функция для преобразования HEX в RGB
function hexToRgb(hex) {
    const bigint = parseInt(hex.slice(1), 16);
    return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255,
    };
}

// const width = canvasElement.width;
// const height = canvasElement.height;

function callbackForVideo(result) {
    let imageData = canvasCtx.getImageData(0, 0, video.videoWidth, video.videoHeight).data;
    const mask = result.categoryMask.getAsFloat32Array();
    // console.log("Segmentation mask:", mask); // Log the mask for inspection

    let hairCount = 0; // Initialize a count for hair pixels
    for (let i = 0; i < mask.length; i++) {
        if (mask[i] === 1) { // Assuming 1 is the hair segment
            hairCount++;
        }
    }
    // console.log("Hair pixels detected:", hairCount); // Log the hair pixel count
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

    const contourColor = hexToRgb(contourColorInput.value);
    const hairColor = hexToRgb(hairColorInput.value);
    const contourOpacity = parseFloat(contourOpacityInput.value);
    const hairOpacity = parseFloat(hairOpacityInput.value);


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
        // console.log("CHECKING", mask);

        imageData[i * 4] = (legendColor[0] + imageData[i * 4]) / 2;
        imageData[i * 4 + 1] = (legendColor[1] + imageData[i * 4 + 1]) / 2;
        imageData[i * 4 + 2] = (legendColor[2] + imageData[i * 4 + 2]) / 2;
        imageData[i * 4 + 3] = (legendColor[3] + imageData[i * 4 + 3]) / 2;
        
    }


    for (let i = 0; i < mask.length; i++) {
        if (mask[i] === 1) { // Область волос
            const x = i % width;
            const y = Math.floor(i / width);
            let isEdgePixel = false;

            // Проверяем соседние пиксели
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    const nx = x + dx;
                    const ny = y + dy;
                    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                        const neighborIndex = ny * width + nx;
                        if (mask[neighborIndex] !== 1) { // Если соседний пиксель не волосы
                            isEdgePixel = true;
                            break; // Выходим, если нашли хотя бы одного соседнего пикселя, который не является волосами
                        }
                    }
                }
                if (isEdgePixel) break; // Прерываем внешний цикл, если уже нашли крайний пиксель
            }
            // Если пиксель является краевым, рисуем контур
            if (isEdgePixel) {
                for (let dw = -contourWidth; dw <= contourWidth; dw++) {
                    for (let dh = -contourWidth; dh <= contourWidth; dh++) {
                        const nx = x + dw;
                        const ny = y + dh;
                        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                            const index = ny * width + nx;

                            // Получаем исходный цвет в контуре
                            const originalR = imageData[(index * 4)];     // Исходный красный
                            const originalG = imageData[(index * 4) + 1]; // Исходный зеленый
                            const originalB = imageData[(index * 4) + 2]; // Исходный синий
                            const originalA = imageData[(index * 4) + 3]; // Исходная альфа

                            // Смешиваем новый цвет с исходным цветом с учетом прозрачности
                            // Mixing the new contour color with the original color considering the opacity
                            imageData[(index * 4)] = (contourColor.r * contourOpacity + originalR * (1 - contourOpacity)); // Red channel
                            imageData[(index * 4) + 1] = (contourColor.g * contourOpacity + originalG * (1 - contourOpacity)); // Green channel
                            imageData[(index * 4) + 2] = (contourColor.b * contourOpacity + originalB * (1 - contourOpacity)); // Blue channel
                            imageData[(index * 4) + 3] = (255 * contourOpacity + originalA * (1 - contourOpacity)); // Alpha channel
                        }
                    }
                }
            }
        }
    }

    // Draw the updated image data back to the canvas
    const updatedImageData = new ImageData(new Uint8ClampedArray(imageData), video.videoWidth, video.videoHeight);
    // const updatedImageData = new ImageData(new Uint8ClampedArray(imageData), width, height);
    newCtx.putImageData(updatedImageData, 0, 0);
    // console.log("Mask values:", mask);

    // Добавляем цвет для волос с учетом прозрачности
    for (let j = 0; j < mask.length; j++) {

        // console.log("Mask values:", mask);
        if (mask[j] != 1) { // Область волос
            const index = j * 4;

            // Получаем исходный цвет волос
            const originalR = imageData[index];     // Исходный красный
            const originalG = imageData[index + 1]; // Исходный зеленый
            const originalB = imageData[index + 2]; // Исходный синий
            const originalA = imageData[index + 3]; // Исходная альфа

            // Проверяем значения перед смешиванием
            // console.log(`Before mixing: originalR=${originalR}, originalG=${originalG}, originalB=${originalB}, hairColor=${JSON.stringify(hairColor)}`);

            // Смешиваем новый цвет с исходным цветом с учетом прозрачности
            const opacity = 1; // Временно устанавливаем на 1 ВРЕМЕННО!!!
            imageData[index] = (hairColor.r * hairOpacity + originalR * (1 - hairOpacity)); // R
            imageData[index + 1] = (hairColor.g * hairOpacity + originalG * (1 - hairOpacity)); // G
            imageData[index + 2] = (hairColor.b * hairOpacity + originalB * (1 - hairOpacity)); // B
            imageData[index + 3] = Math.max(0, Math.min(255, originalA * (1 - hairOpacity) + (255 * hairOpacity))); // A
        }
    }


    const uint8Array = new Uint8ClampedArray(imageData.buffer);
    const dataNew = new ImageData(uint8Array, video.videoWidth, video.videoHeight);
    canvasCtx.putImageData(dataNew, 0, 0);
    // canvasCtx.putImageData(new ImageData(imageData, video.videoWidth, video.videoHeight), 0, 0);
    // canvasCtx.putImageData(new ImageData(new Uint8ClampedArray(imageData), video.videoWidth, video.videoHeight), 0, 0);


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