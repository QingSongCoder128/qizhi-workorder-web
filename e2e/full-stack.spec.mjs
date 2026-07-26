import { expect, test } from '@playwright/test'

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
  await expect(page.locator('#app')).not.toContainText('加载中')
}

test('three real roles load live data and enforce route permissions', async ({ browser }) => {
  const scenarios = [
    { role: 'employee', account: accounts.employee, path: '/workorder/my', selector: '.el-table' },
    { role: 'approver', account: accounts.approver, path: '/approve/pending', selector: '.el-table' },
    { role: 'admin', account: accounts.admin, path: '/system/user', selector: '.el-table' }
  ]
  for (const scenario of scenarios) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await context.newPage()
    const businessResponses = []
    page.on('response', response => {
      if (response.url().includes('/api/v1/')) businessResponses.push(response)
    })
    await login(page, scenario.account)
    await page.goto(scenario.path)
    await expect(page.locator(scenario.selector)).toBeVisible()
    await expect.poll(() => businessResponses.some(response =>
      response.status() === 200 && !response.url().includes('/auth/'))).toBeTruthy()
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    )
    expect(overflow).toBeFalsy()

    if (scenario.role !== 'admin') {
      await page.goto('/system/user')
      await expect(page).toHaveURL(/\/403$/)
    }
    await context.close()
  }
})

test('login keyboard focus and 403/404/network recovery states are usable', async ({ page }) => {
  await page.goto('/login')
  const username = page.getByPlaceholder('请输入账号')
  await expect(username).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.getByPlaceholder('请输入密码')).toBeFocused()

  for (const path of ['/403', '/not-a-real-route', '/network-error']) {
    await page.goto(path)
    await expect(page.locator('#app')).toBeVisible()
    await expect(page.locator('body')).not.toContainText('加载中')
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    )
    expect(overflow).toBeFalsy()
  }
})

test('enterprise pages remain stable at the three required viewports', async ({ browser }) => {
  for (const viewport of [
    { width: 1366, height: 768 },
    { width: 1440, height: 900 },
    { width: 1920, height: 1080 }
  ]) {
    const context = await browser.newContext({ viewport })
    const page = await context.newPage()
    await login(page, accounts.admin)
    for (const path of ['/dashboard', '/system/ai-config', '/system/rate-limit']) {
      await page.goto(path)
      await expect(page.locator('#app')).toBeVisible()
      await expect(page.locator('body')).not.toContainText('加载中')
      expect(await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth
      )).toBeTruthy()
    }
    await context.close()
  }
})
