import { find as findTimeZones } from 'geo-tz'
import { sendGuestStayReminderEmail, sendHostStayReminderEmail, EMAIL_LOGO_URL } from '../utils/email-service'

// No timezone is captured anywhere in the app (only lat/lng, from the location
// search field), so we derive the host's local time from their coordinates via
// geo-tz - an offline coordinate->IANA-timezone lookup, no external API call.
// Hosts without saved coordinates fall back to this fixed zone/hour, matching
// the original single-fixed-UTC-hour approach this replaced.
const FALLBACK_TIMEZONE = 'America/New_York'
const REMINDER_LOCAL_HOUR = 9 // send at ~9am in the host's local time

function dayBefore(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

function localDateAndHour(tz: string, at: Date): { dateStr: string; hour: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(at)
  const map: Record<string, string> = {}
  for (const p of parts) map[p.type] = p.value
  return { dateStr: `${map.year}-${map.month}-${map.day}`, hour: Number(map.hour) }
}

function resolveHostTimeZone(lat: unknown, lng: unknown): string {
  if (typeof lat !== 'number' || typeof lng !== 'number') return FALLBACK_TIMEZONE
  try {
    const zones = findTimeZones(lat, lng)
    return zones[0] || FALLBACK_TIMEZONE
  } catch {
    return FALLBACK_TIMEZONE
  }
}

// Runs hourly and, for each confirmed booking not yet reminded, checks whether
// it's currently ~9am in the HOST's local time on the day before their guest
// arrives - so every host gets their reminder around the same local hour
// regardless of which timezone they're in, instead of everyone getting it at
// one fixed UTC hour.
const stayReminderTasks = {
  'send-stay-reminders': {
    task: async ({ strapi }: { strapi: any }) => {
      const now = new Date()
      const todayStr = now.toISOString().slice(0, 10)
      const windowEnd = new Date(now)
      windowEnd.setUTCDate(windowEnd.getUTCDate() + 3)
      const windowEndStr = windowEnd.toISOString().slice(0, 10)

      // Bounded candidate set - the precise per-host-timezone check happens below.
      const connections = await strapi.entityService.findMany('api::connection.connection', {
        filters: {
          status: 'connected',
          reminder_sent: { $ne: true },
          travel_date_from: { $gte: todayStr, $lte: windowEndStr },
        },
        populate: { actor_user: { fields: ['id'] }, target_user: { fields: ['id'] } },
        page: 1,
        pageSize: 200,
      })

      const frontendUrl = process.env.FRONTEND_URL || 'https://app.toast2host.net'
      const connectionsUrl = `${frontendUrl}/connections`

      for (const conn of connections) {
        try {
          if (!conn.travel_date_from) continue
          const guestId = conn.actor_user?.id
          const hostId = conn.target_user?.id
          if (!guestId || !hostId) continue

          const guestProfiles = await strapi.entityService.findMany('api::user-profile.user-profile', {
            filters: { user: guestId },
            populate: { user: { fields: ['id', 'email'] } },
            limit: 1,
          })
          const hostProfiles = await strapi.entityService.findMany('api::user-profile.user-profile', {
            filters: { user: hostId },
            populate: { user: { fields: ['id', 'email'] } },
            limit: 1,
          })
          const guestProfile = guestProfiles[0]
          const hostProfile = hostProfiles[0]
          if (!guestProfile?.user?.email || !hostProfile?.user?.email) continue

          // Is it currently ~9am, host-local time, on the day before arrival?
          const hostTz = resolveHostTimeZone(hostProfile.location_lat, hostProfile.location_lng)
          const { dateStr: hostLocalDate, hour: hostLocalHour } = localDateAndHour(hostTz, now)
          if (hostLocalDate !== dayBefore(conn.travel_date_from) || hostLocalHour !== REMINDER_LOCAL_HOUR) {
            continue
          }

          const guestFullName = [guestProfile.first_name, guestProfile.last_name].filter(Boolean).join(' ') || 'Alumni'
          const hostFullName = [hostProfile.first_name, hostProfile.last_name].filter(Boolean).join(' ') || 'Alumni'

          await sendGuestStayReminderEmail({
            guestEmail: guestProfile.user.email,
            guestFirstName: guestProfile.first_name || 'there',
            hostFullName,
            hostEmail: hostProfile.user.email,
            hostPhone: hostProfile.phone_number || undefined,
            hostLocation: hostProfile.location_text || undefined,
            travelDateFrom: conn.travel_date_from || undefined,
            travelDateTo: conn.travel_date_to || undefined,
            guestCount: conn.guest_count || undefined,
            connectionsUrl,
            logoUrl: EMAIL_LOGO_URL,
          })

          await sendHostStayReminderEmail({
            hostEmail: hostProfile.user.email,
            hostFirstName: hostProfile.first_name || 'there',
            guestFullName,
            guestEmail: guestProfile.user.email,
            guestPhone: guestProfile.phone_number || undefined,
            travelDateFrom: conn.travel_date_from || undefined,
            travelDateTo: conn.travel_date_to || undefined,
            guestCount: conn.guest_count || undefined,
            connectionsUrl,
            logoUrl: EMAIL_LOGO_URL,
          })

          await strapi.entityService.update('api::connection.connection', conn.id, {
            data: { reminder_sent: true },
          })
        } catch (err) {
          strapi.log.error(`Failed to send stay reminder for connection ${conn.id}: ${err}`)
        }
      }
    },
    options: {
      rule: '0 * * * *', // hourly, on the hour
    },
  },
}

export default stayReminderTasks
