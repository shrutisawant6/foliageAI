$(document).ready(function () {
    function previewImage(input, previewId) {
        if (input.files && input.files[0]) {
            let reader = new FileReader();
            reader.onload = function (e) {
                $(previewId).attr("src", e.target.result).show();
            };
            reader.readAsDataURL(input.files[0]);
        }
    }

    $("#nirImage").change(function () {
        previewImage(this, "#nirPreview");
    });

    $("#redImage").change(function () {
        previewImage(this, "#redPreview");
    });

    $("#processImages").click(function () {
        let nirFile = $("#nirImage")[0].files[0];
        let redFile = $("#redImage")[0].files[0];

        if (!nirFile || !redFile) {
            $("#output").text("Please select both images.");
            return;
        }

        let nirImg = new Image();
        let redImg = new Image();
        let loaded = 0;

        nirImg.onload = redImg.onload = function () {
            loaded++;
            if (loaded === 2) {
                if (nirImg.width !== redImg.width || nirImg.height !== redImg.height) {
                    $("#output").text("Images must have the same dimensions.");
                    return;
                }
                processNDVI(nirImg, redImg);
            }
        };

        nirImg.src = URL.createObjectURL(nirFile);
        redImg.src = URL.createObjectURL(redFile);
    });

    function processNDVI(nirImg, redImg) {
        let canvasNIR = document.createElement("canvas");
        let canvasRed = document.createElement("canvas");
        let ctxNIR = canvasNIR.getContext("2d");
        let ctxRed = canvasRed.getContext("2d");

        canvasNIR.width = canvasRed.width = nirImg.width;
        canvasNIR.height = canvasRed.height = nirImg.height;

        ctxNIR.drawImage(nirImg, 0, 0);
        ctxRed.drawImage(redImg, 0, 0);

        let nirData = ctxNIR.getImageData(0, 0, nirImg.width, nirImg.height).data;
        let redData = ctxRed.getImageData(0, 0, redImg.width, redImg.height).data;

        let totalNDVI = 0;
        let pixelCount = 0;

        for (let i = 0; i < nirData.length; i += 4) {
            let nir = nirData[i] / 255.0; // R channel for grayscale intensity
            let red = redData[i] / 255.0;

            let ndvi = calculateNDVI(nir, red);
            totalNDVI += ndvi;
            pixelCount++;
        }

        let avgNDVI = totalNDVI / pixelCount;

        //Average NDVI: ${avgNDVI.toFixed(4)}<br>
        $("#output").html(`* NDVI value: ${avgNDVI.toFixed(4)} <br>* Classification: ${classifyNDVI(avgNDVI)}`);
    }

    function calculateNDVI(nir, red) {
        if (nir + red === 0) return 0;
        return (nir - red) / (nir + red);
    }

    function classifyNDVI(ndvi) {
        if (ndvi < -0.1) return "Non-Vegetation (Water, Snow, or Clouds)"; //brown & white
        else if (ndvi < 0.2) return "Bare Soil or Sparse Vegetation"; //brown & light green
        else if (ndvi < 0.5) return "Moderate Vegetation"; //green
        else if (ndvi <= 1.0) return "Dense & Healthy Vegetation";//dark green
        return "Invalid NDVI Value";
    }
});