# Technical Architecture Reference

## State Management Schema

### chrome.storage.local Structure

```typescript
interface StorageData {
    whitelist: string[]; // Array of allowed domains (e.g., ["github.com", "stackoverflow.com"])
    isActive: boolean; // Lockdown state flag
    endTime: number | null; // Unix timestamp (ms) when lockdown expires
    killSwitchUuid: string; // UUIDv4 for unlock challenge
}
```

**Persistence Behavior:**

-   Written by Service Worker on `START_LOCKDOWN` / `STOP_LOCKDOWN`
-   Polled by Popup every 1000ms via `chrome.storage.local.get()`
-   Survives Popup close/reopen and browser restart
-   No expiration mechanism (cleared only on explicit stop)

**Initial State (on extension install):**

```javascript
{
  whitelist: [],
  isActive: false,
  endTime: null,
  killSwitchUuid: ""
}
```

---

## Messaging Protocol

### Message Types (Popup → Service Worker)

```typescript
interface Message {
    type: "START_LOCKDOWN" | "STOP_LOCKDOWN";
    endTime?: number; // Required for START_LOCKDOWN
    whitelist?: string[]; // Required for START_LOCKDOWN
}
```

### START_LOCKDOWN

**Sender:** `App.tsx::handleStartTimer()`  
**Payload:**

```javascript
{
  type: "START_LOCKDOWN",
  endTime: Date.now() + (minutes * 60 * 1000),
  whitelist: ["domain1.com", "domain2.com"]
}
```

**Service Worker Response:**

1. Generate UUIDv4 via `uuid` library
2. Write to `chrome.storage.local`:
    ```javascript
    {
      isActive: true,
      endTime: <timestamp>,
      whitelist: <array>,
      killSwitchUuid: <uuid>
    }
    ```
3. Call `updateBlockingRules(whitelist)`
4. Set alarm: `chrome.alarms.create("endLockdown", { when: endTime })`

### STOP_LOCKDOWN

**Sender:** `App.tsx::handleKillSwitch()`  
**Payload:**

```javascript
{
    type: "STOP_LOCKDOWN";
}
```

**Service Worker Response:**

1. Write to `chrome.storage.local`:
    ```javascript
    {
      isActive: false,
      endTime: null,
      killSwitchUuid: ""
    }
    ```
2. Remove blocking rule: `chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: [1] })`
3. Clear alarm: `chrome.alarms.clear("endLockdown")`

---

## Core Logic Flow

### Lockdown Activation Sequence

```
[User clicks preset/custom timer in Popup]
         ↓
App.tsx::handleStartTimer(minutes)
         ↓
chrome.runtime.sendMessage({ type: "START_LOCKDOWN", endTime, whitelist })
         ↓
background.ts::startLockdown(endTime, whitelist)
         ↓
├─ Generate UUIDv4
├─ Persist state to chrome.storage.local
├─ Call updateBlockingRules(whitelist)
│    ↓
│    chrome.declarativeNetRequest.updateDynamicRules({
│      addRules: [{
│        id: 1,
│        action: { type: "BLOCK" },
│        condition: {
│          urlFilter: "*",
│          excludedInitiatorDomains: whitelist,
│          resourceTypes: ["MAIN_FRAME"]
│        }
│      }]
│    })
│
└─ chrome.alarms.create("endLockdown", { when: endTime })
```

### Network Blocking Mechanism

**Rule ID:** `1` (single dynamic rule, overwritten on each lockdown)

**Blocking Logic:**

-   `urlFilter: "*"` → Matches all URLs
-   `excludedInitiatorDomains: whitelist` → Exempts whitelisted domains
-   `resourceTypes: ["MAIN_FRAME"]` → Blocks only top-level navigation (allows subresources)

**Edge Case:** Empty whitelist (`[]`) results in total blockade (all domains blocked).

**Cleanup Domains:**

