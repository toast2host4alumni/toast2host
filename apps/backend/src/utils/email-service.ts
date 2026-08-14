import fs from 'fs'
import path from 'path'

// Matches the "When" field format on the search page (formatDateShort in
// SearchPage.tsx) - e.g. "Fri, Aug 14" - so dates read consistently between
// the app and emails.
function formatDateShort(dateStr?: string): string {
  if (!dateStr) return 'Flexible'
  const d = new Date(`${dateStr}T00:00:00`)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

// A bare email address with no display name shows as the raw address in most
// inbox lists (e.g. "bookings@toast2host.net"), which reads as far less
// trustworthy than a named sender - wrapping it as "Name <address>" is what
// makes clients like Gmail show "Toast2Host" in bold instead.
const EMAIL_FROM = `Toast2Host <${process.env.EMAIL_FROM || 'noreply@toast2host.net'}>`

interface ConnectionRequestEmailData {
  hostEmail: string
  hostFirstName: string
  guestFullName: string
  guestFirstName: string
  guestUniversity: string
  guestBatch: string
  guestLinkedIn?: string
  travelDateFrom?: string
  travelDateTo?: string
  guestCount?: number
  connectionsUrl: string
  logoUrl: string
}

interface ConnectionApprovedEmailData {
  guestEmail: string
  guestFirstName: string
  hostFullName: string
  hostEmail: string
  hostUniversity: string
  hostBatch: string
  hostLocation?: string
  travelDateFrom?: string
  travelDateTo?: string
  guestCount?: number
  connectionsUrl: string
  logoUrl: string
}

interface ConnectionUnavailableEmailData {
  guestEmail: string
  guestFirstName: string
  hostFullName: string
  travelDateFrom?: string
  travelDateTo?: string
  searchUrl: string
  logoUrl: string
}

export async function sendConnectionRequestEmail(
  data: ConnectionRequestEmailData
): Promise<void> {
  try {
    // Read the HTML template from src folder (not dist)
    const templatePath = path.join(
      process.cwd(),
      'src',
      'utils',
      'email-templates',
      'connection-request.html'
    )
    let htmlContent = fs.readFileSync(templatePath, 'utf-8')

    // Replace placeholders with actual data
    htmlContent = htmlContent
      .replace(/{{HOST_FIRST_NAME}}/g, data.hostFirstName)
      .replace(/{{GUEST_FULL_NAME}}/g, data.guestFullName)
      .replace(/{{GUEST_FIRST_NAME}}/g, data.guestFirstName)
      .replace(/{{GUEST_UNIVERSITY}}/g, data.guestUniversity)
      .replace(/{{GUEST_BATCH}}/g, data.guestBatch)
      .replace(/{{TRAVEL_DATE_FROM}}/g, formatDateShort(data.travelDateFrom))
      .replace(/{{TRAVEL_DATE_TO}}/g, formatDateShort(data.travelDateTo))
      .replace(/{{GUEST_COUNT}}/g, data.guestCount ? String(data.guestCount) : 'Not specified')
      .replace(/{{CONNECTIONS_URL}}/g, data.connectionsUrl)
      .replace(/{{LOGO_URL}}/g, data.logoUrl)

    // Handle optional LinkedIn URL
    if (data.guestLinkedIn) {
      htmlContent = htmlContent.replace(/{{GUEST_LINKEDIN}}/g, data.guestLinkedIn)
      htmlContent = htmlContent.replace(/{{#if GUEST_LINKEDIN}}/g, '')
      htmlContent = htmlContent.replace(/{{\/if}}/g, '')
    } else {
      // Remove the LinkedIn section if no URL provided
      htmlContent = htmlContent.replace(
        /{{#if GUEST_LINKEDIN}}[\s\S]*?{{\/if}}/g,
        ''
      )
    }

    // Send email using Strapi's email plugin
    await strapi.plugin('email').service('email').send({
      to: data.hostEmail,
      from: EMAIL_FROM,
      replyTo: process.env.EMAIL_REPLY_TO || 'support@toast2host.net',
      subject: '[Toast2Host] Booking Request',
      html: htmlContent,
    })

    console.log(`Connection request email sent to ${data.hostEmail}`)
  } catch (error) {
    console.error('Error sending connection request email:', error)
    // Don't throw error - we don't want to fail the connection request if email fails
  }
}

export async function sendConnectionApprovedEmail(
  data: ConnectionApprovedEmailData
): Promise<void> {
  try {
    // Read the HTML template from src folder (not dist)
    const templatePath = path.join(
      process.cwd(),
      'src',
      'utils',
      'email-templates',
      'connection-approved.html'
    )
    let htmlContent = fs.readFileSync(templatePath, 'utf-8')

    // Replace placeholders with actual data
    htmlContent = htmlContent
      .replace(/{{GUEST_FIRST_NAME}}/g, data.guestFirstName)
      .replace(/{{HOST_FULL_NAME}}/g, data.hostFullName)
      .replace(/{{HOST_EMAIL}}/g, data.hostEmail)
      .replace(/{{HOST_UNIVERSITY}}/g, data.hostUniversity)
      .replace(/{{HOST_BATCH}}/g, data.hostBatch)
      .replace(/{{TRAVEL_DATE_FROM}}/g, formatDateShort(data.travelDateFrom))
      .replace(/{{TRAVEL_DATE_TO}}/g, formatDateShort(data.travelDateTo))
      .replace(/{{GUEST_COUNT}}/g, data.guestCount ? String(data.guestCount) : 'Not specified')
      .replace(/{{CONNECTIONS_URL}}/g, data.connectionsUrl)
      .replace(/{{LOGO_URL}}/g, data.logoUrl)

    // Handle optional location
    if (data.hostLocation) {
      htmlContent = htmlContent.replace(/{{HOST_LOCATION}}/g, data.hostLocation)
      htmlContent = htmlContent.replace(/{{#if HOST_LOCATION}}/g, '')
      htmlContent = htmlContent.replace(/{{\/if}}/g, '')
    } else {
      // Remove the location section if not provided
      htmlContent = htmlContent.replace(
        /{{#if HOST_LOCATION}}[\s\S]*?{{\/if}}/g,
        ''
      )
    }

    // Send email using Strapi's email plugin
    await strapi.plugin('email').service('email').send({
      to: data.guestEmail,
      from: EMAIL_FROM,
      replyTo: process.env.EMAIL_REPLY_TO || 'support@toast2host.net',
      subject: '[Toast2Host] Booking Confirmed',
      html: htmlContent,
    })

    console.log(`Connection approved email sent to ${data.guestEmail}`)
  } catch (error) {
    console.error('Error sending connection approved email:', error)
    // Don't throw error - we don't want to fail the connection approval if email fails
  }
}

export async function sendConnectionUnavailableEmail(
  data: ConnectionUnavailableEmailData
): Promise<void> {
  try {
    // Read the HTML template from src folder (not dist)
    const templatePath = path.join(
      process.cwd(),
      'src',
      'utils',
      'email-templates',
      'connection-unavailable.html'
    )
    let htmlContent = fs.readFileSync(templatePath, 'utf-8')

    htmlContent = htmlContent
      .replace(/{{GUEST_FIRST_NAME}}/g, data.guestFirstName)
      .replace(/{{HOST_FULL_NAME}}/g, data.hostFullName)
      .replace(/{{TRAVEL_DATE_FROM}}/g, formatDateShort(data.travelDateFrom))
      .replace(/{{TRAVEL_DATE_TO}}/g, formatDateShort(data.travelDateTo))
      .replace(/{{SEARCH_URL}}/g, data.searchUrl)
      .replace(/{{LOGO_URL}}/g, data.logoUrl)

    await strapi.plugin('email').service('email').send({
      to: data.guestEmail,
      from: EMAIL_FROM,
      replyTo: process.env.EMAIL_REPLY_TO || 'support@toast2host.net',
      subject: '[Toast2Host] Your booking request is no longer available',
      html: htmlContent,
    })

    console.log(`Connection unavailable email sent to ${data.guestEmail}`)
  } catch (error) {
    console.error('Error sending connection unavailable email:', error)
    // Don't throw error - we don't want to fail the connection approval if email fails
  }
}

interface BookingCancelledEmailData {
  recipientEmail: string
  recipientFirstName: string
  cancellerFullName: string
  travelDateFrom?: string
  travelDateTo?: string
  bookingsUrl: string
  logoUrl: string
}

export async function sendBookingCancelledEmail(
  data: BookingCancelledEmailData
): Promise<void> {
  try {
    const templatePath = path.join(
      process.cwd(),
      'src',
      'utils',
      'email-templates',
      'booking-cancelled.html'
    )
    let htmlContent = fs.readFileSync(templatePath, 'utf-8')

    htmlContent = htmlContent
      .replace(/{{RECIPIENT_FIRST_NAME}}/g, data.recipientFirstName)
      .replace(/{{CANCELLER_FULL_NAME}}/g, data.cancellerFullName)
      .replace(/{{TRAVEL_DATE_FROM}}/g, formatDateShort(data.travelDateFrom))
      .replace(/{{TRAVEL_DATE_TO}}/g, formatDateShort(data.travelDateTo))
      .replace(/{{BOOKINGS_URL}}/g, data.bookingsUrl)
      .replace(/{{LOGO_URL}}/g, data.logoUrl)

    await strapi.plugin('email').service('email').send({
      to: data.recipientEmail,
      from: EMAIL_FROM,
      replyTo: process.env.EMAIL_REPLY_TO || 'support@toast2host.net',
      subject: '[Toast2Host] Booking Cancelled',
      html: htmlContent,
    })

    console.log(`Booking cancelled email sent to ${data.recipientEmail}`)
  } catch (error) {
    console.error('Error sending booking cancelled email:', error)
    // Don't throw error - we don't want to fail the cancellation if email fails
  }
}
