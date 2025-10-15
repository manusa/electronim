# Tab Notification Context Menu Feature

This feature adds a context menu option to enable or disable notifications for specific tabs.

## How it works

1. **Right-click on any tab** to open the context menu
2. **Notification menu options** appear based on the current state:
   - If notifications are enabled for the tab: "Disable notifications"
   - If notifications are disabled for the tab: "Enable notifications"
   - If notifications are disabled globally: No notification menu (good UX)

## Implementation Details

### Files Modified

1. **`src/constants/index.js`** - Added `toggleTabNotifications` event
2. **`src/chrome-tabs/index.js`** - Modified context menu to include notification toggle
3. **`src/main/index.js`** - Added event handler for toggling tab notifications
4. **`src/chrome-tabs/__tests__/index.test.js`** - Added comprehensive tests

### Key Features

- **Smart UX**: Only shows notification options when global notifications are enabled
- **Dynamic labels**: Shows "Enable" or "Disable" based on current state
- **Real-time updates**: Notification icon updates immediately after toggle
- **Proper separation**: Uses separators to group related menu items

### Code Flow

1. User right-clicks on tab
2. Context menu checks current notification settings
3. If global notifications are enabled, shows appropriate toggle option
4. When clicked, emits `toggleTabNotifications` event with tab ID
5. Main process updates settings and refreshes tab container
6. Tab notification icon updates to reflect new state

### Testing

The feature includes comprehensive tests covering:
- Menu shows "Disable notifications" when notifications are enabled
- Menu shows "Enable notifications" when notifications are disabled  
- Menu hides notification options when global notifications are disabled
- Clicking the menu item emits the correct event
- Event handler properly toggles the notification setting

Run tests with:
```bash
npm test -- src/chrome-tabs/__tests__/index.test.js
```

### Usage Example

1. Start ElectronIM with some tabs configured
2. Right-click on any tab
3. Select "Disable notifications" to mute that specific tab
4. Notice the notification icon (🔕) appears on the tab
5. Right-click again and select "Enable notifications" to unmute
6. The notification icon disappears

This provides granular control over notifications without needing to open the settings dialog.