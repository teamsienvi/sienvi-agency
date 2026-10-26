import os
import sys
import time
import shutil
from playwright.sync_api import sync_playwright

LOCAL_DIR = "screenshots/client_workspace"
BRAIN_DIR = r"C:\Users\Iris\.gemini\antigravity-ide\brain\b7ff94f6-2cce-405e-b83c-3ef9e5d0f2e8\screenshots\client_workspace"

os.makedirs(LOCAL_DIR, exist_ok=True)
os.makedirs(BRAIN_DIR, exist_ok=True)

def log(msg):
    print(msg, flush=True)

def save_screenshot(page, filename, full_page=True):
    local_path = os.path.join(LOCAL_DIR, filename)
    brain_path = os.path.join(BRAIN_DIR, filename)
    page.screenshot(path=local_path, full_page=full_page)
    shutil.copyfile(local_path, brain_path)
    log(f"Captured: {local_path} -> {brain_path}")

def set_dark(page):
    page.evaluate("() => { document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); window.dispatchEvent(new CustomEvent('sienvi-theme-change', { detail: 'dark' })); }")
    time.sleep(0.5)

def set_light(page):
    page.evaluate("() => { document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); window.dispatchEvent(new CustomEvent('sienvi-theme-change', { detail: 'light' })); }")
    time.sleep(0.5)

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        log("1. Navigating to login page...")
        page.goto("http://localhost:5173/admin")
        page.wait_for_selector('input[type="email"]', timeout=20000)

        log("2. Logging in as admin...")
        page.fill('input[type="email"]', "admin@sienvi.com")
        page.fill('input[type="password"]', "SienviAdmin2024!")
        page.click('button[type="submit"]')

        log("3. Waiting for dashboard...")
        page.wait_for_url("**/admin/dashboard", timeout=30000)
        time.sleep(2)

        # 4. Navigate to /admin/clients
        log("4. Navigating to /admin/clients...")
        page.click('a[href="/admin/clients"]')
        page.wait_for_url("**/admin/clients", timeout=15000)
        page.wait_for_selector("text=Client Directory", timeout=15000)
        time.sleep(2)
        set_dark(page)
        save_screenshot(page, "1_clients_directory_table_dark.png")

        # 5. Open legacy modal fallback (clicking Eye button on first client)
        log("5. Testing legacy modal fallback...")
        eye_buttons = page.query_selector_all('button[title*="Modal Fallback"]')
        if eye_buttons:
            eye_buttons[0].click()
            page.wait_for_selector('div[role="dialog"]', timeout=10000)
            time.sleep(1)
            save_screenshot(page, "2_legacy_modal_fallback_dark.png")
            page.keyboard.press("Escape")
            time.sleep(1)

        # 6. Click on Pamela Noel row to open new Client Workspace
        log("6. Opening Client Workspace (/admin/clients/:id)...")
        workspace_btns = page.query_selector_all('button[title="Open Client Workspace"]')
        if workspace_btns:
            workspace_btns[0].click()
        else:
            page.click("table tbody tr:first-child td:first-child")

        page.wait_for_url("**/admin/clients/**", timeout=20000)
        log("Waiting for workspace data to load...")
        page.wait_for_selector("text=Loading workspace data...", state="hidden", timeout=30000)
        page.wait_for_selector('button[role="tab"]:has-text("Overview")', timeout=30000)
        time.sleep(2)

        # 7. Workspace - Overview Tab (Dark Mode)
        log("7. Capturing Overview Tab (Dark)...")
        set_dark(page)
        save_screenshot(page, "3_workspace_overview_dark.png")

        # 8. Workspace - Services Tab (Dark Mode)
        log("8. Capturing Services Tab (Dark)...")
        page.click('button[role="tab"]:has-text("Services")')
        time.sleep(1)
        save_screenshot(page, "4_workspace_services_dark.png")

        # 9. Workspace - Billing & Subscriptions Tab (Dark Mode)
        log("9. Capturing Billing & Subscriptions Tab (Dark)...")
        page.click('button[role="tab"]:has-text("Billing & Subs")')
        time.sleep(1)
        save_screenshot(page, "5_workspace_billing_dark.png")

        # 10. Workspace - Agreements Tab (Dark Mode)
        log("10. Capturing Agreements Tab (Dark)...")
        page.click('button[role="tab"]:has-text("Agreements")')
        time.sleep(1)
        save_screenshot(page, "6_workspace_agreements_dark.png")

        # 11. Workspace - Onboarding Tab (Dark Mode)
        log("11. Capturing Onboarding Tab (Dark)...")
        page.click('button[role="tab"]:has-text("Onboarding")')
        time.sleep(1)
        save_screenshot(page, "7_workspace_onboarding_dark.png")

        # 12. Workspace - Activity & Notes Tab (Dark Mode)
        log("12. Capturing Activity & Notes Tab (Dark)...")
        page.click('button[role="tab"]:has-text("Activity & Notes")')
        time.sleep(1)
        save_screenshot(page, "8_workspace_activity_dark.png")

        # 13. Switch to Light Mode on Overview Tab
        log("13. Capturing Workspace Overview (Light Mode)...")
        page.click('button[role="tab"]:has-text("Overview")')
        time.sleep(0.5)
        set_light(page)
        save_screenshot(page, "9_workspace_overview_light.png")

        # 14. Responsive Mobile Viewport (390 x 844)
        log("14. Capturing Responsive Mobile Viewport...")
        page.set_viewport_size({"width": 390, "height": 844})
        time.sleep(1)
        save_screenshot(page, "10_workspace_mobile_view.png", full_page=False)

        # 15. More Actions Dropdown open
        log("15. Capturing More Actions Menu...")
        page.set_viewport_size({"width": 1440, "height": 900})
        set_dark(page)
        time.sleep(0.5)
        context_actions_btn = page.query_selector('button:has(svg.lucide-more-vertical)')
        if context_actions_btn:
            context_actions_btn.click()
            time.sleep(1)
            save_screenshot(page, "11_workspace_actions_menu.png", full_page=False)
            page.keyboard.press("Escape")
            time.sleep(0.5)

        # 16. Multi-Subscription Client (Timothy Montgomery)
        log("16. Navigating to Timothy Montgomery (Multi-Subscription)...")
        page.goto("http://localhost:5173/admin/clients")
        page.wait_for_selector("text=Client Directory", timeout=15000)
        time.sleep(1)
        # Search for Timothy
        page.fill('input[placeholder*="Search"]', "Timothy")
        time.sleep(1)
        tim_ws = page.query_selector('button[title="Open Client Workspace"]')
        if tim_ws:
            tim_ws.click()
            page.wait_for_url("**/admin/clients/**", timeout=20000)
            page.wait_for_selector("text=Loading workspace data...", state="hidden", timeout=30000)
            page.wait_for_selector('button[role="tab"]:has-text("Overview")', timeout=30000)
            time.sleep(1.5)
            # Click Billing tab
            page.click('button[role="tab"]:has-text("Billing & Subs")')
            time.sleep(1.5)
            save_screenshot(page, "12_workspace_multisub_billing_dark.png")

        browser.close()
        log("All workspace visual assets captured successfully!")

if __name__ == "__main__":
    run()
