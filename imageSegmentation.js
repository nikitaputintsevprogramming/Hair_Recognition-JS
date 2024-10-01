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
const imageContainers = document.getElementsByClassName("segmentOnClick");
// Add click event listeners for the img elements.
for (let i = 0; i < imageContainers.length; i++) {
    imageContainers[i]
        .getElementsByTagName("img")[0]
        .addEventListener("click", handleClick);
}
/**
 * Demo 1: Segmented images on click and display results.
 */
let canvasClick;
async function handleClick(event) {
    // Do not segment if imageSegmenter hasn't loaded
    if (imageSegmenter === undefined) {
        return;
    }
    canvasClick = event.target.parentElement.getElementsByTagName("canvas")[0];
    canvasClick.classList.remove("removed");
    canvasClick.width = event.target.naturalWidth;
    canvasClick.height = event.target.naturalHeight;

    // Create context with willReadFrequently attribute
    const cxt = canvasClick.getContext("2d", { willReadFrequently: true });
    cxt.clearRect(0, 0, canvasClick.width, canvasClick.height);
    cxt.drawImage(event.target, 0, 0, canvasClick.width, canvasClick.height);
    event.target.style.opacity = 0;

    // If VIDEO mode is initialized, set runningMode to IMAGE
    if (runningMode === "VIDEO") {
        runningMode = "IMAGE";
        await imageSegmenter.setOptions({
            runningMode: runningMode
        });
    }
    // imageSegmenter.segment() when resolved will call the callback function.
    imageSegmenter.segment(event.target, callback);
}

let contourWidth;

document.addEventListener("DOMContentLoaded", () => {
  const contourInput = document.getElementById("contourWidth");
  contourWidth = contourInput.valueAsNumber; // Set initial value from slider input
  console.log("Initial Contour Width:", contourWidth);

  contourInput.addEventListener("input", function() {
    contourWidth = contourInput.valueAsNumber;
    console.log("Contour Width updated:", contourWidth);
  });
});


function callback(result) {
    const cxt = canvasClick.getContext("2d");
    const { width, height } = result.categoryMask;
    let imageData = cxt.getImageData(0, 0, width, height).data;
    canvasClick.width = width;
    canvasClick.height = height;
    let category = "";
    const mask = result.categoryMask.getAsUint8Array();

    // NEW START
    // Получаем значение ширины контура из ползунка

    
    // NEW END

    for (let i in mask) {
        if (mask[i] > 0) {
            category = labels[mask[i]];
        }
        const legendColor = legendColors[mask[i] % legendColors.length];
        imageData[i * 4] = (legendColor[0] + imageData[i * 4]) / 2;
        imageData[i * 4 + 1] = (legendColor[1] + imageData[i * 4 + 1]) / 2;
        imageData[i * 4 + 2] = (legendColor[2] + imageData[i * 4 + 2]) / 2;
        imageData[i * 4 + 3] = (legendColor[3] + imageData[i * 4 + 3]) / 2;
    }

    // NEW START
// NEW START
// Рисуем контур черного цвета вокруг области волос
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
                        imageData[(index * 4)] = 0; // R
                        imageData[(index * 4) + 1] = 0; // G
                        imageData[(index * 4) + 2] = 0; // B
                        imageData[(index * 4) + 3] = 255; // A
                    }
                }
            }
        }
    }
}
// NEW END



    const uint8Array = new Uint8ClampedArray(imageData.buffer);
    const dataNew = new ImageData(uint8Array, width, height);
    cxt.putImageData(dataNew, 0, 0);
    const p = event.target.parentNode.getElementsByClassName("classification")[0];
    p.classList.remove("removed");
    p.innerText = "Category: " + category;
}