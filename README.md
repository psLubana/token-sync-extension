# Token Sync

A small Edge/Chrome extension (Manifest V3) that copies the JWT stored in `localStorage` under the key `token` from a deployed dev/sys/uat tab into a `localhost` tab, so you don't have to copy it by hand from DevTools.

<p align="center"><img src="icons/icon128.png" width="96" alt="Token Sync icon"></p>

## Why

Locally running apps (for example `http://localhost:9081/item-inquiry-app/ui`) need a valid token in `localStorage`. The deployed environments get that token through an ADFS OAuth2 login. `localStorage` is per origin, so `localhost` cannot read the deployed site's storage. This extension runs inside your browser and copies the value across.

## Features

- Copies `localStorage.token` from any open `*.example.com` tab into a `localhost` tab
- Selects the current tab automatically when you open the popup on a localhost tab (shown in green as **Current tab**)
- Otherwise pre-selects the localhost tab that belongs to the same app as the source tab
- Always puts a copy of the token on the clipboard
- Optional "clipboard only" button for manual pasting
- Reloads the localhost tab on the app's `/ui/` path so you leave `/oauth-login`
- Everything runs locally. No network requests, no analytics, no storage of the token

## Install (developer mode)

1. Clone or download this repository.
2. Open `edge://extensions` (or `chrome://extensions`).
3. Turn on **Developer mode**.
4. Click **Load unpacked** and select this folder.
5. Pin **Token Sync** from the puzzle-piece menu.

After changing any file, click the reload icon on the extension card.

## Usage

1. Open the deployed app in your browser, for example `https://example.com`, and sign in if asked.
2. Open the local app in another tab, for example `http://localhost:9083/testapp/`.
3. Click the **Token Sync** icon.
4. Check the two dropdowns, then click **Copy token to localhost tab**.

For sys or uat, open that environment's tab and choose it in the first dropdown.

## Configuration

Allowed sites are set in `manifest.json`:

```json
"host_permissions": ["*://*.example.com/*", "*://localhost/*"]
```

Change the domain to match your environment. The key name `token` is set in `readToken` and `writeToken` in `popup.js`.

## Project structure

```
manifest.json   extension definition and permissions
popup.html      popup UI
popup.js        popup logic
icons/          16, 32, 48 and 128 px icons
```

## Permissions explained

| Permission | Why |
| --- | --- |
| `tabs` | List open tabs and read their URLs |
| `scripting` | Read and write `localStorage` in the chosen tabs |
| `clipboardWrite` | Copy the token to the clipboard |
| Host access | Limited to the configured domain and `localhost` |

## Troubleshooting

- **Dropdowns are empty:** open the tabs first, then reopen the popup.
- **No 'token' key:** the source tab hasn't finished logging in. Wait for the app UI to load.
- **Extension blocked:** your organization may restrict developer-mode extensions. Ask IT.
- **Shared port:** apps that share a port (for example `localhost:9083`) share one `localStorage`, so syncing one overwrites the other.
- **Manual fallback:** in the localhost Console, run `localStorage.setItem("token", "PASTE_HERE")`.

## Security notes

A JWT is a credential. Never commit tokens, paste them in issues, or share screenshots that show them. Use this tool only with environments you are authorized to access. Be careful pointing a local build at a prod token.

## License

MIT, see [LICENSE](LICENSE).
