import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sparkles, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function GachaShop() {
  const { user } = useAuth();
  const [selectedRarity, setSelectedRarity] = useState<'all' | 'common' | 'rare' | 'epic' | 'legendary'>('all');
  const [pullCount, setPullCount] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);

  // Fetch cosmetics
  const { data: cosmetics = [], isLoading: cosmeticsLoading } = trpc.gacha.getCosmetics.useQuery(
    { schoolCode: user?.schoolCode || 'CHHS' },
    { enabled: !!user?.schoolCode }
  );

  // Fetch user cosmetics
  const { data: userCosmetics = [] } = trpc.gacha.getUserCosmetics.useQuery();

  // Pull gacha mutation
  const pullMutation = trpc.gacha.pullGacha.useMutation({
    onSuccess: () => {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 2000);
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
                  <p className="text-gray-300 text-sm mb-2">Cost per pull:</p>
                  <p className="text-2xl font-bold text-yellow-400">
                    {pullCount * 100} Blue Bucks
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
                  { rarity: 'common', rate: '60%', color: 'bg-gray-500' },
                  { rarity: 'rare', rate: '25%', color: 'bg-blue-500' },
                  { rarity: 'epic', rate: '10%', color: 'bg-purple-500' },
                  { rarity: 'legendary', rate: '5%', color: 'bg-yellow-500' },
                ].map(item => (
                  <div key={item.rarity} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded ${item.color}`} />
                      <span className="text-gray-300 capitalize">{item.rarity}</span>
                    </div>
                    <span className="text-white font-bold">{item.rate}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

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
                        ✓ Owned
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
