import { describe, expect, it } from 'vitest'
import {
  ORDER_STATUS,
  APPROVE_ACTION,
  formatConfidence,
  resolveEnum,
  safeText
} from './constants'

describe('business enum contract', () => {
  it('contains all SRS work-order states', () => {
    expect(Object.keys(ORDER_STATUS)).toEqual(expect.arrayContaining([
      'PENDING_AI',
      'PENDING_APPROVE',
      'APPROVING',
      'APPROVED',
      'REJECTED',
      'COMPLETED'
    ]))
  })

  it('uses the backend approval action codes', () => {
    expect(APPROVE_ACTION).toMatchObject({
      APPROVE: '通过',
      REJECT: '驳回',
      TRANSFER: '转交',
      ADD_NODE: '加签',
      REMOVE_NODE: '减签'
    })
  })

  it('formats unknown and empty values safely', () => {
    expect(resolveEnum(ORDER_STATUS, 'NOT_A_STATE')).toBe('未知状态')
    expect(safeText(null)).toBe('—')
    expect(formatConfidence(0.856)).toBe('86%')
  })
})
