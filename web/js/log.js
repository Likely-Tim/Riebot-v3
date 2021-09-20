sendGetRequest("/log_data")
.then(data => {
  generate_table(data);
});

async function sendGetRequest(url) {
  let response = await fetch(url, {
      method: 'GET'});
  return response.json();
}

function generate_table(data) {
  let lines = data.log;
  let table = document.createElement("TABLE"); 
  let header_labels = ["User", "Command", "Query"];
  for(let i = 0; i < lines.length; i++) {
    console.log(lines[i]);
    let array = lines[i].split(",");
    let row = table.insertRow();
    for(let j = 0; j < array.length; j++) {
      let cell = row.insertCell();
      let text = document.createTextNode(array[j]);
      cell.appendChild(text);
    }
  }
  let thead = table.createTHead();
  let row = thead.insertRow();
  for(let i = 0; i < header_labels.length; i++) {
    let th = document.createElement("th");
    let text = document.createTextNode(header_labels[i]);
    th.appendChild(text);
    row.appendChild(th);
  }
  let container = document.getElementById("container");
  container.appendChild(table);
}