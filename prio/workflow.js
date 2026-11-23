const workflow = document.querySelector('[data-workflow]');
const controls = workflow.querySelector('.stage-controls');
const buttons = [...controls.querySelectorAll('button')];
const details = [...workflow.querySelectorAll('[data-stage-detail]')];

function showStage(index) {
  workflow.dataset.stage = index;
  buttons.forEach((button, stage) => {
    const active = index === stage;
    button.setAttribute('aria-pressed', String(active));
    details[stage].hidden = !active;
  });
}

buttons.forEach((button, index) => {
  button.addEventListener('click', () => showStage(index));
});
controls.hidden = false;
showStage(0);
