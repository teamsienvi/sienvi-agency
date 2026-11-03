import os
import time
from playwright.sync_api import sync_playwright

def get_admin_password():
    with open(".env.local", "r", encoding="utf-8") as f:
        for line in f:
            if line.startswith("ADMIN_PASSWORD="):
                return line.replace("ADMIN_PASSWORD=", "").strip()
    return ""

def capture_manage_services_modal():
    os.makedirs("screenshots/sprint4", exist_ok=True)
    admin_password = get_admin_password()
    base_url = "http://localhost:8080"
    target_client_id = "fab3c44c-2779-44fb-9e44-b64437f40885"

    with sync_playwright() as p:
        print(">>> [QA] Launching Chromium to QA Manage Services Modal...")
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        print(">>> [QA] Navigating to admin login...")
        page.goto(f"{base_url}/admin", wait_until="domcontentloaded", timeout=15000)
        page.wait_for_selector("#email", timeout=10000)

        # Login
        print(">>> [QA] Entering credentials...")
        page.fill('#email', "admin@sienvi.com")
        page.fill('#password', admin_password)
        page.click('button[type="submit"]')

        try:
            page.wait_for_url("**/admin/dashboard", timeout=15000)
            print(">>> [QA] Admin authentication successful.")
        except Exception:
            print(">>> [QA] Redirect wait warning, current URL:", page.url)

        time.sleep(2)

        # Enable Dark Mode to match user's screenshot exactly
        page.evaluate("() => document.documentElement.classList.add('dark')")
        time.sleep(0.5)

        # Navigate to Rick Anderson workspace (/admin/clients/:id?tab=services)
        print(f">>> [QA] Navigating to client workspace: /admin/clients/{target_client_id}?tab=services...")
        page.goto(f"{base_url}/admin/clients/{target_client_id}?tab=services", wait_until="networkidle", timeout=20000)
        time.sleep(2)

        # Re-ensure dark mode
        page.evaluate("() => document.documentElement.classList.add('dark')")
        time.sleep(0.5)

        # Click "+ Manage Services" button
        print(">>> [QA] Clicking 'Manage Services' button...")
        manage_services_btn = page.locator('button:has-text("Manage Services")').first
        manage_services_btn.wait_for(state="visible", timeout=15000)
        manage_services_btn.click()
        time.sleep(1.5)

        # Screenshot 1: Manage Services Modal in Dark Mode (Services & Deliverables Tab)
        page.screenshot(path="screenshots/sprint4/09_manage_services_modal_dark.png")
        print(">>> [CAPTURED] 09_manage_services_modal_dark.png")

        # Click Profile & Agreement tab
        print(">>> [QA] Clicking 'Profile & Agreement' tab...")
        profile_tab = page.locator('button[role="tab"]:has-text("Profile & Agreement")').first
        if profile_tab.is_visible():
            profile_tab.click()
            time.sleep(1)
            page.screenshot(path="screenshots/sprint4/10_manage_services_profile_tab_dark.png")
            print(">>> [CAPTURED] 10_manage_services_profile_tab_dark.png")

        # Click Subscriptions & Billing tab
        print(">>> [QA] Clicking 'Subscriptions & Billing' tab...")
        billing_tab = page.locator('button[role="tab"]:has-text("Subscriptions & Billing")').first
        if billing_tab.is_visible():
            billing_tab.click()
            time.sleep(1)
            page.screenshot(path="screenshots/sprint4/11_manage_services_billing_tab_dark.png")
            print(">>> [CAPTURED] 11_manage_services_billing_tab_dark.png")

        # Switch back to Services tab and Light Mode
        print(">>> [QA] Switching back to Services tab in Light Mode...")
        services_tab = page.locator('button[role="tab"]:has-text("Services & Deliverables")').first
        if services_tab.is_visible():
            services_tab.click()
            time.sleep(0.5)

        page.evaluate("() => document.documentElement.classList.remove('dark')")
        time.sleep(1)
        page.screenshot(path="screenshots/sprint4/12_manage_services_modal_light.png")
        print(">>> [CAPTURED] 12_manage_services_modal_light.png")

        browser.close()
        print(">>> [QA] Manage Services Modal QA complete.")

if __name__ == "__main__":
    capture_manage_services_modal()
