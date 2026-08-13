import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CircleCheck, History, Package, Sparkles, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

export default function GachaShop() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [selectedRarity, setSelectedRarity] = useState<'all' | 'common' | 'rare' | 'epic' | 'legendary'>('all');
  const [pullCount, setPullCount] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showPullHistory, setShowPullHistory] = useState(false);
  const [showInventory, setShowInventory] = useState(false);

  // Fetch cosmetics
  const { data: cosmetics = [], isLoading: cosmeticsLoading } = trpc.gacha.getCosmetics.useQuery(
    { schoolCode: user?.schoolCode || 'Blue Blazer' },
    { enabled: !!user?.schoolCode }
  );

  // Fetch user cosmetics
  const { data: userCosmetics = [] } = trpc.gacha.getUserCosmetics.useQuery();

  // Fetch pull history
  const { data: pullHistory = [] } = trpc.gacha.getPullHistory.useQuery(
    undefined,
    { enabled: !!user?.id }
  );

  // Pull gacha mutation
  const pullMutation = trpc.gacha.pullGacha.useMutation({
    onSuccess: () => {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 2000);
      void utils.gacha.getUserCosmetics.invalidate();
      void utils.gacha.getPullHistory.invalidate();
    },
  });

  const equipMutation = trpc.gacha.equipCosmetic.useMutation({
    onSuccess: () => {
      void utils.gacha.getUserCosmetics.invalidate();
    },
  });

  const filteredCosmetics = selectedRarity === 'all'
    ? cosmetics
    : cosmetics.filter(c => c.rarity === selectedRarity);

  const rarityColors = {
    common: 'bg-gray-500',
    rare: 'bg-blue-500',
    epic: 'bg-purple-500',
    legendary: 'bg-yellow-500',
  };

  const rarityBorders = {
    common: 'border-gray-400',
    rare: 'border-blue-400',
    epic: 'border-purple-400',
    legendary: 'border-yellow-400',
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-6 mt-16">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-yellow-400" />
            <h1 className="text-4xl font-bold text-white">Gacha Shop</h1>
          </div>
          <p className="text-gray-300">Collect cosmetics to customize your profile!</p>
        </div>

        {/* Pull Section */}
        <Card className="bg-slate-800 border-blue-500/30 mb-8 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pull Controls */}
            <div>
              <h2 className="text-xl font-bold text-white mb-4">Gacha Pull</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-gray-300 text-sm mb-2 block">Number of Pulls</label>
                  <div className="flex gap-2">
                    {[1, 5, 10].map(num => (
                      <Button
                        key={num}
                        onClick={() => setPullCount(num)}
                        variant={pullCount === num ? 'default' : 'outline'}
                        className={pullCount === num ? 'bg-blue-600' : ''}
                      >
                        {num}x
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-700 p-4 rounded-lg">
                  <p className="text-gray-300 text-sm mb-2">Rarity-based price:</p>
                  <p className="text-2xl font-bold text-yellow-400">
                    100–1,000 Blue Bucks per item
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    Each result is charged at its displayed rarity price. Your final total is shown in pull history.
                  </p>
                </div>

                <Button
                  onClick={() => pullMutation.mutate({ pulls: pullCount })}
                  disabled={pullMutation.isPending}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {pullMutation.isPending ? 'Pulling...' : `Pull ${pullCount}x`}
                </Button>

                {pullMutation.isError && (
                  <div className="bg-red-500/20 border border-red-500 rounded p-3 text-red-300 text-sm">
                    {pullMutation.error?.message || 'Pull failed'}
                  </div>
                )}
              </div>
            </div>

            {/* Rarity Info */}
            <div>
              <h2 className="text-xl font-bold text-white mb-4">Rarity Rates</h2>
              <div className="space-y-3">
                {[
                  { rarity: 'common', rate: '60%', cost: 100, color: 'bg-gray-500' },
                  { rarity: 'rare', rate: '25%', cost: 250, color: 'bg-blue-500' },
                  { rarity: 'epic', rate: '10%', cost: 500, color: 'bg-purple-500' },
                  { rarity: 'legendary', rate: '5%', cost: 1000, color: 'bg-yellow-500' },
                ].map(item => (
                  <div key={item.rarity} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded ${item.color}`} />
                      <span className="text-gray-300 capitalize">{item.rarity}</span>
                    </div>
                    <span className="text-right text-white font-bold">
                      {item.rate} <span className="text-xs font-medium text-yellow-300">· {item.cost} BB</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Pull History & Inventory Tabs */}
        <div className="mb-8 flex gap-4">
          <Button
            onClick={() => {
              setShowPullHistory(!showPullHistory);
              setShowInventory(false);
            }}
            variant={showPullHistory ? 'default' : 'outline'}
            className="flex items-center gap-2"
          >
            <History className="w-4 h-4" />
            Pull History
          </Button>
          <Button
            onClick={() => {
              setShowInventory(!showInventory);
              setShowPullHistory(false);
            }}
            variant={showInventory ? 'default' : 'outline'}
            className="flex items-center gap-2"
          >
            <Package className="w-4 h-4" />
            My Inventory
          </Button>
        </div>

        {/* Pull History Section */}
        {showPullHistory && (
          <Card className="bg-slate-800 border-blue-500/30 mb-8 p-6">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <History className="w-6 h-6" />
              Pull History
            </h2>
            {pullHistory.length === 0 ? (
              <p className="text-gray-400">No pulls yet. Start pulling to see your history!</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {[...pullHistory].reverse().map((pull: any, idx: number) => (
                  <div key={idx} className="bg-slate-700 rounded p-4 flex items-center justify-between">
                    <div>
                      <p className="text-white font-semibold">{pull.cosmetics?.name || 'Unknown'}</p>
                      <p className="text-gray-400 text-sm">
                        {new Date(pull.gachaPulls.pulledAt).toLocaleDateString()} {new Date(pull.gachaPulls.pulledAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded text-white text-sm font-bold ${
                        pull.gachaPulls.rarityObtained === 'legendary' ? 'bg-yellow-600' :
                        pull.gachaPulls.rarityObtained === 'epic' ? 'bg-purple-600' :
                        pull.gachaPulls.rarityObtained === 'rare' ? 'bg-blue-600' :
                        'bg-gray-600'
                      }`}>
                        {pull.gachaPulls.rarityObtained.toUpperCase()}
                      </span>
                      <span className="text-yellow-400 font-bold flex items-center gap-1">
                        <Zap className="w-4 h-4" />
                        {pull.gachaPulls.pointsSpent}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Inventory Section */}
        {showInventory && (
          <Card className="bg-slate-800 border-blue-500/30 mb-8 p-6">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Package className="w-6 h-6" />
              My Cosmetics Inventory
            </h2>
            {userCosmetics.length === 0 ? (
              <p className="text-gray-400">You don't have any cosmetics yet. Start pulling!</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {userCosmetics.map((userCosmetic: any) => {
                  const inventoryEntry = userCosmetic.userCosmetics;
                  const isEquipped = Boolean(inventoryEntry?.isEquipped);
                  return (
                  <motion.div
                    key={inventoryEntry?.id}
                    whileHover={{ scale: 1.05 }}
                    className="bg-slate-700 border-2 border-blue-500/50 rounded-lg p-4"
                  >
                    {userCosmetic.cosmetics?.imageUrl && (
                      <div className="w-full h-32 bg-slate-600 rounded mb-3 flex items-center justify-center overflow-hidden">
                        <img
                          src={userCosmetic.cosmetics.imageUrl}
                          alt={userCosmetic.cosmetics.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <h3 className="font-bold text-white mb-2">{userCosmetic.cosmetics?.name}</h3>
                    <p className="text-gray-400 text-xs mb-3">{userCosmetic.cosmetics?.description}</p>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold px-2 py-1 rounded text-white ${
                        userCosmetic.cosmetics?.rarity === 'legendary' ? 'bg-yellow-600' :
                        userCosmetic.cosmetics?.rarity === 'epic' ? 'bg-purple-600' :
                        userCosmetic.cosmetics?.rarity === 'rare' ? 'bg-blue-600' :
                        'bg-gray-600'
                      }`}>
                        {userCosmetic.cosmetics?.rarity.toUpperCase()}
                      </span>
                      {isEquipped && (
                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-400">
                          <CircleCheck className="h-3.5 w-3.5" /> Equipped
                        </span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant={isEquipped ? 'outline' : 'default'}
                      className="mt-3 w-full"
                      disabled={isEquipped || equipMutation.isPending}
                      onClick={() => equipMutation.mutate({ userCosmeticId: inventoryEntry.id })}
                    >
                      {isEquipped ? 'Equipped' : 'Equip'}
                    </Button>
                  </motion.div>
                  );
                })}
              </div>
            )}
          </Card>
        )}

        {/* Cosmetics Catalog */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Available Cosmetics</h2>

          {/* Filter */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {(['all', 'common', 'rare', 'epic', 'legendary'] as const).map(rarity => (
              <Button
                key={rarity}
                onClick={() => setSelectedRarity(rarity)}
                variant={selectedRarity === rarity ? 'default' : 'outline'}
                className={
                  selectedRarity === rarity
                    ? rarity === 'all'
                      ? 'bg-blue-600'
                      : `${rarityColors[rarity]}`
                    : ''
                }
              >
                {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
              </Button>
            ))}
          </div>

          {/* Cosmetics Grid */}
          {cosmeticsLoading ? (
            <div className="text-center text-gray-400">Loading cosmetics...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredCosmetics.map(cosmetic => {
                const isOwned = userCosmetics.some(uc => uc.cosmetics?.id === cosmetic.id);
                return (
                  <motion.div
                    key={cosmetic.id}
                    whileHover={{ scale: 1.05 }}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition ${
                      rarityBorders[cosmetic.rarity]
                    } ${isOwned ? 'bg-slate-700' : 'bg-slate-800 hover:bg-slate-700'}`}
                  >
                    {cosmetic.imageUrl && (
                      <div className="w-full h-32 bg-slate-700 rounded mb-3 flex items-center justify-center overflow-hidden">
                        <img
                          src={cosmetic.imageUrl}
                          alt={cosmetic.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <h3 className="font-bold text-white mb-2">{cosmetic.name}</h3>

                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded ${rarityColors[cosmetic.rarity]} text-white`}>
                        {cosmetic.rarity.toUpperCase()}
                      </span>
                      <span className="text-yellow-400 font-bold flex items-center gap-1">
                        <Zap className="w-4 h-4" />
                        {cosmetic.cost}
                      </span>
                    </div>

                    {cosmetic.description && (
                      <p className="text-gray-400 text-xs mb-3">{cosmetic.description}</p>
                    )}

                    {isOwned && (
                      <div className="bg-green-500/20 border border-green-500 rounded px-2 py-1 text-center text-green-300 text-xs font-bold">
                        <CircleCheck className="mr-1 inline h-3.5 w-3.5" /> Owned
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Animation Overlay */}
        {isAnimating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gradient-to-t from-yellow-500/30 to-transparent pointer-events-none"
          >
            <div className="flex items-center justify-center h-full">
              <motion.div
                animate={{ scale: [1, 1.2, 1], rotate: [0, 360] }}
                transition={{ duration: 0.6 }}
                className="text-6xl"
              >
                ✨
              </motion.div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
