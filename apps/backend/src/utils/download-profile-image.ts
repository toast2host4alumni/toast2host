import https from 'https'
import http from 'http'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

export async function downloadProfileImage(imageUrl: string, userId: number): Promise<string | null> {
  try {
    // Generate a unique filename using user ID and hash
    const hash = crypto.createHash('md5').update(imageUrl).digest('hex').substring(0, 8)
    const filename = `user-${userId}-${hash}.jpg`
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'profile-photos')
    const filepath = path.join(uploadDir, filename)

    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    // Download the image
    await new Promise<void>((resolve, reject) => {
      const protocol = imageUrl.startsWith('https') ? https : http

      protocol.get(imageUrl, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download image: ${response.statusCode}`))
          return
        }

        const fileStream = fs.createWriteStream(filepath)
        response.pipe(fileStream)

        fileStream.on('finish', () => {
          fileStream.close()
          resolve()
        })

        fileStream.on('error', (err) => {
          fs.unlink(filepath, () => {}) // Delete partial file
          reject(err)
        })
      }).on('error', (err) => {
        reject(err)
      })
    })

    // Return the relative URL path
    return `/uploads/profile-photos/${filename}`
  } catch (error) {
    console.error('Error downloading profile image:', error)
    return null
  }
}
