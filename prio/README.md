# Prio portfolio landing page

`/prio/` is a static introduction to Prio's AI Entry, review, and prioritization workflow. The interactive workflow illustration only switches explanatory stages in the browser. There is no sign-in, integration, or sample workspace. Keep private application URLs, data, and interfaces outside this repository.

Use Python 3.12 to install and run the same browser checks as CI from the portfolio repository root:

```sh
python -m pip install -r prio/tests/requirements.txt
python -m playwright install --only-shell chromium
PRIO_SCREENSHOT_DIR=/tmp/prio-screens python prio/tests/test_ui.py
```

The test serves the repository over local HTTP and checks the landing page at five widths, anchor navigation, keyboard access, reduced motion, and removal of the former demo route. CI uploads screenshots for inspection.
