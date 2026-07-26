import { execFile } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { promisify } from 'node:util'
import { expect, test } from '@playwright/test'

const execFileAsync = promisify(execFile)
const workspace = 'E:/code/Qoder'

test('real gateway long-tail workflows persist expected state', async () => {
  test.setTimeout(180_000)
  const env = {
    ...process.env,
    CODEX_EMPLOYEE_PASSWORD: process.env.E2E_EMPLOYEE_PASSWORD || '123',
    CODEX_APPROVER_PASSWORD: process.env.E2E_APPROVER_PASSWORD || '123',
    CODEX_ADMIN_PASSWORD: process.env.E2E_ADMIN_PASSWORD || 'admin'
  }
  await execFileAsync(process.execPath, ['codex/scripts/final_long_tail_e2e.mjs'], {
    cwd: workspace,
    env,
    timeout: 170_000,
    windowsHide: true
  })
  const result = JSON.parse(await readFile(
    `${workspace}/codex/test-results/final-long-tail-e2e.json`, 'utf8'
  ))

  expect(result.workOrderIds).toHaveLength(4)
  expect(result.approvalIds).toHaveLength(4)
  expect(result.transfer.verified).toBe(true)
  expect(result.snapshotIsolation.peerUnchanged).toBe(true)
  expect(result.snapshotIsolation.templateUnchanged).toBe(true)
  expect(result.rejectResubmit.approvalInstanceCount).toBe(2)
  expect(result.rejectResubmit.newVersion).toBeGreaterThan(result.rejectResubmit.oldVersion)
  expect(result.rejectResubmit.newApprovalId).not.toBe(result.rejectResubmit.oldApprovalId)
  expect(result.completed.status).toBe('COMPLETED')
  expect(result.messageRead).toBe(true)
  expect(result.statisticsFilter.returned).toBe(true)
  expect(result.statisticsFilter.excelBytes).toBeGreaterThan(100)
  expect(result.aiHotUpdate).toEqual({ changed: true, restored: true })
})
