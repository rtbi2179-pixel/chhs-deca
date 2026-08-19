export const PROFILE_AVATAR_OPTIONS = [
  { key: 'deca-compass', label: 'Compass', category: 'DECA', src: '/manus-storage/avatar-deca-compass_2d7ab75d.png' },
  { key: 'deca-trophy', label: 'Trophy', category: 'DECA', src: '/manus-storage/avatar-deca-trophy_16c8f9da.png' },
  { key: 'deca-presentation', label: 'Presentation', category: 'DECA', src: '/manus-storage/avatar-deca-presentation_72211727.png' },
  { key: 'mountain', label: 'Mountain', category: 'General', src: '/manus-storage/avatar-general-mountain_0efc6160.png' },
  { key: 'orbit', label: 'Orbit', category: 'General', src: '/manus-storage/avatar-general-orbit_4af830db.png' },
  { key: 'botanical', label: 'Botanical', category: 'General', src: '/manus-storage/avatar-general-botanical_6d3d71fc.png' },
] as const

export const PROFILE_BANNER_OPTIONS = [
  { key: 'deca-strategy', label: 'Strategy Desk', category: 'DECA', src: '/manus-storage/banner-deca-strategy_62b1743c.png' },
  { key: 'deca-stage', label: 'Competition Stage', category: 'DECA', src: '/manus-storage/banner-deca-stage_087ad3d3.png' },
  { key: 'aurora', label: 'Aurora', category: 'General', src: '/manus-storage/banner-general-aurora_57ef52df.png' },
  { key: 'city', label: 'Night City', category: 'General', src: '/manus-storage/banner-general-city_6c1f68cf.png' },
  { key: 'studio', label: 'Glass Studio', category: 'General', src: '/manus-storage/banner-general-studio_570de310.png' },
] as const

export type ProfileAvatarKey = (typeof PROFILE_AVATAR_OPTIONS)[number]['key']
export type ProfileBannerKey = (typeof PROFILE_BANNER_OPTIONS)[number]['key']

export const DEFAULT_PROFILE_AVATAR: ProfileAvatarKey = 'deca-compass'
export const DEFAULT_PROFILE_BANNER: ProfileBannerKey = 'deca-strategy'

export function getProfileAvatar(key?: string | null) {
  return PROFILE_AVATAR_OPTIONS.find((option) => option.key === key) ?? PROFILE_AVATAR_OPTIONS[0]
}

export function getProfileBanner(key?: string | null) {
  return PROFILE_BANNER_OPTIONS.find((option) => option.key === key) ?? PROFILE_BANNER_OPTIONS[0]
}
