;; Firmware Update Contract

;; Constants
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_NOT_AUTHORIZED (err u401))
(define-constant ERR_NOT_FOUND (err u404))
(define-constant ERR_ALREADY_EXISTS (err u409))

;; Data Maps
(define-map firmware-versions
  { device-type: (string-ascii 64), version: (string-ascii 32) }
  {
    hash: (buff 32),
    url: (string-utf8 256),
    release-notes: (string-utf8 1024),
    released-by: principal,
    released-at: uint
  }
)

(define-map device-firmware
  { device-id: (buff 32) }
  { current-version: (string-ascii 32) }
)

;; Public Functions
(define-public (release-firmware (device-type (string-ascii 64)) (version (string-ascii 32)) (hash (buff 32)) (url (string-utf8 256)) (release-notes (string-utf8 1024)))
  (let
    ((existing-version (map-get? firmware-versions { device-type: device-type, version: version })))
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_NOT_AUTHORIZED)
    (asserts! (is-none existing-version) ERR_ALREADY_EXISTS)
    (ok (map-set firmware-versions
      { device-type: device-type, version: version }
      {
        hash: hash,
        url: url,
        release-notes: release-notes,
        released-by: tx-sender,
        released-at: block-height
      }
    ))
  )
)

(define-public (update-device-firmware (device-id (buff 32)) (new-version (string-ascii 32)))
  (let
    ((device-fw (default-to { current-version: "" } (map-get? device-firmware { device-id: device-id }))))
    (ok (map-set device-firmware
      { device-id: device-id }
      { current-version: new-version }
    ))
  )
)

;; Read-only Functions
(define-read-only (get-firmware-info (device-type (string-ascii 64)) (version (string-ascii 32)))
  (map-get? firmware-versions { device-type: device-type, version: version })
)

(define-read-only (get-device-firmware-version (device-id (buff 32)))
  (get current-version (default-to { current-version: "" } (map-get? device-firmware { device-id: device-id })))
)

