import { useId } from 'react'
import Modal from 'react-bootstrap/Modal'

// Lock dismissal while the caller's operation is pending to avoid duplicate changes.
export default function ConfirmModal({ show, title, message, onCancel, onConfirm, loading = false }) {
  const id = useId()
  return <Modal show={show} onHide={loading ? undefined : onCancel} centered
    backdrop={loading ? 'static' : true} keyboard={!loading} aria-labelledby={id} aria-describedby={id + '-message'}>
    <Modal.Header><Modal.Title as="h2" id={id}>{title}</Modal.Title></Modal.Header>
    <Modal.Body id={id + '-message'}>{message}</Modal.Body>
    <Modal.Footer>
      <button type="button" autoFocus disabled={loading} className="btn btn-outline-primary" onClick={onCancel}>Cancel</button>
      <button type="button" disabled={loading} aria-busy={loading} className="btn btn-danger" onClick={onConfirm}>
        {loading ? 'Confirming…' : 'Confirm'}
      </button>
    </Modal.Footer>
  </Modal>
}
