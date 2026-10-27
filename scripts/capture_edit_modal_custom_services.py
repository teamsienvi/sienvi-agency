import os
import time
import shutil
from playwright.sync_api import sync_playwright

LOCAL_DIR = "screenshots/client_workspace"
BRAIN_DIR = r"C:\Users\Iris\.gemini\antigravity-ide\brain\b7ff94f6-2cce-405e-b83c-3ef9e5d0f2e8\screenshots\client_workspace"

def log(msg):
    print(msg, flush=True)

def save_screenshot(page, filename, full_page=True):
    local_path = os.path.join(LOCAL_DIR, filename)
    brain_path = os.path.join(BRAIN_DIR, filename)
    page.screenshot(path=local_path, full_page=full_page)
    shutil.copyfile(local_path, brain_path)
    log(f"Captured: {local_path} -> {brain_path}")

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
        page.goto("http://localhost:5173/admin/clients")
        page.wait_for_selector("text=Client Directory", timeout=15000)
        page.wait_for_selector("text=Loading clients...", state="hidden", timeout=30000)
        page.wait_for_selector("table tbody tr", timeout=30000)
        time.sleep(2)

        # 5. Open More Actions -> Edit Profile on first row (Pamela Noel who already has b2b-pipeline)
        log("5. Opening Edit Profile on first row...")
        more_btn = page.locator('tbody tr:first-child button[title*="More client actions"]').first
        more_btn.click()
        time.sleep(0.5)

        edit_item = page.locator('text=Edit Profile...').first
        edit_item.click()
        time.sleep(1)

        log("6. Scrolling to Custom Services section in modal...")
        custom_svc_label = page.locator('text=Custom Services').first
        if custom_svc_label:
            custom_svc_label.scroll_into_view_if_needed()
            time.sleep(0.5)

        log("7. Capturing EditClientModal showing auto-detected custom services...")
        save_screenshot(page, "edit_client_modal_custom_services.png", full_page=False)

        browser.close()
        log("Edit modal screenshot captured!")

if __name__ == "__main__":
    run()
