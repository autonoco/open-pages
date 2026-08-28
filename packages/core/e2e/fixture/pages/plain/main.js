let n = 0;
const button = document.getElementById('count');
button.addEventListener('click', () => {
  n += 1;
  button.textContent = `Clicked ${n} time${n === 1 ? '' : 's'}`;
});
