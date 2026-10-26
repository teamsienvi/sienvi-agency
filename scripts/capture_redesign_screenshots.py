import os
import sys
import time
import shutil
from playwright.sync_api import sync_playwright

SCREENSHOT_DIR = "screenshots/redesign_phase1"
BRAIN_ARTIFACT_DIR = r"C:\Users\Iris\.gemini\antigravity-ide\brain\b7ff94f6-2cce-405e-b83c-3ef9e5d0f2e8\screenshots\redesign_phase1"

os.makedirs(SCREENSHOT_DIR, exist_ok=True)
os.makedirs(BRAIN_ARTIFACT_DIR, exist_ok=True)

def log(msg):
    print(msg, flush=True)

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        log("1. Navigating to login page...")
        page.goto("http://localhost:5173/admin")
        page.wait_for_selector('input[type="email"]')

        log("2. Logging in as admin...")
        page.fill('input[type="email"]', "admin@sienvi.com")
        page.fill('input[type="password"]', "SienviAdmin2024!")
        page.click('button[type="submit"]')

        log("3. Waiting for dashboard to load...")
        page.wait_for_url("**/admin/dashboard", timeout=30000)
        page.wait_for_selector("text=Operations Overview", timeout=30000)
        page.wait_for_selector("text=Recent Clients", timeout=30000)
        time.sleep(2)

        # 1. Capture Dashboard Light Mode
        light_dash_path = os.path.join(SCREENSHOT_DIR, "1_admin_dashboard_light.png")
        page.screenshot(path=light_dash_path, full_page=True)
        log(f"Captured: {light_dash_path}")

        # 2. Toggle to Dark Mode
        log("4. Switching to Dark Theme...")
        page.click('button[aria-label*="theme"]')
        time.sleep(1)
        dark_dash_path = os.path.join(SCREENSHOT_DIR, "2_admin_dashboard_dark.png")
        page.screenshot(path=dark_dash_path, full_page=True)
        log(f"Captured: {dark_dash_path}")

        # 3. Navigate to Client Directory in Dark Mode
        log("5. Navigating to Client Directory...")
        page.click('a[href="/admin/clients"]')
        page.wait_for_url("**/admin/clients", timeout=15000)
        page.wait_for_selector("text=Client Directory", timeout=15000)
        time.sleep(2)
        dark_clients_path = os.path.join(SCREENSHOT_DIR, "3_admin_clients_dark.png")
        page.screenshot(path=dark_clients_path, full_page=True)
        log(f"Captured: {dark_clients_path}")

        # 4. Toggle Client Directory to Light Mode
        log("6. Switching to Light Theme in Client Directory...")
        page.click('button[aria-label*="theme"]')
        time.sleep(1)
        light_clients_path = os.path.join(SCREENSHOT_DIR, "4_admin_clients_light.png")
        page.screenshot(path=light_clients_path, full_page=True)
        log(f"Captured: {light_clients_path}")

        # 5. Navigate to Create Client
        log("7. Navigating to Create Client...")
        page.click('a[href="/admin/create-client"]')
        page.wait_for_url("**/admin/create-client", timeout=15000)
        page.wait_for_selector("text=Create Client", timeout=15000)
        time.sleep(1)
        create_client_path = os.path.join(SCREENSHOT_DIR, "5_admin_create_client.png")
        page.screenshot(path=create_client_path, full_page=True)
        log(f"Captured: {create_client_path}")

        # 6. Tablet Viewport (768 x 1024)
        log("8. Testing Tablet Viewport...")
        page.set_viewport_size({"width": 768, "height": 1024})
        page.goto("http://localhost:5173/admin/dashboard")
        page.wait_for_selector("text=Operations Overview", timeout=15000)
        time.sleep(1.5)
        tablet_path = os.path.join(SCREENSHOT_DIR, "6_admin_tablet_view.png")
        page.screenshot(path=tablet_path, full_page=True)
        log(f"Captured: {tablet_path}")

        # 7. Mobile Viewport (390 x 844)
        log("9. Testing Mobile Viewport...")
        page.set_viewport_size({"width": 390, "height": 844})
        page.goto("http://localhost:5173/admin/dashboard")
        page.wait_for_selector("text=Operations Overview", timeout=15000)
        time.sleep(1)
        mobile_path = os.path.join(SCREENSHOT_DIR, "7_admin_mobile_view.png")
        page.screenshot(path=mobile_path, full_page=True)
        log(f"Captured: {mobile_path}")

        # 8. Mobile Drawer Sheet Open
        log("10. Testing Mobile Drawer Sheet...")
        page.click('button[aria-label="Open navigation menu"]')
        time.sleep(1)
        mobile_sheet_path = os.path.join(SCREENSHOT_DIR, "8_admin_mobile_sheet.png")
        page.screenshot(path=mobile_sheet_path, full_page=False)
        log(f"Captured: {mobile_sheet_path}")

        browser.close()

    # Copy all to brain artifact dir
    for f in os.listdir(SCREENSHOT_DIR):
        src = os.path.join(SCREENSHOT_DIR, f)
        dst = os.path.join(BRAIN_ARTIFACT_DIR, f)
        shutil.copy2(src, dst)
    log("All screenshots mirrored to brain artifacts directory!")

if __name__ == "__main__":
    run()
