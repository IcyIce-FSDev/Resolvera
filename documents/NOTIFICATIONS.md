# Notification System

Complete guide to the webhook notification system for DNS events and watcher updates.

## Overview

Resolvera includes a flexible notification system that sends webhook notifications for various DNS and watcher events. Currently supports Discord webhooks with plans for email, Slack, and Telegram integration.

## Features

- **Discord Webhooks**: Rich embedded messages with color-coded severity
- **Event-Based**: Configurable triggers for different event types
- **DNS Events**: Notifications for record and zone changes
- **Watcher Events**: IP update notifications (auto and manual)
- **User Tracking**: Shows who performed each action
- **Timestamp**: All notifications include exact time
- **Retry Logic**: Automatic retry on temporary failures

## Supported Platforms

### Discord (Current)
- ✅ Webhook integration
- ✅ Rich embeds with colors
- ✅ Timestamp support
- ✅ User mentions (optional)

### Planned Integrations
- ⏳ Email (SMTP)
- ⏳ Slack webhooks
- ⏳ Telegram bots
- ⏳ Microsoft Teams
- ⏳ Custom webhooks

## Configuration

### Discord Webhook Setup

**1. Create Discord Webhook**:
1. Open Discord server settings
2. Go to **Integrations → Webhooks**
3. Click **New Webhook**
4. Name it "Resolvera" (or your preference)
5. Select the channel for notifications
6. Copy the webhook URL

**2. Configure in Resolvera**:
1. Navigate to **Admin → Notifications**
2. Enable **Discord Webhook**
3. Paste webhook URL in **Discord Webhook URL** field
4. Select which events to enable:
   - DNS Record Add
   - DNS Record Edit
   - DNS Record Delete
   - Watcher Add
   - Watcher Edit
   - Watcher Delete
   - Watcher IP Update (Manual)
   - Watcher IP Update (Auto)
5. Click **Save Settings**

### Testing Notifications

After configuration:
1. Click **Send Test Notification**
2. Check your Discord channel
3. Verify the message appears correctly

If test fails:
- Verify webhook URL is correct
- Check webhook hasn't been deleted in Discord
- Ensure channel permissions allow webhook posts

## Event Types

### DNS Record Events

**DNS Record Add** (`dns_record_add`):
```
📝 DNS Record Added
Record: example.com
Type: A
Value: 192.168.1.1
TTL: 3600
User: John Doe
Time: 2025-01-31 10:30:00
```

**DNS Record Edit** (`dns_record_edit`):
```
✏️ DNS Record Updated
Record: example.com
Type: A
Old Value: 192.168.1.1
New Value: 192.168.1.2
TTL: 3600
User: John Doe
Time: 2025-01-31 10:30:00
```

**DNS Record Delete** (`dns_record_delete`):
```
🗑️ DNS Record Deleted
Record: example.com
Type: A
Value: 192.168.1.1
User: John Doe
Time: 2025-01-31 10:30:00
```

### Watcher Events

**Watcher Add** (`watcher_add`):
```
👁️ Watcher Created
Domain: example.com
Record Type: A
Zone: example.com
User: John Doe
Time: 2025-01-31 10:30:00
```

**Watcher Edit** (`watcher_edit`):
```
✏️ Watcher Updated
Domain: example.com
Record Type: A
Status: Enabled
User: John Doe
Time: 2025-01-31 10:30:00
```

**Watcher Delete** (`watcher_delete`):
```
🗑️ Watcher Deleted
Domain: example.com
Record Type: A
User: John Doe
Time: 2025-01-31 10:30:00
```

**Watcher IP Update (Manual)** (`watcher_ip_update_manual`):
```
⚠️ DNS IP Mismatch Detected
Domain: example.com
Record Type: A
Current DNS IP: 192.168.1.1
Expected Server IP: 192.168.1.2
Action Required: Update DNS record manually or enable auto-update
Time: 2025-01-31 10:30:00
```

**Watcher IP Update (Auto)** (`watcher_ip_update_auto`):
```
🔄 DNS IP Updated Automatically
Domain: example.com
Record Type: A
Old IP: 192.168.1.1
New IP: 192.168.1.2
Time: 2025-01-31 10:30:00
```

## Notification Colors

Discord embeds use color coding for visual distinction:

| Event Type | Color | Hex Code |
|------------|-------|----------|
| DNS Record Add | Green | `#00FF00` |
| DNS Record Edit | Yellow | `#FFFF00` |
| DNS Record Delete | Red | `#FF0000` |
| Watcher Add | Blue | `#0000FF` |
| Watcher Edit | Yellow | `#FFFF00` |
| Watcher Delete | Red | `#FF0000` |
| IP Update Manual | Orange | `#FFA500` |
| IP Update Auto | Green | `#00FF00` |

## Use Cases

### IP Change Monitoring

**Scenario**: Home server with dynamic IP

**Setup**:
1. Enable **Watcher IP Update (Auto)**
2. Enable **Watcher IP Update (Manual)**
3. Enable auto-update in watcher settings

**Result**:
- Receive notification when IP changes
- DNS automatically updated
- Know exactly when changes occur

### DNS Change Auditing

**Scenario**: Multiple admins managing DNS

**Setup**:
1. Enable all DNS record events
2. Monitor Discord channel

**Result**:
- See who makes DNS changes
- Track all modifications
- Quick review of recent changes