```javascript
whitelist.map((domain) => domain.replace(/^https?:\/\//, "").replace(/\/$/, ""));
```

Strips protocol and trailing slash before applying exclusion.

### Timer Expiration Handling

**Dual Check System:**

1. **Service Worker Alarm (Primary):**

    ```javascript
    chrome.alarms.onAlarm.addListener((alarm) => {
        if (alarm.name === "endLockdown") {
            stopLockdown();
        }
    });
    ```

2. **Periodic Verification (Backup):**
    ```javascript
    chrome.alarms.create("checkTimer", { periodInMinutes: 1 });
    chrome.alarms.onAlarm.addListener((alarm) => {
        if (alarm.name === "checkTimer") {
            checkTimer(); // Compares Date.now() >= endTime
        }
    });
    ```

**Rationale:** Service Worker may be suspended. Periodic check ensures eventual cleanup.

---

## UI Component Mapping

### Component Hierarchy

```
App.tsx (Root)
├─ WhitelistManager.tsx     [if !isActive]
├─ TimerControl.tsx         [if !isActive]
└─ KillSwitch.tsx           [if isActive]
```

### App.tsx

**State:**

```typescript
whitelist: string[]
isActive: boolean
remainingTime: number        // Computed from endTime
killSwitchUuid: string
```

**Effects:**

-   `useEffect(() => { loadState(); setInterval(loadState, 1000) })` → Polls storage every 1s
-   `loadState()` reads `chrome.storage.local` and updates React state

**Responsibilities:**

-   Orchestrates conditional rendering based on `isActive`
-   Bridges Popup UI to Service Worker via `chrome.runtime.sendMessage`
-   Calculates `remainingTime` as `Math.max(0, Math.floor((endTime - Date.now()) / 1000))`

### WhitelistManager.tsx

**Props:** `{ whitelist: string[], onUpdate: (list: string[]) => void }`

**Responsibilities:**

-   CRUD operations on whitelist array
-   Persists changes: `chrome.storage.local.set({ whitelist: newWhitelist })`
-   Fetches favicon via `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
-   Fallback icon: Base64-encoded SVG placeholder

**Key Behavior:**

-   `Enter` key triggers add
-   Remove button uses array filter by index
-   Scroll container: `max-h-64 overflow-y-auto`

### TimerControl.tsx

**Props:** `{ onStart: (minutes: number) => void }`

**Presets:**

```javascript
[
    { value: 15, label: "15 min" },
    { value: 30, label: "30 min" },
    { value: 60, label: "1 hour" },
    { value: 120, label: "2 hours" },
];
```

**Responsibilities:**

-   Render preset buttons (grid 2x2)
-   Custom input field (type="number", min="1")
-   Call `onStart(minutes)` which triggers `START_LOCKDOWN` message

### KillSwitch.tsx

**Props:** `{ remainingTime: number, uuid: string, onStop: () => void }`

**State:**

```typescript
inputValue: string; // User's progressive input
showUuid: boolean; // Toggle visibility
initialTime: number; // Captured on mount for progress calculation
```

**Responsibilities:**

-   Display countdown via `formatTime(remainingTime)`
-   Progress bar: `(initialTime - remainingTime) / initialTime * 100`
-   UUID validation: See section below
-   Input progress bar: `inputValue.length / uuid.length * 100`

---

## UUID Validation Logic

### Character-by-Character Enforcement

**Location:** `KillSwitch.tsx::handleInputChange()`

```typescript
const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (value.length <= uuid.length) {
        const isValid = uuid.startsWith(value);
        if (isValid) {
            setInputValue(value);

            if (value === uuid) {
                onStop(); // Triggers STOP_LOCKDOWN message
            }
        }
    }
};
```

**Mechanism:**

1. User types character → React synthetic event fires
2. Extract `value` from input
3. **Prefix Match Check:** `uuid.startsWith(value)`
    - ✅ If true: Update state (character accepted)
    - ❌ If false: Reject input (no state update, input appears unchanged)
4. **Complete Match Check:** `value === uuid`
    - If true: Call `onStop()` → Send `STOP_LOCKDOWN` message

**Security Properties:**

-   No client-side bypass (UUID generated server-side in Service Worker)
-   Deletion is allowed (backspace works)
-   Paste is validated character-by-character (partial pastes fail unless exact prefix)
-   Input field is `autoComplete="off"` and `spellCheck="false"`

**UX Feedback:**

-   Red progress bar fills as typing advances: `(inputValue.length / uuid.length) * 100%`
-   Visual counter: `{inputValue.length}/{uuid.length}`
-   Show/hide toggle with eye icon

### UUID Generation

**Location:** `background.ts::startLockdown()`

```javascript
import { v4 as uuidv4 } from "uuid";

