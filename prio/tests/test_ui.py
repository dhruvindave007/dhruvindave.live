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
def check_size(page, width):
    viewport, content = page.evaluate(
        '() => [document.documentElement.clientWidth, document.documentElement.scrollWidth]'
    )
    assert viewport == width and content <= width + 1, (viewport, content)


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

    try:
        response = page.goto(f'{base}/prio/', wait_until='load')
        assert response.ok
        check_size(page, width)
        expect(page.get_by_role('heading', level=1)).to_have_text('From conversation to task.')
        expect(page.locator('.workflow-steps li')).to_have_count(4)
        expect(page.locator('script, form, button, input, iframe')).to_have_count(0)
        expect(page.locator('a:not([href="./"], [href="../"], [href^="#"])')).to_have_count(0)

        if output:
            page.screenshot(path=output / f'{name}-landing.png', animations='disabled', full_page=True)

        page.keyboard.press('Tab')
        skip = page.get_by_role('link', name='Skip to content')
        expect(skip).to_be_focused()
        page.keyboard.press('Enter')
        expect(page.locator('main')).to_be_focused()

        entry = page.get_by_role('link', name='See how AI Entry works')
        if touch:
            entry.tap()
            assert page.evaluate("getComputedStyle(document.documentElement).scrollBehavior") == 'auto'
        else:
            entry.focus()
            page.keyboard.press('Enter')
        expect(page).to_have_url(f'{base}/prio/#ai-entry')
        expect(page.get_by_role('heading', name='The AI proposes. People decide.')).to_be_in_viewport()

        portfolio = page.get_by_role('link', name='Back to portfolio')
        expect(portfolio).to_have_attribute('href', '../')
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
                request = playwright.request.new_context(base_url=base)
                try:
                    assert request.get('/').ok
                    for former_asset in ('demo.html', 'demo.js'):
                        assert request.get(f'/prio/{former_asset}').status == 404
                finally:
                    request.dispose()
        finally:
            server.shutdown()
            thread.join()


if __name__ == '__main__':
    main()
