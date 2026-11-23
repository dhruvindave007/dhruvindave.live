from playwright.sync_api import sync_playwright
import json
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
css = (ROOT / 'styles.css').read_text().split('\n', 1)[1]
landing = (ROOT / 'index.html').read_text().replace('<link rel="stylesheet" href="./styles.css">', '<style>' + css + '</style>')
demo = (ROOT / 'demo.html').read_text().replace('<link rel="stylesheet" href="./styles.css">', '<style>' + css + '</style>').replace('<script defer src="./demo.js"></script>', '<script>' + (ROOT / 'demo.js').read_text() + '</script>')

def check_size(page, name):
    widths = page.evaluate('({width:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth})')
    assert widths['width'] <= widths['viewport'] + 2, (name, widths)
    return widths

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path=os.environ.get('PLAYWRIGHT_EXECUTABLE_PATH') or None, args=['--no-sandbox','--disable-dev-shm-usage'])
    results = {}
    for label, w, h in [('phone',390,844), ('smallphone',360,740), ('tablet',768,1024), ('desktop',1440,900)]:
        page = browser.new_page(viewport={'width': w, 'height': h}, device_scale_factor=1, is_mobile=(w<=390), has_touch=(w<=390))
        page.set_default_timeout(8000)
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.set_content(landing, wait_until='domcontentloaded')
        page.locator('h1').wait_for()
        results[label] = {'landing': check_size(page, label+' landing')}
        page.set_content(demo, wait_until='domcontentloaded')
        page.locator('.task-row').first.wait_for()
        results[label]['demo'] = check_size(page, label+' demo')
        if w <= 390:
            page.get_by_role('button', name='Approvals', exact=True).last.click()
        else:
            page.get_by_role('button', name='Approvals', exact=False).first.click()
        assert 'Approvals' in page.locator('#view-title').inner_text()
        assert page.locator('.task-row').count() == 2
        page.locator('[data-open]').first.click()
        assert page.locator('#detail-sheet').get_attribute('aria-hidden') == 'false'
        page.get_by_role('button', name='Approve', exact=True).click()
        page.locator('#reset-demo').click()
        page.locator('#open-create').click()
        page.locator('#new-title').fill('Test this new interface')
        page.locator('#create-form').get_by_role('button', name='Add task').click()
        assert page.get_by_text('Test this new interface').count() == 1
        page.locator('#task-search').fill('Test this new interface')
        assert page.locator('.task-row').count() == 1
        page.locator('[data-toggle]').first.click()
        assert 'Completed' in page.locator('.task-row').first.inner_text()
        page.locator('#reset-demo').click()
        page.locator('#task-search').fill('Test this new interface')
        assert page.locator('.task-row').count() == 0
        assert not errors, (label, errors)
        results[label]['interactions'] = 'passed'
        results[label]['js_errors'] = errors
        page.close()
    browser.close()
    print(json.dumps(results, indent=2))
