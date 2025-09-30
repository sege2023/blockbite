import React, { createContext, useContext, useState } from "react";

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}

      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className="toast show">
            <span>{toast.message}</span>
            <button onClick={() => removeToast(toast.id)}>X</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
