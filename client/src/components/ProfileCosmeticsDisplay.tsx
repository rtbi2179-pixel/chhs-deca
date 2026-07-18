import { Button } from '@/components/ui/button'
import { useLocation } from 'wouter'

interface Cosmetic {
  cosmetics: {
    id: number
    name: string
    type: 'profile_frame' | 'banner' | 'avatar_effect' | 'title'
    imageUrl: string | null
    rarity: string
  }
  userCosmetics: {
    isEquipped: boolean
  }
}

interface ProfileCosmeticsDisplayProps {
  userCosmetics: Cosmetic[]
}

export function ProfileCosmeticsDisplay({ userCosmetics }: ProfileCosmeticsDisplayProps) {
  const [, setLocation] = useLocation()

  const equippedFrame = userCosmetics.find(
    c => c.userCosmetics?.isEquipped && c.cosmetics?.type === 'profile_frame'
  )

  const equippedBanner = userCosmetics.find(
    c => c.userCosmetics?.isEquipped && c.cosmetics?.type === 'banner'
  )

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Frame */}
        <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
          <h3 className="text-white font-semibold mb-3 font-['Outfit']">Profile Frame</h3>
          <div className="w-full h-24 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
            {equippedFrame?.cosmetics?.imageUrl ? (
              <img
                src={equippedFrame.cosmetics.imageUrl}
                alt="Frame"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white text-sm">No frame equipped</span>
            )}
          </div>
          {equippedFrame && (
            <p className="text-white/70 text-xs mb-3">✓ {equippedFrame.cosmetics?.name}</p>
          )}
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700 text-sm"
            onClick={() => setLocation('/gacha')}
          >
            Customize
          </Button>
        </div>

        {/* Banner */}
        <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
          <h3 className="text-white font-semibold mb-3 font-['Outfit']">Banner</h3>
          <div className="w-full h-24 bg-gradient-to-r from-slate-700 to-slate-600 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
            {equippedBanner?.cosmetics?.imageUrl ? (
              <img
                src={equippedBanner.cosmetics.imageUrl}
                alt="Banner"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white text-sm">No banner equipped</span>
            )}
          </div>
          {equippedBanner && (
            <p className="text-white/70 text-xs mb-3">✓ {equippedBanner.cosmetics?.name}</p>
          )}
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700 text-sm"
            onClick={() => setLocation('/gacha')}
          >
            Customize
          </Button>
        </div>
      </div>

      {/* Cosmetics Inventory */}
      <div className="mt-8">
        <h3 className="text-white font-semibold mb-4 font-['Outfit']">
          Your Cosmetics ({userCosmetics.length})
        </h3>
        {userCosmetics.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {userCosmetics.map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 hover:border-blue-500/50 transition"
              >
                {item.cosmetics?.imageUrl && (
                  <img
                    src={item.cosmetics.imageUrl}
                    alt={item.cosmetics?.name}
                    className="w-full h-20 object-cover rounded mb-2"
                  />
                )}
                <p className="text-white text-xs font-semibold truncate">
                  {item.cosmetics?.name}
                </p>
                <p className="text-white/50 text-xs capitalize">
                  {item.cosmetics?.type?.replace(/_/g, ' ')}
                </p>
                {item.userCosmetics?.isEquipped && (
                  <p className="text-yellow-400 text-xs mt-1">✓ Equipped</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-white/50 text-center py-8">
            No cosmetics yet. Pull from the Gacha Shop to get started!
          </p>
        )}
      </div>
    </>
  )
}
