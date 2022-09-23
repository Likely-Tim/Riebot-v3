const {ChartJSNodeCanvas} = require("chartjs-node-canvas");
const fs = require("fs");
const path = require("path");
const {logger} = require("./logger");

const width = 1500;
const height = 600;
const backgroundColour = "#2e3035";
const chartJSNodeCanvas = new ChartJSNodeCanvas({width, height, backgroundColour});

async function generateLineChart(title, labels, data) {
  const configuration = {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
          fill: true,
          backgroundColor: "#255a7c",
          borderColor: "#3eb4f0",
        },
      ],
    },
    options: {
      scales: {
        yAxis: {
          grace: 5,
          display: true,
          ticks: {
            color: "white",
            padding: 10,
          },
        },
        xAxis: {
          display: true,
          ticks: {
            color: "white",
            padding: 8,
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        title: {
          display: true,
          text: title,
          color: "white",
        },
      },
    },
  };
  const buffer = await chartJSNodeCanvas.renderToBuffer(configuration);
  fs.writeFile(path.join(__dirname, "../media/animeShow.png"), buffer, "base64", callback);
}

function callback(err) {
  if (err) {
    logger.error(err);
  } else {
    logger.info("[Chart] Chart Created");
  }
}
module.exports.generateLineChart = generateLineChart;