const uuid = uuidv4(); // e.g., "550e8400-e29b-41d4-a716-446655440000"
```

**Format:** UUIDv4 (36 characters: 32 hex + 4 hyphens)

**Storage:** Written to `chrome.storage.local.killSwitchUuid` → Read by Popup → Passed to `KillSwitch` component

---

## Technical Constraints

### Manifest V3 Limitations

-   Service Worker lifecycle: Can be suspended after 30s inactivity
-   Max 5000 dynamic rules (extension uses 1)
-   `declarativeNetRequest` requires `host_permissions: ["<all_urls>"]`

### Polling Strategy

-   Popup polls storage every 1s (not event-driven)
-   Service Worker uses alarms for timer checks (1 minute interval)
-   No WebSocket or long-lived connections

### Race Conditions

-   **Scenario:** User closes Popup mid-lockdown
-   **Mitigation:** State persists in `chrome.storage.local`; lockdown continues
-   **Scenario:** User opens multiple Popup instances
-   **Mitigation:** All instances poll same storage; last write wins (non-atomic)

### Failure Modes

-   **Service Worker crash:** `checkTimer` alarm re-checks every minute
-   **Storage quota exceeded:** Unlikely (whitelist size typically <1KB)
-   **Network blocking fails:** Rule application is synchronous; failure throws exception (uncaught in current implementation)

---

## Build Artifacts

**Output Directory:** `dist/`

```
dist/
├── manifest.json           (Copied from root)
├── rules.json              (Empty array, unused)
├── background.js           (Service Worker bundle)
├── index.html              (Popup entry)
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── assets/
    ├── popup-[hash].js     (React bundle)
    └── popup-[hash].css    (Tailwind CSS)
