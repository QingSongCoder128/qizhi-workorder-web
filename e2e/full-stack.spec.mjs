import { expect, test } from '@playwright/test'
import { resolve } from 'path'

const screenshotRoot = resolve(import.meta.dirname, '../../codex/screenshots')

const accounts = {
  admin: {
    username: process.env.E2E_ADMIN_USERNAME || 'admin',
    password: process.env.E2E_ADMIN_PASSWORD || 'admin'
  },
  employee: {
    username: process.env.E2E_EMPLOYEE_USERNAME || '张伟',
    password: process.env.E2E_EMPLOYEE_PASSWORD || '123'
  },
  approver: {
    username: process.env.E2E_APPROVER_USERNAME || '王强',
    password: process.env.E2E_APPROVER_PASSWORD || '123'
  }
}

async function login(page, account) {
  await page.goto('/login')
  await page.getByPlaceholder('请输入账号').fill(account.username)
  await page.getByPlaceholder('请输入密码').fill(account.password)
  await page.getByRole('button', { name: /登\s*录/ }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(500)
}

test('三浏览器登录、工作台与键盘焦点', async ({ page }, testInfo) => {
  const browser = testInfo.project.name
  const consoleErrors = []
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })

  await page.goto('/login')
  const username = page.getByPlaceholder('请输入账号')
  await expect(username).toBeVisible()
  await username.focus()
  await expect(username).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.getByPlaceholder('请输入密码')).toBeFocused()
  await page.screenshot({
    path: resolve(screenshotRoot, `${browser}-login-1440x900.png`),
    fullPage: true
  })

  await login(page, accounts.admin)
  await expect(page.locator('#app')).toContainText('工作台')
  await page.screenshot({
    path: resolve(screenshotRoot, `${browser}-admin-dashboard-1440x900.png`),
    fullPage: true
  })

  const horizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  )
  expect(horizontalOverflow).toBeFalsy()
  expect(consoleErrors).toEqual([])
})

test('Chrome 三类角色真实路由与权限入口', async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'chrome')

  for (const [role, account] of Object.entries(accounts)) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await context.newPage()
    await login(page, account)

    if (role === 'employee') {
      await page.goto('/workorder/create')
      await expect(page).toHaveURL(/\/workorder\/create$/)
      await expect(page.locator('#app')).toContainText('工单')
      await expect(page.locator('.el-form')).toBeVisible()
    } else if (role === 'approver') {
      await page.goto('/approve/pending')
      await expect(page).toHaveURL(/\/approve\/pending$/)
      await expect(page.locator('#app')).toContainText('审批')
      await expect(page.locator('.el-table__row').first()).toBeVisible()
    } else {
      await page.goto('/system/user')
      await expect(page).toHaveURL(/\/system\/user$/)
      await expect(page.locator('#app')).toContainText('用户')
      await expect(page.locator('.el-table__row').first()).toBeVisible()
    }
    await page.waitForLoadState('networkidle')

    await page.screenshot({
      path: resolve(screenshotRoot, `chrome-${role}-route.png`),
      fullPage: true
    })
    await context.close()
  }
})

test('Chrome 规定分辨率无横向溢出', async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'chrome')

  for (const viewport of [
    { width: 1366, height: 768 },
    { width: 1440, height: 900 },
    { width: 1920, height: 1080 }
  ]) {
    const context = await browser.newContext({ viewport })
    const page = await context.newPage()
    await login(page, accounts.employee)
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    )
    expect(overflow).toBeFalsy()
    await page.screenshot({
      path: resolve(screenshotRoot,
        `chrome-employee-dashboard-${viewport.width}x${viewport.height}.png`),
      fullPage: true
    })
    await context.close()
  }
})

test('网络异常恢复页可访问且有明确操作', async ({ page }) => {
  await page.goto('/network-error')
  await expect(page.locator('#app')).toContainText('网络')
  await expect(page.getByRole('button')).toHaveCount(2)
})
