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
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite", // *SelfieMulticlass (256 x 256)*
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

let contourWidth = 1.05,
    contourOpacityInput = 0.01,
    hairOpacityInput = 0.4,
    blurIntense = 0.001,
    blurWidthListen = 2;


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


// Получаем элементы выбора цвета
const contourColorInput = document.getElementById("contourColor");
const hairColorInput = document.getElementById("hairColor");

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

function applyBlur(imageData, width, height, mask, segmentValue, sigmaKoef, contourWidthBlurValueInHair, contourWidthBlurEdges) { // , contourColor, contourOpacity (contourWidthBlurEdges лучше не трогать, пока не понятно в консоли пишет = undefined)
    const blurredImageData = new Uint8ClampedArray(imageData.length);
    const kernelSize = Math.ceil(sigmaKoef * 6); // Размер ядра (обычно 6 * sigmaKoef)
    const kernelOffset = Math.floor(kernelSize / 2);

    // Генерация гауссового ядра
    const gaussianKernel = [];
    const twosigmaKoefSq = 10 * sigmaKoef * sigmaKoef; // чувствительность
    let sum = 0;

    // Создаем ядро
    for (let y = -kernelOffset; y <= kernelOffset; y++) {
        for (let x = -kernelOffset; x <= kernelOffset; x++) {
            const weight = Math.exp(-(x * x + y * y) / twosigmaKoefSq);
            gaussianKernel.push(weight);
            sum += weight;
        }
    }

    // Нормализация ядра
    for (let i = 0; i < gaussianKernel.length; i++) {
        gaussianKernel[i] /= sum;
    }

    // Применение размытия
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;

            // Проверяем, является ли пиксель внутри области волос
            if ( Math.round(mask[y * width + x] * 255.0) !== segmentValue) {
                // mask[y * width + x] вместо  Math.round(mask[y * width + x] * 255.0)
                let isEdgePixel = false;
                for (let dw = -contourWidthBlurValueInHair; dw <= contourWidthBlurValueInHair; dw++) {
                    for (let dh = -contourWidthBlurValueInHair; dh <= contourWidthBlurValueInHair; dh++) {
                        const nx = x + dw;
                        const ny = y + dh;
                        if (nx >= 0 && nx < width && ny >= 0 && ny < height && ( Math.round(mask[ny * width + nx] * 255.0)=== segmentValue)) {
                            isEdgePixel = true; // Пиксель является краевым
                            break;
                        }
                    }
                    if (isEdgePixel) break;
                }

                // Если пиксель является краевым, применяем размытие
                if (isEdgePixel) {
                    let r = 0, g = 0, b = 0;
                    let kernelIndex = 0;

                    // Применяем ядро к каждому пикселю в окрестностях
                    for (let ky = -kernelOffset; ky <= kernelOffset; ky++) {
                        for (let kx = -kernelOffset; kx <= kernelOffset; kx++) {
                            const nx = x + kx;
                            const ny = y + ky;
                            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                                const ni = (ny * width + nx) * 4;
                                const weight = gaussianKernel[kernelIndex];

                                // Суммируем цвет с учетом веса
                                r += imageData[ni] * weight;
                                g += imageData[ni + 1] * weight;
                                b += imageData[ni + 2] * weight;
                            }
                            kernelIndex++;
                        }
                    }

                    // Убедимся, что результат размытия остаётся в диапазоне 0-255
                    blurredImageData[i] = Math.min(255, Math.max(0, r));
                    blurredImageData[i + 1] = Math.min(255, Math.max(0, g));
                    blurredImageData[i + 2] = Math.min(255, Math.max(0, b));
                    blurredImageData[i + 3] = imageData[i + 3]; // Сохраняем альфа-канал
                } else {
                    // Если не краевой, просто копируем цвет
                    blurredImageData[i] = imageData[i];         // R
                    blurredImageData[i + 1] = imageData[i + 1]; // G
                    blurredImageData[i + 2] = imageData[i + 2]; // B
                    blurredImageData[i + 3] = imageData[i + 3]; // A
                }
            } else {
                // Если пиксель принадлежит сегменту, просто копируем цвет
                blurredImageData[i] = imageData[i];         // R
                blurredImageData[i + 1] = imageData[i + 1]; // G
                blurredImageData[i + 2] = imageData[i + 2]; // B
                blurredImageData[i + 3] = imageData[i + 3]; // A
            }
        }
    }

    // Наносим контур на края
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;

            // Если пиксель является краевым, рисуем контур
            if (Math.round(mask[y * width + x] * 255.0) !== segmentValue) {
                // mask[y * width + x] вместо  Math.round(mask[y * width + x] * 255.0) 
                for (let dw = -contourWidthBlurEdges; dw <= contourWidthBlurEdges; dw++) {
                    for (let dh = -contourWidthBlurEdges; dh <= contourWidthBlurEdges; dh++) {
                        const nx = x + dw;
                        const ny = y + dh;
                        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                            const index = (ny * width + nx) * 4;

                            // Получаем исходный цвет в контуре
                            const originalR = blurredImageData[index];     // Исходный красный
                            const originalG = blurredImageData[index + 1]; // Исходный зеленый
                            const originalB = blurredImageData[index + 2]; // Исходный синий
                            const originalA = blurredImageData[index + 3]; // Исходная альфа

                            // Смешиваем новый цвет с исходным цветом с учетом прозрачности
                            blurredImageData[index] = (contourColor.r * contourOpacity + originalR * (1 - contourOpacity)); // Red channel
                            blurredImageData[index + 1] = (contourColor.g * contourOpacity + originalG * (1 - contourOpacity)); // Green channel
                            blurredImageData[index + 2] = (contourColor.b * contourOpacity + originalB * (1 - contourOpacity)); // Blue channel
                            blurredImageData[index + 3] = (255 * contourOpacity + originalA * (1 - contourOpacity)); // Alpha channel
                        }
                    }
                }
            }
        }
    }

    return blurredImageData;
}

