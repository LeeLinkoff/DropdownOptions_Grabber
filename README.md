# Dropdown Options Grabber

## Why I built this

While troubleshooting, I kept needing the full list of options in a dropdown, and there was no easy way to get them. Selecting text in an open menu doesn't work, custom dropdowns vanish the moment you click away, and digging through DevTools for each option is slow. This bookmarklet grabs them all in one click and puts them on the clipboard as plain text.

## What it is

A bookmarklet that captures every option from the dropdowns on a web page and copies them as plain text. It works on native `<select>` menus and on the custom JavaScript dropdowns most modern sites use.

No extension to install, no network requests, nothing sent anywhere. It reads the page you're looking at and shows the results in a small panel.

## What it captures

| Dropdown type | How it's found | Needs to be open? |
|---|---|---|
| Native `<select>` | Every `<select>` element on the page | No |
| Custom (JavaScript) dropdowns | Elements marked `role="option"` | Yes |

Custom dropdowns usually build their option list only while open and remove it when closed. That's why the bookmarklet waits 5 seconds before capturing, so you have time to open the menu you want.

## Install

1. Open `dropdown_options_grabber-bookmarklet.txt` and copy its entire contents. It's one line starting with `javascript:`.
2. Create a new bookmark in your browser.
3. Name it something like `Grab Dropdowns`.
4. Paste the copied line into the bookmark's URL field and save.

Use the one-line `.txt` file for the bookmark. The annotated `.js` file is multi-line and is meant for reading, not for pasting into a bookmark.

## Use

1. Go to the page with the dropdown.
2. Click the bookmark.
3. Click **OK** on the prompt.
4. Within 5 seconds, open the dropdown you want to capture.
5. A panel appears in the top right corner listing every option, grouped by dropdown.
6. Click **Copy all** to copy the list. Click **×** to close the panel.

## Output format

Headings are flush left, options are indented two spaces, one per line.

```
Dropdown: color
  Red
  Blue
Dropdown: size
  S
  M
Open dropdown
  Alpha
  Beta
```

Native dropdowns are labeled with their `name`, then their `id`, then their position on the page (`#1`, `#2`) if they have neither. All open custom dropdown options are grouped under **Open dropdown**.

## Files

| File | Purpose |
|---|---|
| `dropdown_options_grabber-bookmarklet.txt` | One-line version to paste into a bookmark |
| `dropdown_options_grabber-annotated.js` | Same logic, formatted and commented for reading |

## How it works

The annotated file explains each part in detail. In short, it

- reads every `<option>` from each `<select>` on the page,
- reads every element with `role="option"` that is present after the 5 second wait,
- builds a plain-text list,
- shows the list in a panel rendered inside a shadow root, so the site's CSS can't restyle it,
- copies with the Clipboard API, falling back to `document.execCommand('copy')` on sites that block it.

Option text is inserted with `textContent`, so any HTML inside an option is displayed as text and never executed.

## Limitations

- Custom dropdowns are captured only if they mark their options with `role="option"`. Widgets that don't follow that convention won't be detected.
- Only the main page is searched. Dropdowns inside iframes or inside another component's shadow DOM are not captured.
- If several custom dropdowns are open at once, their options are combined under one **Open dropdown** heading.
- The panel uses an open shadow root, so the page's own scripts can see it while it is displayed.
