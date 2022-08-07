sendGetRequest("/log_data").then((data) => {
  generateTable(data);
});

async function sendGetRequest(url) {
  const response = await fetch(url, { method: "GET" });
  return response.json();
}

function generateTable(data) {
  const lines = data.log;
  const table = document.createElement("TABLE");
  const headerLabels = ["User", "Command", "Query"];
  for (let i = 0; i < lines.length; i++) {
    console.log(lines[i]);
    const array = lines[i].split(",");
    const row = table.insertRow();
    for (let j = 0; j < array.length; j++) {
      const cell = row.insertCell();
      const text = document.createTextNode(array[j]);
      cell.appendChild(text);
    }
  }
  const thead = table.createTHead();
  const row = thead.insertRow();
  for (let i = 0; i < headerLabels.length; i++) {
    const th = document.createElement("th");
    const text = document.createTextNode(headerLabels[i]);
    th.appendChild(text);
    row.appendChild(th);
  }
  const container = document.getElementById("container");
  container.appendChild(table);
}