function callbackForVideo(result) {
    let imageData = canvasCtx.getImageData(0, 0, video.videoWidth, video.videoHeight).data;
    const mask = result.categoryMask.getAsFloat32Array();
    // console.log("Segmentation mask:", mask); // Log the mask for inspection

    let hairCount = 0; // Initialize a count for hair pixels
    for (let i = 0; i < mask.length; i++) {
        if (Math.round(mask[i] * 255.0) === 1) { // Assuming 1 is the hair segment
            hairCount++;
        }
    }
    const hairColorIndex = 1; // Hair category index

    // Create a new ImageData for drawing the contours
    const newCanvas = document.createElement("canvas");
    const newCtx = newCanvas.getContext("2d");
    newCanvas.width = video.videoWidth;
    newCanvas.height = video.videoHeight;
    // NEW END

    const showBackground = false;
    const showHair = true;
    const showBodySkin = false;
    const showFaceSkin = false;
    const showClothes = false;
    const showOthers = false;


    const contourColor = hexToRgb(contourColorInput.value);
    const hairColor = hexToRgb(hairColorInput.value);
    const contourOpacity = parseFloat(contourOpacityInput);
    const hairOpacity = parseFloat(hairOpacityInput);

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

    // Контур
    for (let i = 0; i < mask.length; i++) {
        if (Math.round(mask[i] * 255.0) === 1) { // Область волос
            const x = i % video.videoWidth;
            const y = Math.floor(i / video.videoWidth);
            let isEdgePixel = false;

            // Проверяем соседние пиксели
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    const nx = x + dx;
                    const ny = y + dy;
                    if (nx >= 0 && nx < video.videoWidth && ny >= 0 && ny < video.videoHeight) {
                        const neighborIndex = ny * video.videoWidth + nx;
                        if (Math.round(mask[neighborIndex] * 255.0)!== 1) { // Если соседний пиксель не волосы  // Область волос
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
                        if (nx >= 0 && nx < video.videoWidth && ny >= 0 && ny < video.videoHeight) {
                            const index = ny * video.videoWidth + nx;

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

    // вся область волос
    // Добавляем цвет для волос с учетом прозрачности
    for (let j = 0; j < mask.length; j++) {
        // console.log(mask[j] ); // постоянно выводит 0 !!!
        // console.log("Mask values:", mask);
        if (Math.round(mask[j] * 255.0) == 1) { // Область волос
            const index = j * 4;

            // Получаем исходный цвет волос
            const originalR = imageData[index];     // Исходный красный
            const originalG = imageData[index + 1]; // Исходный зеленый
            const originalB = imageData[index + 2]; // Исходный синий
            const originalA = imageData[index + 3]; // Исходная альфа

            // Проверяем значения перед смешиванием
            // console.log(`Before mixing: originalR=${originalR}, originalG=${originalG}, originalB=${originalB}, hairColor=${JSON.stringify(hairColor)}`);

            // Смешиваем новый цвет с исходным цветом с учетом прозрачности
            // const opacity = 1; // Временно устанавливаем на 1 ВРЕМЕННО!!!
            imageData[index] = (hairColor.r * hairOpacity + originalR * (1 - hairOpacity)); // R
            imageData[index + 1] = (hairColor.g * hairOpacity + originalG * (1 - hairOpacity)); // G
            imageData[index + 2] = (hairColor.b * hairOpacity + originalB * (1 - hairOpacity)); // B
            imageData[index + 3] = Math.max(0, Math.min(255, originalA * (1 - hairOpacity) + (255 * hairOpacity))); // A
        }
    }
    const blurIntensity = blurIntense;
    const blurredImageData = applyBlur(imageData, video.videoWidth, video.videoHeight, mask, 1, blurIntense, blurWidthListen);

    // const uint8Array = new Uint8ClampedArray(imageData.buffer);
    const uint8Array = new Uint8ClampedArray(blurredImageData);
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