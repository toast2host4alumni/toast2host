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
      subject: '[Toast2Host] Connection Request',
      html: htmlContent,
    })

    console.log(`Connection request email sent to ${data.hostEmail}`)
  } catch (error) {
    console.error('Error sending connection request email:', error)
    // Don't throw error - we don't want to fail the connection request if email fails
  }
}
