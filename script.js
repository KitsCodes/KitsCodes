const items = document.querySelectorAll('.cont-items');
let activeItem = null;

items.forEach(item => {
  item.addEventListener('click', function(e) {
    // If clicking the same item, toggle it off
    if (activeItem === this) {
      this.classList.remove('active');
      activeItem = null;
    } else {
      // Remove active class from all items
      items.forEach(i => i.classList.remove('active'));
      // Add active class to clicked item
      this.classList.add('active');
      activeItem = this;
    }
    e.stopPropagation();
  });
});

// Remove active state when clicking outside
document.addEventListener('click', function() {
  items.forEach(i => i.classList.remove('active'));
  activeItem = null;
});
