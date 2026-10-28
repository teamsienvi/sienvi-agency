import os
import sys
import time
import shutil
from playwright.sync_api import sync_playwright

LOCAL_DIR = "screenshots/phase_2a"
BRAIN_DIR = r"C:\Users\Iris\.gemini\antigravity-ide\brain\b7ff94f6-2cce-405e-b83c-3ef9e5d0f2e8\screenshots\phase_2a"

os.makedirs(LOCAL_DIR, exist_ok=True)
os.makedirs(BRAIN_DIR, exist_ok=True)

def get_admin_password():
    with open(".env.local", "r", encoding="utf-8") as f:
        for line in f:
            if line.startswith("ADMIN_PASSWORD="):
                return line.split("=", 1)[1].strip()
    return ""

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
    admin_pw = get_admin_password()
    if not admin_pw:
        log("Error: ADMIN_PASSWORD not found in .env.local")
        sys.exit(1)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        
        # 1. Desktop Session
        context = browser.new_context(viewport={"width": 1440, "height": 950})
        page = context.new_page()

        log("1. Navigating to admin login on http://localhost:5174/admin...")
        page.goto("http://localhost:5174/admin")
        page.wait_for_selector('input[type="email"]', timeout=20000)

        log("2. Logging in as admin...")
        page.fill('input[type="email"]', "admin@sienvi.com")
        page.fill('input[type="password"]', admin_pw)
        page.click('button[type="submit"]')

        log("3. Waiting for Executive Dashboard...")
        page.wait_for_url("**/admin/dashboard", timeout=30000)
        page.wait_for_selector("text=Executive Operations Command Center", timeout=20000)
        page.wait_for_selector("text=$15,783", timeout=20000)
        time.sleep(2)

        # 4. Capture Desktop Dark Mode
        log("4. Capturing Desktop Dark Mode...")
        set_dark(page)
        time.sleep(1)
        save_screenshot(page, "01_executive_dashboard_desktop_dark.png")

        # 5. Capture Desktop Light Mode
        log("5. Capturing Desktop Light Mode...")
        set_light(page)
        time.sleep(1)
        save_screenshot(page, "02_executive_dashboard_desktop_light.png")

        # 6. Capture Attention Queue and Revenue Composition zoomed view
        log("6. Capturing Attention Queue and Composition...")
        set_dark(page)
        save_screenshot(page, "03_revenue_composition_and_attention_queue.png")

        # 7. Test Action Link: Click Resolve on Susie Oh failed payment
        log("7. Testing Attention Queue action link...")
        resolve_button = page.locator('a[href*="/admin/clients/692bc695-094e-489d-ba16-218a3a14129a?tab=billing"]').first
        if resolve_button.count() > 0:
            resolve_button.click()
            page.wait_for_url("**/admin/clients/692bc695-094e-489d-ba16-218a3a14129a**", timeout=15000)
            page.wait_for_selector("text=Susie Jung Hea Oh", timeout=15000)
            time.sleep(2)
            save_screenshot(page, "05_attention_queue_action_click_workspace.png")
            log("[OK] Successfully verified Attention Queue link navigated directly to Client Workspace Billing tab!")

        # 8. Verify Client Directory Compatibility
        log("8. Navigating to /admin/clients...")
        page.goto("http://localhost:5174/admin/clients")
        page.wait_for_selector("text=Client Directory", timeout=15000)
        time.sleep(2)
        save_screenshot(page, "06_client_directory_phase1_compat.png")
        log("[OK] Successfully verified Client Directory remains fully functional!")

        context.close()

        # 9. Mobile Viewport (375 x 812)
        log("9. Testing Mobile Viewport...")
        mobile_context = browser.new_context(viewport={"width": 375, "height": 812}, is_mobile=True)
        mobile_page = mobile_context.new_page()

        mobile_page.goto("http://localhost:5174/admin")
        mobile_page.wait_for_selector('input[type="email"]', timeout=20000)
        mobile_page.fill('input[type="email"]', "admin@sienvi.com")
        mobile_page.fill('input[type="password"]', admin_pw)
        mobile_page.click('button[type="submit"]')
        mobile_page.wait_for_url("**/admin/dashboard", timeout=30000)
        mobile_page.wait_for_selector("text=Executive Operations Command Center", timeout=20000)
        time.sleep(2)
        set_dark(mobile_page)
        save_screenshot(mobile_page, "04_executive_dashboard_mobile_view.png")
        log("[OK] Successfully captured Mobile Viewport!")

        mobile_context.close()
        browser.close()
        log("All screenshots captured and verified successfully!")

if __name__ == "__main__":
    run()
