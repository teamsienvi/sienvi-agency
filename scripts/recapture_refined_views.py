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
        page.goto("http://localhost:5173/admin/clients")
        page.wait_for_selector("text=Client Directory", timeout=15000)
        log("Waiting for clients table to populate...")
        page.wait_for_selector("text=Loading clients...", state="hidden", timeout=30000)
        page.wait_for_selector("table tbody tr", timeout=30000)
        time.sleep(2)

        # Light Mode Table
        log("5. Capturing refined Client Directory (Light Mode)...")
        set_light(page)
        save_screenshot(page, "refined_client_directory_light.png")

        # Dark Mode Table
        log("6. Capturing refined Client Directory (Dark Mode)...")
        set_dark(page)
        save_screenshot(page, "refined_client_directory_dark.png")

        # Dropdown Open in Dark Mode
        log("7. Opening row actions dropdown menu...")
        more_btns = page.query_selector_all('tbody tr:first-child button[title*="More client actions"]')
        if more_btns:
            more_btns[0].click()
            time.sleep(1)
            save_screenshot(page, "refined_actions_dropdown_open.png", full_page=False)

        browser.close()
        log("All refined table screenshots captured successfully!")

if __name__ == "__main__":
    run()
