// Carousel Navigation Logic
let currentIndex = 0;

function changeSlide(direction) {
  currentIndex = (currentIndex + direction + carouselImages.length) % carouselImages.length;
  const current = carouselImages[currentIndex];
  document.getElementById('carouselImage').src = current.src;
  document.getElementById('infoTitle').textContent = current.title;
  document.getElementById('infoDescription').textContent = current.description;
  document.getElementById('game').textContent = current.game;
}
