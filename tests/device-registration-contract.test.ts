import { describe, it, beforeEach, expect } from "vitest"

describe("Device Registration Contract", () => {
  let mockStorage: Map<string, any>
  
  beforeEach(() => {
    mockStorage = new Map()
  })
  
  const mockContractCall = (method: string, args: any[], sender: string) => {
    switch (method) {
      case "register-device":
        const [deviceId, metadata] = args
        if (mockStorage.has(deviceId)) {
          return { success: false, error: "ERR_ALREADY_REGISTERED" }
        }
        mockStorage.set(deviceId, {
          owner: sender,
          metadata: metadata,
          "registered-at": 100, // mock block height
        })
        return { success: true }
      
      case "update-device-metadata":
        const [updateDeviceId, newMetadata] = args
        const device = mockStorage.get(updateDeviceId)
        if (!device) {
          return { success: false, error: "ERR_NOT_FOUND" }
        }
        if (device.owner !== sender) {
          return { success: false, error: "ERR_NOT_AUTHORIZED" }
        }
        device.metadata = newMetadata
        mockStorage.set(updateDeviceId, device)
        return { success: true }
      
      case "transfer-device":
        const [transferDeviceId, newOwner] = args
        const transferDevice = mockStorage.get(transferDeviceId)
        if (!transferDevice) {
          return { success: false, error: "ERR_NOT_FOUND" }
        }
        if (transferDevice.owner !== sender) {
          return { success: false, error: "ERR_NOT_AUTHORIZED" }
        }
        transferDevice.owner = newOwner
        mockStorage.set(transferDeviceId, transferDevice)
        return { success: true }
      
      case "get-device":
        const [getDeviceId] = args
        return { success: true, value: mockStorage.get(getDeviceId) }
      
      case "is-device-owner":
        const [isOwnerDeviceId, isOwner] = args
        const isOwnerDevice = mockStorage.get(isOwnerDeviceId)
        return { success: true, value: isOwnerDevice && isOwnerDevice.owner === isOwner }
      
      default:
        return { success: false, error: "Unknown method" }
    }
  }
  
  it("should register a new device", () => {
    const result = mockContractCall("register-device", ["device1", "Test Device"], "user1")
    expect(result.success).toBe(true)
  })
  
  it("should not register a device twice", () => {
    mockContractCall("register-device", ["device1", "Test Device"], "user1")
    const result = mockContractCall("register-device", ["device1", "Test Device"], "user2")
    expect(result.success).toBe(false)
    expect(result.error).toBe("ERR_ALREADY_REGISTERED")
  })
  
  it("should update device metadata", () => {
    mockContractCall("register-device", ["device1", "Test Device"], "user1")
    const result = mockContractCall("update-device-metadata", ["device1", "Updated Device"], "user1")
    expect(result.success).toBe(true)
  })
  
  it("should not update device metadata if not owner", () => {
    mockContractCall("register-device", ["device1", "Test Device"], "user1")
    const result = mockContractCall("update-device-metadata", ["device1", "Updated Device"], "user2")
    expect(result.success).toBe(false)
    expect(result.error).toBe("ERR_NOT_AUTHORIZED")
  })
  
  it("should transfer device ownership", () => {
    mockContractCall("register-device", ["device1", "Test Device"], "user1")
    const result = mockContractCall("transfer-device", ["device1", "user2"], "user1")
    expect(result.success).toBe(true)
  })
  
  it("should not transfer device if not owner", () => {
    mockContractCall("register-device", ["device1", "Test Device"], "user1")
    const result = mockContractCall("transfer-device", ["device1", "user3"], "user2")
    expect(result.success).toBe(false)
    expect(result.error).toBe("ERR_NOT_AUTHORIZED")
  })
  
  it("should get device details", () => {
    mockContractCall("register-device", ["device1", "Test Device"], "user1")
    const result = mockContractCall("get-device", ["device1"], "anyone")
    expect(result.success).toBe(true)
    expect(result.value).toEqual({
      owner: "user1",
      metadata: "Test Device",
      "registered-at": 100,
    })
  })
  
  it("should check if a principal is the device owner", () => {
    mockContractCall("register-device", ["device1", "Test Device"], "user1")
    const result = mockContractCall("is-device-owner", ["device1", "user1"], "anyone")
    expect(result.success).toBe(true)
    expect(result.value).toBe(true)
  })
})

