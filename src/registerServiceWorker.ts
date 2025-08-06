if ('serviceWorker' in navigator) {
  const basePath = '/';
navigator.serviceWorker.register(`${basePath}/sw.js`, { scope: `${basePath}/` });
}