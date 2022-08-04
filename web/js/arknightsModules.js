document.getElementById('refreshButton').addEventListener("click", refresh);

render()

async function refresh() {
  let response = await sendGetRequest('/arknights/modules/refresh');
  console.log(response.operatorNames);
}

async function render() {
  let operators = await sendGetRequest('/arknights/modules/operators');
  let keys = Object.keys(operators).reverse();
  for (let i = 0; i < keys.length; i++) {
    let name = capitalizeFirstLetter(keys[i]);
    let checked = (operators[keys[i]][1] === "true");
    const input = document.createElement("input");
    input.setAttribute("type", "checkbox");
    input.setAttribute("id", keys[i]);
    input.checked = checked;
    input.addEventListener("change", checkboxChanged);
    const label = document.createElement("label");
    label.setAttribute("for", keys[i]);
    const labelText = document.createTextNode(name);
    label.appendChild(labelText);
    console.log(operators[keys[i]][0])
    const image = document.createElement("img");
    image.setAttribute("src", operators[keys[i]][0]);
    label.prepend(image);
    document.getElementById("operators").prepend(label);
    document.getElementById("operators").prepend(input);
  }
}

async function checkboxChanged() {
  let obj = {"id": this.id, "checked": this.checked};
  sendPostRequest("/arknights/modules/operators", JSON.stringify(obj));
}

async function sendGetRequest(url) {
  const response = await fetch(url, {method: 'GET'});
  return response.json();
}

async function sendPostRequest(url, body) {
  const response = await fetch(url, {
    "headers": {"Content-Type": "application/json"},
    "method": 'POST',
    "body": body
  });
}

function capitalizeFirstLetter(string) {
  let stringSplit = string.split("-");
  string = "";
  for (let i = 0; i < stringSplit.length; i++) {
    string += stringSplit[i].charAt(0).toUpperCase() + stringSplit[i].slice(1);
    if (i < stringSplit.length) {
      string += " ";
    }
  }
  return string;
}