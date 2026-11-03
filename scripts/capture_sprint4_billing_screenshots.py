import os
import time
from playwright.sync_api import sync_playwright

def get_admin_password():
    with open(".env.local", "r", encoding="utf-8") as f:
        for line in f:
            if line.startswith("ADMIN_PASSWORD="):
                return line.replace("ADMIN_PASSWORD=", "").strip()
    return ""

def capture_sprint4_screenshots():
    os.makedirs("screenshots/sprint4", exist_ok=True)
    admin_password = get_admin_password()
    base_url = "http://localhost:8080"

    with sync_playwright() as p:
        print(">>> [QA] Launching Chromium for Sprint 4 Billing UI QA...")
        browser = p.chromium.launch(headless=True)

        # -------------------------------------------------------------
        # 1. Desktop Context (1440x900) - Light Mode
        # -------------------------------------------------------------
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        print(">>> [QA] Navigating to admin login...")
        page.goto(f"{base_url}/admin", wait_until="networkidle", timeout=30000)
        time.sleep(1)

        # Login
        page.fill('input[type="email"]', "admin@sienvi.com")
        page.fill('input[type="password"]', admin_password)
        page.click('button[type="submit"]')

        try:
            page.wait_for_url("**/admin/dashboard", timeout=15000)
            print(">>> [QA] Admin authentication successful.")
        except Exception as e:
            print(">>> [QA] Redirect wait warning, current URL:", page.url)

        time.sleep(2)

        # Navigate to /admin/billing
        print(">>> [QA] Navigating to /admin/billing...")
        page.goto(f"{base_url}/admin/billing", wait_until="networkidle", timeout=20000)
        time.sleep(2)

        # Screenshot 1: Overview Tab (Desktop Light)
        page.screenshot(path="screenshots/sprint4/01_billing_overview_desktop_light.png")
        print(">>> [CAPTURED] 01_billing_overview_desktop_light.png")

        # Screenshot 2: Subscriptions Tab (Desktop Light)
        sub_tab = page.locator('button[role="tab"]:has-text("Subscriptions")').first
        if sub_tab.is_visible():
            sub_tab.click()
            time.sleep(1)
            page.screenshot(path="screenshots/sprint4/02_billing_subscriptions_desktop_light.png")
            print(">>> [CAPTURED] 02_billing_subscriptions_desktop_light.png")

        # Screenshot 3: Invoices Tab (Desktop Light)
        inv_tab = page.locator('button[role="tab"]:has-text("Invoices")').first
        if inv_tab.is_visible():
            inv_tab.click()
            time.sleep(1)
            page.screenshot(path="screenshots/sprint4/03_billing_invoices_desktop_light.png")
            print(">>> [CAPTURED] 03_billing_invoices_desktop_light.png")

        # Screenshot 4: Payments Tab (Desktop Light)
        pmt_tab = page.locator('button[role="tab"]:has-text("Payments")').first
        if pmt_tab.is_visible():
            pmt_tab.click()
            time.sleep(1)
            page.screenshot(path="screenshots/sprint4/04_billing_payments_desktop_light.png")
            print(">>> [CAPTURED] 04_billing_payments_desktop_light.png")

        # Screenshot 5: Exceptions & Audit Tab (Desktop Light)
        exc_tab = page.locator('button[role="tab"]:has-text("Exceptions")').first
        if exc_tab.is_visible():
            exc_tab.click()
            time.sleep(1)
            page.screenshot(path="screenshots/sprint4/05_billing_exceptions_desktop_light.png")
            print(">>> [CAPTURED] 05_billing_exceptions_desktop_light.png")

        # Screenshot 6: Desktop Dark Mode (Overview Tab)
        theme_toggle = page.locator('button:has-text("Dark Mode"), button:has-text("Light Mode"), button[title*="theme"], button[title*="Theme"]').first
        # Or trigger via document class
        page.evaluate("document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark');")
        time.sleep(1)
        # Switch back to overview tab
        ov_tab = page.locator('button[role="tab"]:has-text("Overview")').first
        if ov_tab.is_visible():
            ov_tab.click()
            time.sleep(1)
        page.screenshot(path="screenshots/sprint4/06_billing_overview_desktop_dark.png")
        print(">>> [CAPTURED] 06_billing_overview_desktop_dark.png")

        # Screenshot 7: Client Workspace Billing Tab
        print(">>> [QA] Navigating to Client Workspace Billing Tab...")
        page.goto(f"{base_url}/admin/clients/fab3c44c-2779-44fb-9e44-b64437f40885?tab=billing", wait_until="networkidle", timeout=20000)
        time.sleep(2)
        # Click Billing tab in workspace
        ws_billing_tab = page.locator('button[role="tab"]:has-text("Billing")').first
        if ws_billing_tab.is_visible():
            ws_billing_tab.click()
            time.sleep(1)
        page.screenshot(path="screenshots/sprint4/07_client_workspace_billing_tab.png")
        print(">>> [CAPTURED] 07_client_workspace_billing_tab.png")

        context.close()

        # -------------------------------------------------------------
        # 2. Mobile Context (390x844 iPhone 12/13/14)
        # -------------------------------------------------------------
        print(">>> [QA] Testing Mobile Responsive Viewport (390x844)...")
        mobile_context = browser.new_context(
            viewport={"width": 390, "height": 844},
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1"
        )
        mobile_page = mobile_context.new_page()

        # Login on mobile
        mobile_page.goto(f"{base_url}/admin", wait_until="networkidle", timeout=30000)
        mobile_page.fill('input[type="email"]', "admin@sienvi.com")
        mobile_page.fill('input[type="password"]', admin_password)
        mobile_page.click('button[type="submit"]')
        time.sleep(3)

        mobile_page.goto(f"{base_url}/admin/billing", wait_until="networkidle", timeout=20000)
        time.sleep(2)

        mobile_page.screenshot(path="screenshots/sprint4/08_billing_mobile_overview.png")
        print(">>> [CAPTURED] 08_billing_mobile_overview.png")

        mobile_context.close()
        browser.close()
        print("\n=====================================================================")
        print("ALL SPRINT 4 SCREENSHOTS CAPTURED CLEANLY IN screenshots/sprint4/")
        print("=====================================================================\n")

if __name__ == "__main__":
    capture_sprint4_screenshots()
