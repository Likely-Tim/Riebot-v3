sendGetRequest("https://api64.ipify.org?format=json")
.then(data => {
  console.log(data);
});

let index = 0;
showSlides(index);

async function sendGetRequest(url) {
  let response = await fetch(url, {
      method: 'GET'});
  console.log(response);
  return response.json();
}

function showSlides() {
  let slides = document.getElementsByClassName('slide');
  for(let i = 0; i < slides.length; i++) {
    slides[i].style.display = 'none';
  }
  slides[index].style.display = "block";
  index++;
  if(slides.length == index) {
    index = 0;
  }
  setTimeout(showSlides, 3000);
}