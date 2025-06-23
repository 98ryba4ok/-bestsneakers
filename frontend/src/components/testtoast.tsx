// src/components/testtoast.tsx
import React from 'react';
import { useToast } from './toast/ToastProvider';

export default function ToastTest() {
  const { showToast } = useToast();

  return (
    <button
      onClick={() => showToast("Успешно!", "success")}
      className="p-2 m-4 bg-green-600 text-white rounded"
    >
      Показать тост
    </button>
  );
}
