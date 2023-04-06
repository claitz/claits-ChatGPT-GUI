import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleXmark } from '@fortawesome/free-solid-svg-icons';
const Modal = ({ isOpen, onClose = () => {}, children }) => {
    if (!isOpen) {
        return null;
    }

    return (
        <div className="modal">
            <div className="modal-overlay" onClick={onClose} />
            <div className="modal-content">
                <button className="modal-close" onClick={onClose}>
                    <FontAwesomeIcon icon={faCircleXmark} />
                </button>
                {children}
            </div>
        </div>
    );
};

export default Modal;
