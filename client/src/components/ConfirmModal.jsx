// client/src/components/ConfirmModal.jsx
import React from 'react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel' }) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="modal-backdrop fade show"></div>
      <div className="modal d-block" tabIndex="-1" role="dialog" style={{ display: isOpen ? 'block' : 'none' }}>
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content p-4 rounded shadow">
            <div className="modal-header border-0 pb-0">
              <h5 className="modal-title fw-bold text-text">{title}</h5>
              <button type="button" className="btn-close" aria-label="Close" onClick={onClose}></button>
            </div>
            <div className="modal-body text-secondary pt-0">
              <p>{message}</p>
            </div>
            <div className="modal-footer border-0 pt-0 d-flex justify-content-end">
              <button
                type="button"
                className="btn btn-outline-secondary rounded-pill me-2"
                onClick={onClose}
                aria-label={cancelText}
              >
                {cancelText}
              </button>
              <button
                type="button"
                className="btn btn-primary-custom rounded-pill"
                onClick={onConfirm}
                aria-label={confirmText}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ConfirmModal;