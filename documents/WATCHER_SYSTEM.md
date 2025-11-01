# IP Watcher System

Complete guide to the automated IP monitoring and DNS update system.

## Overview

The IP Watcher system automatically monitors your server's IP address and updates DNS records when changes are detected. It runs continuously in the background using a cron scheduler and can optionally auto-update DNS records and send notifications.

## Features

- **Automated Monitoring**: Continuous background checks at configurable intervals (1-1440 minutes)
- **IP Change Detection**: Monitors both IPv4 (A records) and IPv6 (AAAA records)
- **Auto-Update DNS**: Optionally updates Cloudflare DNS records automatically when IP changes
- **Notifications**: Discord webhook notifications for IP changes and mismatches
- **Status Tracking**: Real-time status monitoring (OK, Mismatch, Error)
- **Manual Triggers**: Admin can trigger immediate checks
- **Startup Checks**: Automatic check on server restart
- **Audit Logging**: All status changes are logged

## Configuration

### Watcher Settings

Access via **Admin → Watcher Settings**:

| Setting | Description | Default | Range |
|---------|-------------|---------|-------|
| **Check Interval** | How often to check IPs | 5 minutes | 1-1440 minutes |
| **Auto Update** | Automatically update DNS on mismatch | Disabled | On/Off |
| **Notify on Mismatch** | Send notifications when IP doesn't match | Enabled | On/Off |

### Creating a Watcher

1. Navigate to **Watcher** page
2. Click **Add Watcher**
3. Fill in details:
   - **Record Name**: Full domain name (e.g., `example.com`)
   - **Record Type**: A (IPv4) or AAAA (IPv6)
   - **Zone**: Select from your configured zones
4. Click **Create Watcher**

The watcher will be enabled by default and included in the next scheduled check.

## How It Works

### Background Scheduler

The watcher scheduler uses `node-cron` to run checks at configured intervals:

```
┌─────────────────────────────────────────────┐
│     Server Starts (instrumentation.ts)      │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │   Start Watcher Scheduler              │ │
│  │   - Read settings from database        │ │
│  │   - Convert interval to cron expression│ │
│  │   - Schedule background checks         │ │
│  │   - Run immediate check                │ │
│  └────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│     Every X Minutes (cron trigger)          │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │   Run Background Check                 │ │
│  │   1. Fetch server's current IP         │ │
│  │   2. Fetch all DNS records             │ │
│  │   3. For each enabled watcher:         │ │
│  │      - Compare IPs                     │ │
│  │      - Update status                   │ │
│  │      - Auto-update DNS if needed       │ │
│  │      - Send notifications              │ │
│  │      - Log status changes              │ │
│  └────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### IP Check Process

For each enabled watcher:

1. **Fetch Current IP**: Get server's current IP from `/api/ip`
2. **Fetch DNS Record**: Get current DNS record from Cloudflare
3. **Compare**: Check if DNS IP matches server IP
4. **Update Status**:
   - **OK**: IPs match
   - **Mismatch**: IPs don't match
   - **Error**: DNS record not found or API error
5. **Auto-Update** (if enabled and mismatch):
   - Update DNS record via Cloudflare API
   - Set status to OK
   - Send auto-update notification
6. **Notify** (if mismatch and notifications enabled):
   - Send Discord webhook with mismatch details
7. **Audit Log** (only on status change):
   - Create audit log entry with details

## Status Types

| Status | Meaning | Color | Action |
|--------|---------|-------|--------|
| **OK** | DNS IP matches server IP | Green | None needed |
| **Mismatch** | DNS IP differs from server IP | Yellow | Update DNS or enable auto-update |
| **Error** | DNS record not found or API error | Red | Check DNS record exists and API token is valid |

## Notifications

### Discord Webhook

Configure Discord notifications via **Admin → Notifications**:

1. Create a Discord webhook in your server
2. Copy the webhook URL
3. Paste in **Discord Webhook URL** field
4. Enable **Watcher IP Update (Auto)** and/or **Watcher IP Update (Manual)**
5. Save settings

### Notification Types

**Auto IP Update** (when auto-update fixes mismatch):
```
🔄 DNS IP Updated Automatically
Domain: example.com
Record Type: A
Old IP: 192.168.1.1
New IP: 192.168.1.2
Time: 2025-01-31 10:30:00
```

**Manual IP Update Required** (when mismatch detected, auto-update disabled):
```
⚠️ DNS IP Mismatch Detected
Domain: example.com
Record Type: A
Current DNS IP: 192.168.1.1
Expected Server IP: 192.168.1.2
Time: 2025-01-31 10:30:00
```

## Manual Operations

### Trigger Immediate Check

Via Admin Panel:
1. Navigate to **Admin → Watcher Settings**
2. Click **Run Check Now**

Via API:
```bash
curl -X POST http://localhost:3000/api/admin/watcher-scheduler \
  -H "Content-Type: application/json" \
  -d '{"action": "check"}'
