import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  if (!isOpen) return null;
  const sizeClass = size === 'lg' ? 'modal-lg' : size === 'sm' ? 'modal-sm' : '';
  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-content ${sizeClass}`} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>,
    document.body
  );
}
