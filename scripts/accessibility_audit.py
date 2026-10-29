import os
import json
import asyncio
from playwright.async_api import async_playwright

def get_admin_password():
    with open(".env.local", "r", encoding="utf-8") as f:
        for line in f:
            if line.startswith("ADMIN_PASSWORD="):
                return line.replace("ADMIN_PASSWORD=", "").strip()
    return ""

async def audit_page(page, page_name, theme="dark"):
    print(f"\n=======================================================", flush=True)
    print(f"AUDITING: {page_name} (Theme: {theme})", flush=True)
    print(f"URL: {page.url}", flush=True)
    print(f"=======================================================", flush=True)

    if theme == "dark":
        await page.evaluate("() => document.documentElement.classList.add('dark')")
    else:
        await page.evaluate("() => document.documentElement.classList.remove('dark')")
    await page.wait_for_timeout(500)

    # Inject axe-core
    await page.add_script_tag(url="https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.9.1/axe.min.js")

    results = await page.evaluate("""
        async () => {
            return await axe.run({
                runOnly: {
                    type: 'tag',
                    values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
                }
            });
        }
    """)

    violations = results.get("violations", [])
    print(f"Total Violations: {len(violations)}", flush=True)
    for v in violations:
        print(f"  [{v['impact'].upper()}] {v['id']}: {v['description']}", flush=True)
        for node in v['nodes'][:3]:
            print(f"    Target: {node['target']}", flush=True)
            print(f"    Failure: {node['failureSummary'].replace(chr(10), ' ')}", flush=True)

    # Capture screenshot
    screenshot_name = f"screenshots/a11y_{page_name}_{theme}.png"
    os.makedirs("screenshots", exist_ok=True)
    await page.screenshot(path=screenshot_name, full_page=True)
    print(f"Saved screenshot: {screenshot_name}", flush=True)

    return violations

async def run_all_audits():
    os.makedirs("screenshots", exist_ok=True)
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await context.new_page()

        client_id = "fab3c44c-2779-44fb-9e44-b64437f40885"

        page.on("console", lambda msg: print(f"[BROWSER CONSOLE] {msg.type}: {msg.text}"))
        page.on("pageerror", lambda err: print(f"[PAGE ERROR] {err}"))

        # 1. Login as Admin
        admin_password = get_admin_password()
        await page.goto("http://localhost:8080/admin", wait_until="domcontentloaded")
        await page.fill('#email', "admin@sienvi.com")
        await page.fill('#password', admin_password)
        await page.click('button[type="submit"]')
        await page.wait_for_timeout(2000)

        # 2. Audit /contract?view=true&clientId=... in Dark and Light mode
        contract_url = f"http://localhost:8080/contract?view=true&clientId={client_id}"
        await page.goto(contract_url, wait_until="networkidle")
        try:
            await page.wait_for_selector('h1', timeout=6000)
        except Exception as e:
            print(f"Wait for h1 error: {e}")
        await page.wait_for_timeout(1000)

        # Dark Mode
        await audit_page(page, "contract_view", "dark")
        # Light Mode
        await audit_page(page, "contract_view", "light")

        # 3. Audit /admin/billing
        await page.goto("http://localhost:8080/admin/billing", wait_until="networkidle")
        await page.wait_for_timeout(1000)
        await audit_page(page, "admin_billing", "dark")

        # 4. Audit /admin/clients/:id
        await page.goto(f"http://localhost:8080/admin/clients/{client_id}", wait_until="networkidle")
        await page.wait_for_timeout(1000)
        await audit_page(page, "admin_client_workspace", "dark")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run_all_audits())
