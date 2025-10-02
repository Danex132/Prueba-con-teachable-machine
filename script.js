let model;
let labels = [];
let imageSize = 224;
let video = null;
let stream = null;
let intervalo = null;

async function cargarModelo() {
  model = await tf.loadLayersModel("modelo/model.json");
  const response = await fetch("modelo/metadata.json");
  const metadata = await response.json();
  labels = metadata.labels || [];
  imageSize = metadata.imageSize || 224;

  console.log("Modelo cargado ✅", labels);
}

async function predecirFrame() {
  if (!video) return;

  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = imageSize;
  canvas.height = imageSize;
  ctx.drawImage(video, 0, 0, imageSize, imageSize);

  let tensor = tf.browser.fromPixels(canvas)
    .toFloat()
    .div(tf.scalar(255.0))
    .expandDims();

  const pred = await model.predict(tensor).data();

  // Mostrar en tabla
  const tbody = document.querySelector("#resultados tbody");
  tbody.innerHTML = "";

  labels.forEach((label, i) => {
    const row = `<tr>
      <td>${label}</td>
      <td>${(pred[i] * 100).toFixed(2)}%</td>
    </tr>`;
    tbody.innerHTML += row;
  });
}

document.getElementById("startCam").addEventListener("click", async () => {
  video = document.getElementById("video");
  stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;

  // Predecir cada 500ms
  intervalo = setInterval(predecirFrame, 500);
});

document.getElementById("stopCam").addEventListener("click", () => {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    video.srcObject = null;
  }
  if (intervalo) clearInterval(intervalo);
});

cargarModelo();
