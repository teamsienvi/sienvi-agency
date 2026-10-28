import os
import sys
import time
import shutil
import urllib.request
from playwright.sync_api import sync_playwright

LOCAL_DIR = "screenshots/phase_2a_live_integration"
BRAIN_DIR = r"C:\Users\Iris\.gemini\antigravity-ide\brain\b7ff94f6-2cce-405e-b83c-3ef9e5d0f2e8\screenshots\phase_2a_live_integration"

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
    log(f"[CAPTURED] {filename} -> {brain_path}")

def set_dark(page):
    page.evaluate("() => { document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); window.dispatchEvent(new CustomEvent('sienvi-theme-change', { detail: 'dark' })); }")
    time.sleep(0.5)

def set_light(page):
    page.evaluate("() => { document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); window.dispatchEvent(new CustomEvent('sienvi-theme-change', { detail: 'light' })); }")
    time.sleep(0.5)

def proxy_to_local_metrics(route, request):
    """
    Proxies browser Edge Function invocation to the local authoritative metrics HTTP service.
    Transfers the real caller Authorization Bearer token.
    """
    headers = {k: v for k, v in request.headers.items()}
    req = urllib.request.Request(
        "http://127.0.0.1:54321/get-admin-executive-metrics",
        headers=headers,
        method=request.method,
    )
    try:
        with urllib.request.urlopen(req) as response:
            body = response.read()
            route.fulfill(
                status=response.status,
                headers={"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
                body=body,
            )
    except urllib.error.HTTPError as e:
        route.fulfill(
            status=e.code,
            headers={"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
            body=e.read(),
        )

def main():
    admin_pw = get_admin_password()
    if not admin_pw:
        log("Error: ADMIN_PASSWORD not found")
        sys.exit(1)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        log("\n=== SIENVI AGENCY: LIVE METRICS ENDPOINT FRONTEND INTEGRATION TEST ===")
        context = browser.new_context(viewport={"width": 1440, "height": 950})
        page = context.new_page()

        # Connect browser function invocation to real local HTTP service
        page.route("**/functions/v1/get-admin-executive-metrics", proxy_to_local_metrics)

        log("1. Navigating to admin login...")
        page.goto("http://localhost:5174/admin")
        page.wait_for_selector('input[type="email"]', timeout=15000)
        page.fill('input[type="email"]', "admin@sienvi.com")
        page.fill('input[type="password"]', admin_pw)
        page.click('button[type="submit"]')

        log("2. Waiting for dashboard navigation and live HTTP metrics response...")
        page.wait_for_url("**/admin/dashboard", timeout=25000)

        # Wait for live metrics values
        page.wait_for_selector("text=$15,783", timeout=15000)
        page.wait_for_selector("text=$11,298", timeout=15000)
        page.wait_for_selector("text=$4,485", timeout=15000)
        page.wait_for_selector("text=$2,450", timeout=15000)
        page.wait_for_selector("text=$500", timeout=15000)
        page.wait_for_selector("text=$999", timeout=15000)
        page.wait_for_selector("text=Reconciliation Pending", timeout=15000)
        log("[OK] Dashboard live-connected to HTTP service and rendered authoritative metrics ($15,783 MRR, $11,298 Stripe, $4,485 Manual)!")

        # 3. Desktop Dark Mode
        log("3. Capturing Live Integration Desktop Dark Mode...")
        set_dark(page)
        time.sleep(1)
        save_screenshot(page, "01_live_dashboard_desktop_dark.png")

        # 4. Desktop Light Mode
        log("4. Capturing Live Integration Desktop Light Mode...")
        set_light(page)
        time.sleep(1)
        save_screenshot(page, "02_live_dashboard_desktop_light.png")

        # 5. Mobile Responsive View
        log("5. Testing Mobile View with Live Metrics Service...")
        mobile_context = browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True)
        mobile_page = mobile_context.new_page()
        mobile_page.route("**/functions/v1/get-admin-executive-metrics", proxy_to_local_metrics)

        mobile_page.goto("http://localhost:5174/admin")
        mobile_page.wait_for_selector('input[type="email"]', timeout=15000)
        mobile_page.fill('input[type="email"]', "admin@sienvi.com")
        mobile_page.fill('input[type="password"]', admin_pw)
        mobile_page.click('button[type="submit"]')
        mobile_page.wait_for_url("**/admin/dashboard", timeout=25000)
        mobile_page.wait_for_selector("text=$15,783", timeout=15000)
        set_dark(mobile_page)
        time.sleep(1)
        save_screenshot(mobile_page, "03_live_dashboard_mobile.png")
        log("[OK] Mobile view live metrics verified!")
        mobile_context.close()

        # 6. Deep Link Navigation: Susie Oh Past-Due -> Billing Tab
        log("6. Testing Deep Link navigation to Billing Tab...")
        set_dark(page)
        susie_link = page.locator('a[href*="/admin/clients/692bc695-094e-489d-ba16-218a3a14129a?tab=billing"]').first
        susie_link.click()
        page.wait_for_url("**/admin/clients/692bc695-094e-489d-ba16-218a3a14129a?tab=billing", timeout=15000)
        page.wait_for_selector("text=Susie Jung Hea Oh", timeout=15000)
        page.wait_for_selector('[role="tab"][data-state="active"]:has-text("Billing & Subscriptions")', timeout=10000)
        time.sleep(1)
        save_screenshot(page, "04_live_workspace_billing_tab.png")
        log("[OK] Attention Queue link activated Billing & Subscriptions tab!")

        # 7. Deep Link Navigation: Devra Henderson -> Agreements Tab
        log("7. Testing Deep Link navigation to Agreements Tab...")
        page.goto("http://localhost:5174/admin/clients/b0e54c3d-468e-41e5-9c78-79f67ed83bde?tab=agreements")
        page.wait_for_selector("text=Devra Henderson", timeout=15000)
        page.wait_for_selector('[role="tab"][data-state="active"]:has-text("Agreements")', timeout=10000)
        time.sleep(1)
        save_screenshot(page, "05_live_workspace_agreements_tab.png")
        log("[OK] URL navigation with ?tab=agreements activated Agreements tab!")

        # 8. Client Directory Verification
        log("8. Verifying Client Directory Compatibility...")
        page.goto("http://localhost:5174/admin/clients")
        page.wait_for_selector("text=Client Directory", timeout=15000)
        page.wait_for_selector("table tbody tr", timeout=15000)
        time.sleep(1)
        save_screenshot(page, "06_live_client_directory.png")
        log("[OK] Client Directory verified!")

        context.close()
        browser.close()

    log("\n==================================================================")
    log("ALL LIVE FRONTEND INTEGRATION VERIFICATIONS COMPLETED SUCCESSFULLY!")
    log("==================================================================")

if __name__ == "__main__":
    main()
