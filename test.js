const parent = document.querySelector('#myDiv');

const target = [...parent.querySelectorAll('[title="111"]')]
  .find(el => !el.closest('li'));
