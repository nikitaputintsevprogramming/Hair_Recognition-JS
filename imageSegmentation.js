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

// contourWidthBlurValueInHair и contourWidthBlurEdges - ?
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
            if (mask[y * width + x] !== segmentValue) {
                let isEdgePixel = false;
                // let contourWidthBlurValueInHair = 20;
                // Проверка соседних пикселей на принадлежность к области волос
                for (let dw = -contourWidthBlurValueInHair; dw <= contourWidthBlurValueInHair; dw++) { // ширина 20 хорошо для contourWidth
                    for (let dh = -contourWidthBlurValueInHair; dh <= contourWidthBlurValueInHair; dh++) { // высота 20 хорошо для contourWidth
                        const nx = x + dw;
                        const ny = y + dh;
                        if (nx >= 0 && nx < width && ny >= 0 && ny < height && (mask[ny * width + nx] === segmentValue)) {
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
            if (mask[y * width + x] !== segmentValue) {
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

    const showBackground = document.getElementById("showBackground").checked;
    const showHair = document.getElementById("showHair").checked;
    const showBodySkin = document.getElementById("showBodySkin").checked;
    const showFaceSkin = document.getElementById("showFaceSkin").checked;
    const showClothes = document.getElementById("showClothes").checked;
    const showOthers = document.getElementById("showOthers").checked;

    // NEW END

    // for (let i in mask) {
    //     if (mask[i] > 0) {
    //         category = labels[mask[i]];
    //     }
    //     const legendColor = legendColors[mask[i] % legendColors.length];

    // Получаем значения цвета и прозрачности из элементов выбора
    const contourColor = hexToRgb(contourColorInput.value);
    const hairColor = hexToRgb(hairColorInput.value);
    const contourOpacity = parseFloat(contourOpacityInput.value);
    const hairOpacity = parseFloat(hairOpacityInput.value);

    for (let i in mask) {
        if (mask[i] > 0) {
            category = labels[mask[i]];
        }
        const segment = mask[i];
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
        const legendColor = legendColors[segment % legendColors.length];
        imageData[i * 4] = (legendColor[0] + imageData[i * 4]) / 2;
        imageData[i * 4 + 1] = (legendColor[1] + imageData[i * 4 + 1]) / 2;
        imageData[i * 4 + 2] = (legendColor[2] + imageData[i * 4 + 2]) / 2;
        imageData[i * 4 + 3] = (legendColor[3] + imageData[i * 4 + 3]) / 2;
    }

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
              const updatedImageData = new ImageData(new Uint8ClampedArray(imageData), width, height);
              cxt.putImageData(updatedImageData, 0, 0);

    // Добавляем цвет для волос с учетом прозрачности
    for (let i = 0; i < mask.length; i++) {
        if (mask[i] === 1) { // Область волос
            const index = i * 4;

            // Получаем исходный цвет волос
            const originalR = imageData[index];     // Исходный красный
            const originalG = imageData[index + 1]; // Исходный зеленый
            const originalB = imageData[index + 2]; // Исходный синий
            const originalA = imageData[index + 3]; // Исходная альфа

            // Смешиваем новый цвет с исходным цветом с учетом прозрачности
            imageData[index] = (hairColor.r * hairOpacity + originalR * (1 - hairOpacity)); // R
            imageData[index + 1] = (hairColor.g * hairOpacity + originalG * (1 - hairOpacity)); // G
            imageData[index + 2] = (hairColor.b * hairOpacity + originalB * (1 - hairOpacity)); // B
            imageData[index + 3] = Math.max(0, Math.min(255, originalA * (1 - hairOpacity) + (255 * hairOpacity))); // A
        }
    }
    const blurIntensity = blurIntense;
    console.log("blurIntensity: ", blurIntensity);
    // Применяем размытие на области волос
    const blurredImageData = applyBlur(imageData, width, height, mask, 1, blurIntense, blurWidthListen); // stock
    // const blurredImageData = applyBlur(imageData, width, height, mask, 1, blurIntensity, blurWidthListen);
    // imageData, width, height, mask, segmentValue, sigmaKoef, contourWidthBlurEdges, contourWidthBlurValueInHair)
    const uint8Array = new Uint8ClampedArray(blurredImageData.buffer);
    const dataNew = new ImageData(uint8Array, width, height);
    cxt.putImageData(dataNew, 0, 0);
}



