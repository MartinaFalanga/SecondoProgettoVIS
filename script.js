const rangeField = document.getElementById('rangeField');
const rangeValue = document.getElementById('rangeValue');

rangeField.addEventListener('input', function() {
  rangeValue.textContent = rangeField.value;
});