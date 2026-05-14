import { COLORS } from './constants.js';

export const showToast = (message, type = 'success') => {
  const bgColor = type === 'error' ? COLORS.red : 
                  type === 'warning' ? COLORS.gold : 
                  COLORS.green;
  
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.cssText = `position: fixed; top: 20px; right: 20px; background: ${bgColor}; color: white; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; z-index: 10000;`;
  
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
};
