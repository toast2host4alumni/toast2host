import fs from 'fs'
import path from 'path'

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
      .replace(/{{TRAVEL_DATE_FROM}}/g, data.travelDateFrom || 'Flexible')
      .replace(/{{TRAVEL_DATE_TO}}/g, data.travelDateTo || 'Flexible')
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
      from: process.env.EMAIL_FROM || 'noreply@toast2host.net',
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
      .replace(/{{TRAVEL_DATE_FROM}}/g, data.travelDateFrom || 'Flexible')
      .replace(/{{TRAVEL_DATE_TO}}/g, data.travelDateTo || 'Flexible')
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
      from: process.env.EMAIL_FROM || 'noreply@toast2host.net',
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
