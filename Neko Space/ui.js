export function updateScore(val) {
    const el = document.getElementById('score');
    if (el) el.innerText = val;
}