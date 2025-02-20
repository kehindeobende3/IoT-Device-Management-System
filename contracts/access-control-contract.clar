;; Access Control Contract

;; Constants
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_NOT_AUTHORIZED (err u401))
(define-constant ERR_NOT_FOUND (err u404))

;; Data Maps
(define-map device-permissions
  { device-id: (buff 32), user: principal }
  { can-read: bool, can-write: bool, can-update: bool }
)

;; Public Functions
(define-public (grant-permission (device-id (buff 32)) (user principal) (can-read bool) (can-write bool) (can-update bool))
  (begin
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_NOT_AUTHORIZED)
    (ok (map-set device-permissions
      { device-id: device-id, user: user }
      { can-read: can-read, can-write: can-write, can-update: can-update }
    ))
  )
)

(define-public (revoke-permission (device-id (buff 32)) (user principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_NOT_AUTHORIZED)
    (ok (map-delete device-permissions { device-id: device-id, user: user }))
  )
)

;; Read-only Functions
(define-read-only (check-permission (device-id (buff 32)) (user principal))
  (default-to
    { can-read: false, can-write: false, can-update: false }
    (map-get? device-permissions { device-id: device-id, user: user })
  )
)

