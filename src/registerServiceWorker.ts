if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/expensoo/sw.js', { scope: '/expensoo/' });
} 