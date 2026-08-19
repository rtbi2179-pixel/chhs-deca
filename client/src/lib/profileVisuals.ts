export const PROFILE_AVATAR_OPTIONS = [
  { key: 'deca-compass', label: 'Compass', category: 'DECA', src: '/manus-storage/avatar-deca-compass_3aeeccc6.svg' },
  { key: 'deca-trophy', label: 'Trophy', category: 'DECA', src: '/manus-storage/avatar-deca-trophy_7cb4f6a7.svg' },
  { key: 'deca-presentation', label: 'Presentation', category: 'DECA', src: '/manus-storage/avatar-deca-presentation_14fae3be.svg' },
  { key: 'mountain', label: 'Mountain', category: 'General', src: '/manus-storage/avatar-general-mountain_15ad7bbe.svg' },
  { key: 'orbit', label: 'Orbit', category: 'General', src: '/manus-storage/avatar-general-orbit_40c2872f.svg' },
  { key: 'botanical', label: 'Botanical', category: 'General', src: '/manus-storage/avatar-general-botanical_48eb0761.svg' },
] as const

export const PROFILE_BANNER_OPTIONS = [
  { key: 'deca-strategy', label: 'Strategy Desk', category: 'DECA', src: '/manus-storage/banner-deca-strategy_a87fb044.svg' },
  { key: 'deca-stage', label: 'Competition Stage', category: 'DECA', src: '/manus-storage/banner-deca-stage_18b5c7cc.svg' },
  { key: 'aurora', label: 'Aurora', category: 'General', src: '/manus-storage/banner-general-aurora_1b804bd0.svg' },
  { key: 'city', label: 'Night City', category: 'General', src: '/manus-storage/banner-general-city_63195f44.svg' },
  { key: 'studio', label: 'Glass Studio', category: 'General', src: '/manus-storage/banner-general-studio_e0b00f74.svg' },
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
