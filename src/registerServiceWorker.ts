if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/expensoo-clean/sw.js', { scope: '/expensoo-clean/' });
} 