### Security Monitoring

**Scenario**: Unauthorized access detection

**Setup**:
1. Enable all notification types
2. Monitor for unexpected changes

**Result**:
- Immediate alert on any DNS change
- Know who performed each action
- Quick response to unauthorized modifications

## Advanced Configuration

### Rate Limiting

To prevent notification spam:
- Watcher checks: Only notify on status change
- Batch operations: One notification per action (not bulk)
- Manual trigger: Immediate notification

### Retry Logic

Notification sending includes retry logic:
1. Initial attempt
2. Wait 2 seconds
3. Retry if failed
4. Log error if still failing

### Error Handling

If webhook fails:
- Error logged to console
- Operation continues (doesn't block)
- Check logs for webhook errors

## Troubleshooting

### Notifications Not Received

**Possible Causes**:
1. Webhook URL incorrect
2. Webhook deleted in Discord
3. Channel permissions issue
4. Event type not enabled

**Solutions**:
1. Copy fresh webhook URL from Discord
2. Verify webhook exists in Discord
3. Check webhook has permission to post
4. Enable event in notification settings

### Duplicate Notifications

**Possible Causes**:
1. Multiple watchers for same record
2. Rapid status changes

**Solutions**:
1. Review watcher configuration
2. Increase check interval
3. Enable auto-update to reduce manual notifications

### Test Notification Works, Real Events Don't

**Possible Causes**:
1. Event types not enabled
2. Events not triggering (no changes made)

**Solutions**:
1. Check each event type is enabled
2. Make a test change (add/edit DNS record)
3. Check audit logs to verify events occurred

### Formatting Issues

**Possible Causes**:
1. Discord API changes
2. Special characters in data

**Solutions**:
1. Update Resolvera to latest version
2. Check special characters are escaped
3. Report issue to maintainers

## API Reference

### Send Notification (Internal)

```typescript
import { sendNotification } from '@/lib/services/notification';

await sendNotification({
  type: 'dns_record_add',
  data: {
    recordName: 'example.com',
    recordType: 'A',
    recordValue: '192.168.1.1',
    ttl: 3600,
    user: 'John Doe',
    timestamp: new Date().toISOString(),
  },
});
```

### Update Notification Settings (API)

```bash
curl -X PUT http://localhost:3000/api/admin/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "discordWebhookEnabled": true,
    "discordWebhookUrl": "https://discord.com/api/webhooks/...",
    "dnsRecordAdd": true,
    "dnsRecordEdit": true,
    "dnsRecordDelete": false,
    "watcherAdd": true,
    "watcherEdit": false,
    "watcherDelete": true,
    "watcherIpUpdateManual": true,
    "watcherIpUpdateAuto": true
  }'
```

## Best Practices

### Event Selection

**Recommended for Production**:
- ✅ Watcher IP Update (Auto) - Know when IPs change
- ✅ Watcher IP Update (Manual) - Know when intervention needed
- ✅ DNS Record Delete - Critical changes
- ⚠️ DNS Record Add - Optional, can be noisy
- ⚠️ DNS Record Edit - Optional, can be noisy
- ⚠️ Watcher Add/Edit/Delete - Optional

**Recommended for Development**:
- ✅ All events - Full visibility during testing

### Channel Organization

**Option 1: Single Channel**
- All notifications in one place
- Simple setup
- Can be noisy

**Option 2: Separate Channels**
- `#dns-changes` - DNS record events
- `#ip-updates` - Watcher IP updates
- `#watcher-admin` - Watcher management
- Organized but requires multiple webhooks

**Option 3: Severity-Based**
- `#critical` - Deletions, IP mismatches
- `#info` - Adds, edits, auto-updates
- Balanced approach

### Webhook Security

- ✅ Keep webhook URL secret
- ✅ Regenerate if exposed
- ✅ Use HTTPS only (built-in)
- ✅ Monitor for unauthorized posts
- ❌ Don't share webhook URL publicly

## Future Enhancements

Planned notification features:

### Email Notifications
- SMTP configuration
- HTML templates
- Attachment support
- Batch digest mode

### Slack Integration
- Slack app integration
- Slash commands
- Interactive buttons
- Thread replies

### Telegram Integration
- Bot API
- Direct messages
- Group notifications
- Inline keyboards

### Advanced Features
- Custom webhook templates
- Conditional notifications
- Rate limiting per channel
- Notification schedules (quiet hours)
- Aggregation (daily summary)

## Security Considerations

### Webhook URLs

- Treat as sensitive credentials
- Store encrypted in database (implemented)
- Never log webhook URLs
- Regenerate if compromised

### Data Privacy

**What's Sent**:
- Event type
- Timestamp
- User name (if applicable)
- Resource details (domain, IP, etc.)

**NOT Sent**:
- Passwords
- API tokens
- Session data
- Full user details

### Network Security

- HTTPS only for webhooks
- Timeout after 10 seconds
- No sensitive data in URLs
- Error messages don't expose internals

## Monitoring

Check notification delivery:

**Via Audit Logs**:
1. Navigate to **Admin → Activity Logs**
2. Search for notification-related actions
3. Check for errors

**Via Discord**:
1. Review message history
2. Verify timestamps match expected events
3. Check for missing notifications

**Via Console Logs**:
```bash
# View notification errors
docker logs resolvera-app | grep "Notification error"
```
