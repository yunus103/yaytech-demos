// Marks the page as a design preview inside the template's footer slot:
// <span data-yt-preview>Tasarım: YayTech Studio</span>. Without this script the slot keeps its normal credit.
(() => {
  const slot = document.querySelector("[data-yt-preview]");
  if (!slot) return;
  slot.innerHTML = 'Tasarım önizlemesi · <a href="https://yaytechstudio.com" target="_blank" rel="noopener">YayTech Studio</a>';
})();
