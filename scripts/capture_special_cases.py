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

        # 4. Legacy modal fallback test on /admin/clients
        log("4. Testing legacy modal fallback...")
        page.goto("http://localhost:5173/admin/clients")
        page.wait_for_selector("text=Client Directory", timeout=15000)
        time.sleep(2)
        set_dark(page)
        
        # Click the Eye icon on the first row
        first_eye = page.query_selector('tbody tr:first-child button[title*="Modal Fallback"]')
        if first_eye:
            first_eye.click()
            page.wait_for_selector('div[role="dialog"]', timeout=10000)
            time.sleep(1.5)
            save_screenshot(page, "2_legacy_modal_fallback.png")
            page.keyboard.press("Escape")
            time.sleep(1)

        # 5. Timothy Montgomery (Multi-Subscription Client)
        log("5. Opening Timothy Montgomery Multi-Sub Workspace...")
        page.goto("http://localhost:5173/admin/clients/29234baf-2ff2-4534-b72c-7ccc276e6968")
        page.wait_for_selector("text=Loading workspace data...", state="hidden", timeout=30000)
        page.wait_for_selector('button[role="tab"]:has-text("Overview")', timeout=30000)
        set_dark(page)
        time.sleep(1)
        # Click Billing Tab
        page.click('button[role="tab"]:has-text("Billing & Subs")')
        time.sleep(1.5)
        save_screenshot(page, "12_workspace_multisub_billing_dark.png")

        # 6. Michael Wilson (Commission-Based Client)
        log("6. Opening Michael Wilson Commission Workspace...")
        page.goto("http://localhost:5173/admin/clients/5404d32d-52b9-49dd-aadf-b1041ac2ca77")
        page.wait_for_selector("text=Loading workspace data...", state="hidden", timeout=30000)
        page.wait_for_selector('button[role="tab"]:has-text("Overview")', timeout=30000)
        set_dark(page)
        time.sleep(1)
        save_screenshot(page, "13_workspace_commission_overview_dark.png")

        browser.close()
        log("Special case screenshots captured successfully!")

if __name__ == "__main__":
    run()
