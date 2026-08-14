import { downloadProfileImage } from '../../../../utils/download-profile-image'

// `data.user` is a plain numeric ID when our own code creates a profile
// (see extensions/users-permissions/strapi-server.ts and the updateMyProfile
// resolver), but Strapi's admin panel submits relation fields as an object
// (e.g. `{ id }` or `{ connect: [{ id }] }`). Passing that object straight
// into downloadProfileImage() stringified it to "[object Object]" in the
// saved filename, producing a broken profile_photo_url.
function resolveUserId(userField: any): number | undefined {
  if (typeof userField === 'number') return userField
  if (typeof userField === 'string' && userField.trim() && !Number.isNaN(Number(userField))) {
    return Number(userField)
  }
  if (userField && typeof userField === 'object') {
    if ('id' in userField) return resolveUserId(userField.id)
    const relationEntry = userField.connect?.[0] ?? userField.set?.[0]
    if (relationEntry) return resolveUserId(relationEntry)
  }
  return undefined
}

export default {
  async beforeCreate(event: any) {
    const { data } = event.params
    const userId = resolveUserId(data.user)

    // If profile_photo_url is a Google URL, download it
    if (data.profile_photo_url && data.profile_photo_url.startsWith('https://') && userId) {
      console.log('Downloading profile image from Google...')
      const localPath = await downloadProfileImage(data.profile_photo_url, userId)

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