```

**Critical Files:**

-   `manifest.json::permissions`: `["storage", "declarativeNetRequest", "declarativeNetRequestFeedback", "alarms"]`
-   `manifest.json::host_permissions`: `["<all_urls>"]`
-   `manifest.json::background.service_worker`: `"background.js"`

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  Popup (React SPA)                                          │
│  ┌────────────────────────────────────────────────────┐    │
│  │ App.tsx                                             │    │
│  │  ├─ useEffect: setInterval(loadState, 1000)        │    │
│  │  ├─ loadState() → chrome.storage.local.get()       │◄───┼──┐
│  │  │   ├─ setWhitelist(data.whitelist)               │    │  │
│  │  │   ├─ setIsActive(data.isActive)                 │    │  │
│  │  │   ├─ setKillSwitchUuid(data.killSwitchUuid)     │    │  │
│  │  │   └─ setRemainingTime(calc)                     │    │  │
│  │  │                                                  │    │  │
│  │  └─ Conditional Render:                            │    │  │
│  │      ├─ !isActive → WhitelistManager + TimerControl│    │  │
│  │      └─  isActive → KillSwitch                     │    │  │
│  └────────────────────────────────────────────────────┘    │  │
│                                                             │  │
│  User Actions:                                              │  │
│   ├─ Add/Remove site → chrome.storage.local.set()     ─────┼──┤
│   ├─ Start timer → chrome.runtime.sendMessage()       ─────┼──┤
│   └─ Complete UUID → chrome.runtime.sendMessage()     ─────┼──┤
└─────────────────────────────────────────────────────────────┘  │
                                                                  │
┌─────────────────────────────────────────────────────────────┐  │
│  Service Worker (background.ts)                             │  │
│  ┌────────────────────────────────────────────────────┐    │  │
│  │ chrome.runtime.onMessage.addListener()             │◄───┼──┘
│  │  ├─ START_LOCKDOWN                                 │    │
│  │  │   ├─ Generate uuid = uuidv4()                   │    │
│  │  │   ├─ chrome.storage.local.set({                 │────┼──┐
│  │  │   │     isActive: true,                         │    │  │
│  │  │   │     endTime: timestamp,                     │    │  │
│  │  │   │     killSwitchUuid: uuid,                   │    │  │
│  │  │   │     whitelist: [...] })                     │    │  │
│  │  │   ├─ updateBlockingRules(whitelist)             │    │  │
│  │  │   │    └─ chrome.declarativeNetRequest          │    │  │
│  │  │   │         .updateDynamicRules({               │    │  │
│  │  │   │           addRules: [{ id: 1, ... }]        │    │  │
│  │  │   │         })                                  │    │  │
│  │  │   └─ chrome.alarms.create("endLockdown")        │    │  │
│  │  │                                                  │    │  │
│  │  └─ STOP_LOCKDOWN                                  │    │  │
│  │      ├─ chrome.storage.local.set({                 │────┼──┘
│  │      │     isActive: false,                        │    │
│  │      │     endTime: null,                          │    │
│  │      │     killSwitchUuid: "" })                   │    │
│  │      ├─ chrome.declarativeNetRequest               │    │
│  │      │    .updateDynamicRules({                    │    │
│  │      │      removeRuleIds: [1] })                  │    │
│  │      └─ chrome.alarms.clear("endLockdown")         │    │
│  │                                                     │    │
│  │ chrome.alarms.onAlarm.addListener()                │    │
│  │  ├─ "endLockdown" → stopLockdown()                 │    │
│  │  └─ "checkTimer" → checkTimer()                    │    │
│  │       └─ if (Date.now() >= endTime) stopLockdown() │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │ Chrome Network  │
                  │ Layer           │
                  │ (Blocks URLs    │
                  │  not in         │
                  │  whitelist)     │
                  └─────────────────┘
```

---

## Performance Characteristics

**Popup Rendering:**

-   Initial mount: ~50ms (React hydration + storage read)
-   Re-render frequency: 1000ms (polling interval)
-   Component count: 4 (App + 3 conditional children)

**Service Worker:**

-   Message handling: <5ms (synchronous storage write)
-   Rule update latency: <10ms (declarativeNetRequest is synchronous)
-   Alarm resolution: ±5s (Chrome alarm imprecision)

**Storage Size:**

-   Typical payload: ~200-500 bytes (whitelist of 5-10 domains)
-   Max theoretical: ~10MB (chrome.storage.local quota)

---

## Known Issues

1. **Whitelist Domain Format:** No validation; accepts arbitrary strings
2. **No Encryption:** UUID stored in plaintext in local storage
3. **No Rate Limiting:** User can spam START/STOP messages
4. **Favicon Caching:** No cache invalidation; stale favicons persist
5. **Alarm Drift:** Service Worker alarms may drift up to ±5 seconds
6. **No Logging:** No telemetry or error tracking
7. **Single Rule Slot:** Cannot have multiple concurrent lockdowns with different whitelists

---

## Extension Points

**Future Enhancements:**

-   Schedule-based lockdowns (recurring timers)
-   Per-site time limits (not just whitelist/blacklist)
-   Lockdown history tracking
-   Password protection instead of UUID
-   Sync across devices via `chrome.storage.sync`
-   Context menu for quick site whitelisting
-   Notification on lockdown expiration