```

### Restart Scheduler

When you update check interval, the scheduler automatically restarts. You can also manually restart:

Via Admin Panel:
1. Navigate to **Admin → Watcher Settings**
2. Click **Restart Scheduler**

Via API:
```bash
curl -X POST http://localhost:3000/api/admin/watcher-scheduler \
  -H "Content-Type: application/json" \
  -d '{"action": "restart"}'
```

### View Scheduler Status

Via API:
```bash
curl http://localhost:3000/api/admin/watcher-scheduler
```

Response:
```json
{
  "success": true,
  "data": {
    "running": true,
    "interval": 5
  }
}
```

## Advanced Configuration

### Cron Expression

The scheduler converts minute intervals to cron expressions:

| Interval | Cron Expression | Meaning |
|----------|-----------------|---------|
| 5 minutes | `*/5 * * * *` | Every 5 minutes |
| 15 minutes | `*/15 * * * *` | Every 15 minutes |
| 30 minutes | `*/30 * * * *` | Every 30 minutes |
| 60 minutes | `*/60 * * * *` | Every hour |
| 7 minutes | `0,7,14,21,28,35,42,49,56 * * * *` | Minutes 0, 7, 14, etc. |

### Performance Tuning

**Check Interval Recommendations**:
- **Dynamic IP (Home/Office)**: 5-15 minutes
- **VPS with stable IP**: 30-60 minutes
- **Testing/Development**: 1-5 minutes

**Resource Usage**:
- Each check makes 2 API calls (server IP + DNS records)
- Cloudflare API has rate limits (typically 1200 requests/5 min)
- With 10 watchers and 5-min interval: ~12 requests/hour

## Troubleshooting

### Watcher Shows "Error"

**Possible Causes**:
1. DNS record doesn't exist in Cloudflare
2. Record name or type mismatch
3. Zone API token invalid
4. Cloudflare API error

**Solutions**:
1. Verify DNS record exists in Cloudflare dashboard
2. Check watcher configuration matches DNS record exactly
3. Test API token in Admin → Zones
4. Check audit logs for detailed error message

### Auto-Update Not Working

**Possible Causes**:
1. Auto-update disabled in settings
2. API token doesn't have edit permissions
3. DNS record is proxied and can't be updated

**Solutions**:
1. Enable auto-update in Admin → Watcher Settings
2. Ensure API token has "Zone:DNS:Edit" permission
3. Check Cloudflare for record proxy status

### IP Check Not Running

**Possible Causes**:
1. Scheduler not started (server restart issue)
2. Check interval misconfigured
3. Watcher disabled

**Solutions**:
1. Check scheduler status via API
2. Restart scheduler via admin panel
3. Ensure watcher is enabled in Watcher page

### Too Many Notifications

**Possible Causes**:
1. IP changing frequently
2. Check interval too short
3. DNS propagation delay

**Solutions**:
1. Investigate why IP is unstable
2. Increase check interval
3. Enable auto-update to fix mismatches immediately

## Best Practices

1. **Start with Manual**: Test watchers with auto-update disabled first
2. **One Record Per Domain**: Create separate watchers for A and AAAA records
3. **Test Notifications**: Send a test notification before enabling for all events
4. **Monitor Audit Logs**: Check Admin → Activity Logs for status changes
5. **Use Appropriate Intervals**: Don't check more often than needed
6. **Backup DNS Records**: Keep a backup before enabling auto-update

## API Reference

### Check Watcher Status

```
GET /api/watchers
```

Response includes all watchers with current status:
```json
{
  "success": true,
  "data": {
    "watchers": [
      {
        "id": "watcher123",
        "recordName": "example.com",
        "recordType": "A",
        "zoneName": "example.com",
        "enabled": true,
        "status": "ok",
        "lastChecked": "2025-01-31T10:30:00.000Z",
        "currentIP": "192.168.1.2",
        "expectedIP": "192.168.1.2"
      }
    ]
  }
}
```

### Trigger Manual Check

```
POST /api/admin/watcher-scheduler
Content-Type: application/json

{
  "action": "check"
}
```

### Update Watcher Settings

```
PATCH /api/admin/watcher-settings
Content-Type: application/json

{
  "checkIntervalMinutes": 10,
  "autoUpdateEnabled": true,
  "notifyOnMismatch": true
}
```

## Security Considerations

- Watcher checks run without user authentication (background process)
- Manual trigger requires admin authentication
- API tokens are encrypted in database (AES-256-GCM)
- Audit logs track all watcher operations
- Status changes are logged with timestamps and details
- IP addresses are normalized (IPv4-mapped IPv6 → IPv4)

## Monitoring

View watcher activity in **Admin → Activity Logs**:

Filter by:
- **Action**: `watcher.check.triggered`
- **Resource**: `watcher`
- **Date Range**: Last 24 hours

Check for:
- Frequent status changes (indicates IP instability)
- Error statuses (indicates configuration issues)
- Auto-update successes (confirms auto-update working)
