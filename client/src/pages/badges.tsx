import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Zap, Droplets, Leaf, Trophy, Crown, Target } from "lucide-react";
import { Badge as BadgeType, UserBadge } from "@shared/schema";

interface UserBadgeWithBadge extends UserBadge {
  badge: BadgeType;
}

const leaderboardData = [
  { name: "Team Green", reduction: "15%", points: 482, rank: 1 },
  { name: "Eco Warriors", reduction: "12%", points: 356, rank: 2 },
  { name: "Classroom A", reduction: "8%", points: 247, rank: 3 },
];

export default function Badges() {
  const { data: allBadges = [], isLoading: badgesLoading } = useQuery<BadgeType[]>({
    queryKey: ["/api/badges"],
  });

  const { data: userBadges = [], isLoading: userBadgesLoading } = useQuery<UserBadgeWithBadge[]>({
    queryKey: ["/api/badges/user"],
  });

  const { data: dashboardData } = useQuery({
    queryKey: ["/api/dashboard"],
  });

  if (badgesLoading || userBadgesLoading) {
    return (
      <div className="space-y-6">
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-32 bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalPoints = userBadges.reduce((sum, ub) => sum + ub.badge.points, 0);
  const earnedBadgeIds = userBadges.map(ub => ub.badgeId);

  const getBadgeIcon = (iconName: string) => {
    const icons: Record<string, any> = {
      tint: Droplets,
      bolt: Zap,
      leaf: Leaf,
      trophy: Trophy,
    };
    return icons[iconName] || Target;
  };

  // Mock weekly challenge progress
  const weeklyProgress = 68;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Achievements & Badges</h2>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">{totalPoints}</p>
              <p className="text-sm text-gray-600">Total Points</p>
            </div>
          </div>

          {/* Current Progress */}
          <div className="bg-gradient-to-r from-secondary to-green-600 rounded-lg p-6 text-white mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Weekly Challenge</h3>
              <Badge variant="secondary" className="bg-white bg-opacity-20 text-white">
                4 days left
              </Badge>
            </div>
            <p className="text-green-100 mb-4">Reduce total usage by 15% compared to last week</p>
            <div className="flex items-center">
              <div className="flex-1 mr-4">
                <Progress value={weeklyProgress} className="h-3 bg-white bg-opacity-20" />
              </div>
              <span className="text-sm font-medium">{weeklyProgress}%</span>
            </div>
          </div>

          {/* Badge Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {allBadges.map((badge) => {
              const isEarned = earnedBadgeIds.includes(badge.id);
              const Icon = getBadgeIcon(badge.icon);
              
              return (
                <div
                  key={badge.id}
                  className={`text-center p-4 border border-gray-200 rounded-lg ${
                    !isEarned ? "opacity-50" : ""
                  }`}
                >
                  <div className={`h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-3 ${
                    isEarned 
                      ? badge.icon === "tint" 
                        ? "bg-primary/10" 
                        : badge.icon === "bolt"
                        ? "bg-warning/10"
                        : badge.icon === "leaf"
                        ? "bg-success/10"
                        : "bg-secondary/10"
                      : "bg-gray-100"
                  }`}>
                    <Icon className={`h-8 w-8 ${
                      isEarned
                        ? badge.icon === "tint"
                          ? "text-primary"
                          : badge.icon === "bolt"
                          ? "text-warning"
                          : badge.icon === "leaf"
                          ? "text-success"
                          : "text-secondary"
                        : "text-gray-400"
                    }`} />
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1">{badge.name}</h4>
                  <p className="text-xs text-gray-600 mb-2">{badge.description}</p>
                  {isEarned ? (
                    <Badge variant="default" className="bg-success text-success-foreground">
                      Earned
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-gray-300 text-gray-600">
                      {badge.id === 3 ? "23/30 days" : "Locked"}
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>

          {/* Leaderboard */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <Trophy className="h-5 w-5 text-primary mr-2" />
              Class Leaderboard
            </h3>
            <div className="space-y-3">
              {leaderboardData.map((entry) => (
                <div
                  key={entry.name}
                  className={`flex items-center justify-between py-2 ${
                    entry.name === "Classroom A" ? "bg-blue-50 rounded-lg px-3" : ""
                  }`}
                >
                  <div className="flex items-center">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold mr-3 ${
                      entry.rank === 1 
                        ? "bg-warning text-white" 
                        : entry.rank === 2 
                        ? "bg-gray-400 text-white" 
                        : "bg-primary text-white"
                    }`}>
                      {entry.rank}
                    </span>
                    <div>
                      <p className={`font-medium ${
                        entry.name === "Classroom A" ? "text-gray-900" : "text-gray-900"
                      }`}>
                        {entry.name}
                        {entry.name === "Classroom A" && (
                          <span className="text-primary text-sm ml-1">(You)</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-600">
                        {entry.reduction} reduction this week
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      entry.rank === 1 
                        ? "text-warning" 
                        : entry.rank === 2 
                        ? "text-gray-600" 
                        : "text-primary"
                    }`}>
                      {entry.points} pts
                    </p>
                    {entry.rank === 1 && <Crown className="h-4 w-4 text-warning inline" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
