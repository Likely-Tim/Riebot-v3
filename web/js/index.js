let index = 0;
showSlides(index);

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