import { downloadProfileImage } from '../../../../utils/download-profile-image'

export default {
  async beforeCreate(event: any) {
    const { data } = event.params

    // If profile_photo_url is a Google URL, download it
    if (data.profile_photo_url && data.profile_photo_url.startsWith('https://')) {
      console.log('Downloading profile image from Google...')
      const localPath = await downloadProfileImage(data.profile_photo_url, data.user)

      if (localPath) {
        data.profile_photo_url = localPath
        console.log(`Profile image downloaded to: ${localPath}`)
      }
    }
  },

  async beforeUpdate(event: any) {
    const { data } = event.params

    // If profile_photo_url is being updated with a Google URL, download it
    if (data.profile_photo_url && data.profile_photo_url.startsWith('https://')) {
      // Get the user ID from the existing profile
      const profileId = event.params.where.id
      const existing = await strapi.entityService.findOne('api::user-profile.user-profile', profileId, {
        populate: ['user'],
      })

      if (existing?.user?.id) {
        console.log('Downloading updated profile image from Google...')
        const localPath = await downloadProfileImage(data.profile_photo_url, existing.user.id)

        if (localPath) {
          data.profile_photo_url = localPath
          console.log(`Profile image downloaded to: ${localPath}`)
        }
      }
    }
  },
}
