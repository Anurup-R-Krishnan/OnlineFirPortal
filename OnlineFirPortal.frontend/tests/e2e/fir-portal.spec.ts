import { test, expect } from '@playwright/test';

test.describe('FIR Portal E2E Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:4000');
    });

    test.describe('Authentication Flow', () => {
        test('should complete full registration flow with MFA', async ({ page }) => {
            // Navigate to registration
            await page.click('text=Register');

            // Fill registration form
            await page.fill('input[name="name"]', 'E2E Test User');
            await page.fill('input[name="email"]', `e2e-${Date.now()}@test.com`);
            await page.fill('input[name="mobile"]', '9876543210');
            await page.fill('input[name="aadhaar"]', '123456789012');
            await page.fill('input[name="password"]', 'Test@1234');
            await page.fill('input[name="confirmPassword"]', 'Test@1234');

            await page.click('button:has-text("Next")');

            // Aadhaar verification
            await page.click('button:has-text("Send OTP")');
            await page.fill('input[name="otp"]', '123456');
            await page.click('button:has-text("Verify")');

            // MFA setup
            await expect(page.locator('text=Setup Google Authenticator')).toBeVisible();

            // QR code should be visible
            await expect(page.locator('img[alt="MFA QR Code"]')).toBeVisible();

            // Enter TOTP (in real test, you'd generate this)
            await page.fill('input[name="totp"]', '123456');
            await page.click('button:has-text("Verify & Create Account")');

            // Should show recovery codes
            await expect(page.locator('text=Save Your Recovery Codes')).toBeVisible();

            // Complete registration
            await page.click('button:has-text("Continue to Login")');

            // Should redirect to login
            await expect(page).toHaveURL(/.*auth/);
        });

        test('should login with MFA', async ({ page }) => {
            await page.click('text=Login');

            await page.fill('input[name="email"]', 'test@example.com');
            await page.fill('input[name="password"]', 'Test@1234');
            await page.click('button:has-text("Login")');

            // MFA challenge
            await expect(page.locator('text=Enter Authentication Code')).toBeVisible();
            await page.fill('input[name="totp"]', '123456');
            await page.click('button:has-text("Verify")');

            // Should redirect to dashboard
            await expect(page).toHaveURL(/.*dashboard/);
        });
    });

    test.describe('FIR Filing Flow', () => {
        test.beforeEach(async ({ page }) => {
            // Login first
            await page.goto('http://localhost:4000/auth');
            // ... complete login flow
        });

        test('should file a complete FIR with digital signature', async ({ page }) => {
            await page.goto('http://localhost:4000/file-fir');

            // Step 1: Personal Details
            await page.fill('input[name="fullName"]', 'Test Complainant');
            await page.fill('input[name="mobile"]', '9876543210');
            await page.fill('input[name="email"]', 'complainant@test.com');
            await page.click('button:has-text("Next")');

            // Step 2: Incident Details
            await page.selectOption('select[name="complaintType"]', 'Theft / Robbery');
            await page.fill('input[name="incidentDate"]', '2024-01-15');
            await page.fill('input[name="incidentTime"]', '14:30');
            await page.fill('textarea[name="description"]', 'My mobile phone was stolen from my bag');
            await page.click('button:has-text("Next")');

            // Step 3: Location
            await page.selectOption('select[name="state"]', 'Karnataka');
            await page.fill('input[name="district"]', 'Bangalore Urban');
            await page.fill('input[name="incidentPlace"]', 'MG Road');
            await page.click('button:has-text("Next")');

            // Step 4: Evidence (skip for now)
            await page.click('button:has-text("Next")');

            // Step 5: Review & Submit
            await expect(page.locator('text=Review Your FIR')).toBeVisible();

            // Should show digital signature status
            await expect(page.locator('text=Digitally Signed')).toBeVisible();

            await page.click('button:has-text("Submit FIR")');

            // Should show success
            await expect(page.locator('text=FIR Submitted Successfully')).toBeVisible();
            await expect(page.locator('text=FIR-')).toBeVisible(); // Reference number
        });
    });

    test.describe('Dashboard', () => {
        test('should display citizen dashboard with stats', async ({ page }) => {
            // Login and navigate to dashboard
            await page.goto('http://localhost:4000/dashboard');

            // Should show stats
            await expect(page.locator('text=My FIRs')).toBeVisible();
            await expect(page.locator('text=Pending')).toBeVisible();
            await expect(page.locator('text=Under Investigation')).toBeVisible();
        });

        test('should display officer dashboard with assigned FIRs', async ({ page }) => {
            // Login as officer
            // ... officer login flow

            await page.goto('http://localhost:4000/dashboard/police');

            await expect(page.locator('text=Assigned FIRs')).toBeVisible();
            await expect(page.locator('text=Total Cases')).toBeVisible();
        });
    });

    test.describe('Admin Panel', () => {
        test('should create new officer account', async ({ page }) => {
            // Login as admin
            // ... admin login flow

            await page.goto('http://localhost:4000/dashboard/admin/users');

            await page.click('button:has-text("Create Officer")');

            await page.fill('input[name="name"]', 'New Officer');
            await page.fill('input[name="email"]', `officer-${Date.now()}@police.gov.in`);
            await page.fill('input[name="badgeNumber"]', 'OFF12345');
            await page.fill('input[name="policeStation"]', 'MG Road Police Station');

            await page.click('button:has-text("Create")');

            await expect(page.locator('text=Officer created successfully')).toBeVisible();
        });
    });
});
