import * as lib from '../dist/index.js';

mocha.setup('bdd');

document.querySelector('#test-run').addEventListener('click', () => {
    window.sac = { ...window.sac, ...lib };
    mocha.run();
});

document.querySelector('#test-page').addEventListener('click', () => {
    const el = document.getElementById('mocha');
    const zIndex = el.style.zIndex;
    el.style.zIndex = Number(zIndex) ? 0 : 1;
});

await lib.CoreLoader();
