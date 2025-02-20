import { describe, it, beforeEach, expect } from "vitest"

describe("Access Control Contract", () => {
  let mockStorage: Map<string, any>
  const CONTRACT_OWNER = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
  
  beforeEach(() => {
    mockStorage = new Map()
  })
  
  const mockContractCall = (method: string, args: any[], sender: string) => {
    switch (method) {
      case "grant-permission":
        const [grantDeviceId, grantUser, canRead, canWrite, canUpdate] = args
        if (sender !== CONTRACT_OWNER) {
          return { success: false, error: "ERR_NOT_AUTHORIZED" }
        }
        const grantKey = `${grantDeviceId}-${grantUser}`
        mockStorage.set(grantKey, { "can-read": canRead, "can-write": canWrite, "can-update": canUpdate })
        return { success: true }
      
      case "revoke-permission":
        const [revokeDeviceId, revokeUser] = args
        if (sender !== CONTRACT_OWNER) {
          return { success: false, error: "ERR_NOT_AUTHORIZED" }
        }
        const revokeKey = `${revokeDeviceId}-${revokeUser}`
        mockStorage.delete(revokeKey)
        return { success: true }
      
      case "check-permission":
      case "can-read":
      case "can-write":
      case "can-update":
        const [checkDeviceId, checkUser] = args
        const checkKey = `${checkDeviceId}-${checkUser}`
        const permissions = mockStorage.get(checkKey) || { "can-read": false, "can-write": false, "can-update": false }
        if (method === "check-permission") {
          return { success: true, value: permissions }
        } else {
          const permission = method.replace("can-", "")
          return { success: true, value: permissions[`can-${permission}`] }
        }
      
      default:
        return { success: false, error: "Unknown method" }
    }
  }
  
  it("should grant permission", () => {
    const result = mockContractCall("grant-permission", ["device1", "user1", true, false, false], CONTRACT_OWNER)
    expect(result.success).toBe(true)
  })
  
  it("should not grant permission if not contract owner", () => {
    const result = mockContractCall("grant-permission", ["device1", "user1", true, false, false], "user2")
    expect(result.success).toBe(false)
    expect(result.error).toBe("ERR_NOT_AUTHORIZED")
  })
  
  it("should revoke permission", () => {
    mockContractCall("grant-permission", ["device1", "user1", true, false, false], CONTRACT_OWNER)
    const result = mockContractCall("revoke-permission", ["device1", "user1"], CONTRACT_OWNER)
    expect(result.success).toBe(true)
  })
  
  it("should not revoke permission if not contract owner", () => {
    const result = mockContractCall("revoke-permission", ["device1", "user1"], "user2")
    expect(result.success).toBe(false)
    expect(result.error).toBe("ERR_NOT_AUTHORIZED")
  })
  
  it("should check permissions", () => {
    mockContractCall("grant-permission", ["device1", "user1", true, false, true], CONTRACT_OWNER)
    const result = mockContractCall("check-permission", ["device1", "user1"], "anyone")
    expect(result.success).toBe(true)
    expect(result.value).toEqual({ "can-read": true, "can-write": false, "can-update": true })
  })
  
  it("should check individual permissions", () => {
    mockContractCall("grant-permission", ["device1", "user1", true, false, true], CONTRACT_OWNER)
    
    const canRead = mockContractCall("can-read", ["device1", "user1"], "anyone")
    expect(canRead.success).toBe(true)
    expect(canRead.value).toBe(true)
    
    const canWrite = mockContractCall("can-write", ["device1", "user1"], "anyone")
    expect(canWrite.success).toBe(true)
    expect(canWrite.value).toBe(false)
    
    const canUpdate = mockContractCall("can-update", ["device1", "user1"], "anyone")
    expect(canUpdate.success).toBe(true)
    expect(canUpdate.value).toBe(true)
  })
})

