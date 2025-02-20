;; Device Registration Contract

;; Constants
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_NOT_AUTHORIZED (err u401))
(define-constant ERR_ALREADY_REGISTERED (err u409))
(define-constant ERR_NOT_FOUND (err u404))

;; Data Maps
(define-map devices
  { device-id: (buff 32) }
  {
    owner: principal,
    metadata: (string-utf8 256),
    registered-at: uint
  }
)

;; Public Functions
(define-public (register-device (device-id (buff 32)) (metadata (string-utf8 256)))
  (ok (map-set devices
    { device-id: device-id }
    {
      owner: tx-sender,
      metadata: metadata,
      registered-at: block-height
    }
  ))
)

(define-public (update-device-metadata (device-id (buff 32)) (new-metadata (string-utf8 256)))
  (let
    ((device (unwrap! (map-get? devices { device-id: device-id }) ERR_NOT_FOUND)))
    (asserts! (is-eq tx-sender (get owner device)) ERR_NOT_AUTHORIZED)
    (ok (map-set devices
      { device-id: device-id }
      (merge device { metadata: new-metadata })
    ))
  )
)

(define-public (transfer-device (device-id (buff 32)) (new-owner principal))
  (let
    ((device (unwrap! (map-get? devices { device-id: device-id }) ERR_NOT_FOUND)))
    (asserts! (is-eq tx-sender (get owner device)) ERR_NOT_AUTHORIZED)
    (ok (map-set devices
      { device-id: device-id }
      (merge device { owner: new-owner })
    ))
  )
)

;; Read-only Functions
(define-read-only (get-device (device-id (buff 32)))
  (map-get? devices { device-id: device-id })
)

(define-read-only (is-device-owner (device-id (buff 32)) (owner principal))
  (match (map-get? devices { device-id: device-id })
    device (is-eq (get owner device) owner)
    false
  )
)

