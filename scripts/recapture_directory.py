import os
import time
import shutil
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={"width": 1440, "height": 950})
    page = context.new_page()
    page.goto("http://localhost:5174/admin")
    page.wait_for_selector('input[type="email"]')
    with open(".env.local", "r", encoding="utf-8") as f:
        for line in f:
            if line.startswith("ADMIN_PASSWORD="):
                pw = line.split("=", 1)[1].strip()
    page.fill('input[type="email"]', "admin@sienvi.com")
    page.fill('input[type="password"]', pw)
    page.click('button[type="submit"]')
    page.wait_for_url("**/admin/dashboard")
    page.goto("http://localhost:5174/admin/clients")
    page.wait_for_selector("table tbody tr", timeout=30000)
    time.sleep(2)
    page.evaluate("() => { document.documentElement.classList.add('dark'); }")
    page.screenshot(path="screenshots/phase_2a/06_client_directory_phase1_compat.png", full_page=True)
    shutil.copyfile("screenshots/phase_2a/06_client_directory_phase1_compat.png", r"C:\Users\Iris\.gemini\antigravity-ide\brain\b7ff94f6-2cce-405e-b83c-3ef9e5d0f2e8\screenshots\phase_2a\06_client_directory_phase1_compat.png")
    print("Recaptured client directory table with rows successfully")
    browser.close()
