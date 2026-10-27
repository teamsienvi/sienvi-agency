import os
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

        # 4. Navigate to /admin/create-client
        log("4. Navigating to /admin/create-client...")
        page.goto("http://localhost:5173/admin/create-client")
        page.wait_for_selector("text=Create Client", timeout=15000)
        time.sleep(1)

        log("5. Capturing initial create client services section...")
        services_section = page.locator("text=Services (0/1)").first
        services_section.scroll_into_view_if_needed()
        time.sleep(0.5)
        save_screenshot(page, "create_client_with_add_custom_btn.png", full_page=False)

        # 6. Click 'Add Custom Service' button
        log("6. Clicking '+ Add Custom Service'...")
        add_btn = page.locator('button:has-text("Add Custom Service")').first
        if add_btn:
            add_btn.click()
            time.sleep(0.5)
            log("Typing custom service name...")
            page.fill('input[placeholder*="B2B Wholesale Portal"]', "B2B Wholesale Portal")
            time.sleep(0.5)
            save_screenshot(page, "create_client_custom_service_input.png", full_page=False)

            log("Clicking 'Add' button...")
            page.click('button:has-text("Add")')
            time.sleep(1)

            save_screenshot(page, "create_client_custom_service_added.png", full_page=False)

        # 7. Add another custom service
        log("7. Adding second custom service...")
        add_btn2 = page.locator('button:has-text("Add Custom Service")').first
        if add_btn2:
            add_btn2.click()
            time.sleep(0.5)
            page.fill('input[placeholder*="B2B Wholesale Portal"]', "Cold Outreach Infrastructure")
            time.sleep(0.5)
            page.click('button:has-text("Add")')
            time.sleep(1)
            save_screenshot(page, "create_client_two_custom_services.png", full_page=False)

        browser.close()
        log("All custom services screenshots captured successfully!")

if __name__ == "__main__":
    run()
