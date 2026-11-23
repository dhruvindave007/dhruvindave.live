"""Exercise the public showcase through its deployed path structure."""
import os
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from urllib.parse import urlparse

from playwright.sync_api import expect, sync_playwright

ROOT = Path(__file__).resolve().parents[2]
VIEWPORTS = (
    ('small-phone', 360, 740),
    ('phone', 390, 844),
    ('tablet', 768, 1024),
    ('intermediate', 1024, 768),
    ('desktop', 1440, 900),
)
STORE = 'prio-public-demo-v1'


def check_size(page, width):
    viewport, content = page.evaluate(
        '() => [document.documentElement.clientWidth, document.documentElement.scrollWidth]'
    )
    assert viewport == width and content <= width + 1, (viewport, content)
    assert page.locator('h1').is_visible()


def run_viewport(browser, base, name, width, height, output):
    touch = width <= 768
    context = browser.new_context(
        viewport={'width': width, 'height': height},
        is_mobile=width <= 390,
        has_touch=touch,
        reduced_motion='reduce' if touch else 'no-preference',
    )
    page = context.new_page()
    page.set_default_timeout(5000)
    errors, unexpected = [], []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.on('requestfailed', lambda request: errors.append(f'{request.url}: {request.failure}'))
    page.on('response', lambda response: errors.append(f'{response.status} {response.url}')
            if response.status >= 400 else None)
    page.on('request', lambda request: unexpected.append(request.url)
            if urlparse(request.url).netloc != urlparse(base).netloc else None)

    def activate(locator):
        if touch:
            locator.tap()
        else:
            locator.click()

    def capture(label):
        if output:
            page.screenshot(path=output / f'{name}-{label}.png', animations='disabled')

    try:
        response = page.goto(f'{base}/prio/', wait_until='load')
        assert response.ok
        check_size(page, width)
        capture('landing')
        activate(page.get_by_role('link', name='Try Prio with sample data'))
        expect(page).to_have_url(f'{base}/prio/demo.html')
        rows = page.locator('.task-row')
        expect(rows).to_have_count(4)
        check_size(page, width)
        capture('demo')

        nav = page.locator('.mobile-tabs:visible, .demo-sidebar:visible')
        activate(nav.locator('[data-view="team"]'))
        expect(rows).to_have_count(9)
        page.get_by_label('Filter tasks').select_option('high')
        expect(rows).to_have_count(4)

        activate(nav.locator('[data-view="approvals"]'))
        expect(rows).to_have_count(2)
        first = rows.first.locator('[data-open]')
        first.focus()
        page.keyboard.press('Enter')
        dialog = page.get_by_role('dialog', name='Approve accessibility pass')
        close = dialog.get_by_role('button', name='Close task details')
        expect(close).to_be_focused()
        page.keyboard.press('Tab')
        expect(dialog.get_by_role('button', name='Approve', exact=True)).to_be_focused()
        if touch:
            assert dialog.evaluate("el => getComputedStyle(el).animationName") == 'none'
        capture('approval')
        page.keyboard.press('Escape')
        expect(dialog).to_be_hidden()
        expect(first).to_be_focused()

        activate(first)
        activate(dialog.get_by_role('button', name='Approve', exact=True))
        expect(rows.first).to_contain_text('Approved')
        expect(first).to_be_focused()
        activate(rows.last.locator('[data-open]'))
        activate(page.get_by_role('button', name='Request changes'))
        expect(rows.last).to_contain_text('Changes requested')

        create = page.get_by_role('button', name='New task')
        activate(create)
        form = page.get_by_role('dialog', name='New sample task')
        title = form.get_by_role('textbox', name='Task title')
        expect(title).to_be_focused()
        page.keyboard.press('Shift+Tab')
        expect(form.get_by_role('button', name='Close new task form')).to_be_focused()
        if name == 'desktop':
            page.mouse.click(20, 150)
            expect(form).to_be_hidden()
            expect(create).to_be_focused()
            activate(create)
        title.fill('   ')
        activate(form.get_by_role('button', name='Add task'))
        expect(form).to_be_visible()
        title.fill('Prepare sample launch report')
        activate(form.get_by_role('button', name='Add task'))
        expect(form).to_be_hidden()
        expect(create).to_be_focused()

        page.reload()
        search = page.get_by_role('searchbox', name='Search tasks')
        search.fill('sample launch report')
        expect(rows).to_have_count(1)
        check = rows.first.locator('[data-toggle]')
        activate(check)
        expect(rows.first).to_contain_text('Completed')
        expect(check).to_be_focused()
        activate(check)
        expect(rows.first).to_contain_text('To do')
        activate(page.locator('#reset-demo'))
        search.fill('sample launch report')
        expect(page.get_by_text('No matching tasks.')).to_be_visible()
        page.reload()
        expect(rows).to_have_count(4)

        for invalid in ('{', '[{"id":1,"title":"Incomplete task"}]'):
            page.evaluate('([key, value]) => localStorage.setItem(key, value)', [STORE, invalid])
            page.reload()
            expect(rows).to_have_count(4)
            page.get_by_role('searchbox', name='Search tasks').fill('onboarding')
            expect(rows).to_have_count(1)

        page.goto(f'{base}/prio/')
        activate(page.get_by_role('link', name='Try the approval queue'))
        expect(page.get_by_role('heading', level=1, name='Approvals')).to_be_visible()
        expect(rows).to_have_count(2)
        assert not errors, errors
        assert not unexpected, unexpected
        print(f'{name} {width}×{height}: passed', flush=True)
    except Exception:
        if output:
            page.screenshot(path=output / f'{name}-failure.png', full_page=True)
        raise
    finally:
        context.close()


def main():
    output = os.environ.get('PRIO_SCREENSHOT_DIR')
    if output:
        output = Path(output)
        output.mkdir(parents=True, exist_ok=True)
    handler = partial(SimpleHTTPRequestHandler, directory=str(ROOT))
    with ThreadingHTTPServer(('127.0.0.1', 0), handler) as server:
        thread = Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            base = f'http://127.0.0.1:{server.server_port}'
            with sync_playwright() as playwright:
                browser = playwright.chromium.launch(
                    executable_path=os.environ.get('PLAYWRIGHT_EXECUTABLE_PATH') or None,
                )
                for name, width, height in VIEWPORTS:
                    run_viewport(browser, base, name, width, height, output)
                browser.close()
        finally:
            server.shutdown()
            thread.join()


if __name__ == '__main__':
    main()
