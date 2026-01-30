import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Droplets, Lightbulb, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { Tip } from "@shared/schema";

export default function Tips() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const { data: tips = [], isLoading } = useQuery<Tip[]>({
    queryKey: ["/api/tips"],
  });

  const { data: featuredTip, refetch: refetchFeaturedTip } = useQuery<Tip>({
    queryKey: ["/api/tips/random"],
  });

  const filteredTips = selectedCategory === "all" 
    ? tips 
    : tips.filter(tip => tip.category === selectedCategory);

  const electricityTips = tips.filter(tip => tip.category === "electricity");
  const waterTips = tips.filter(tip => tip.category === "water");

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "bg-success text-success-foreground";
      case "medium": return "bg-warning text-warning-foreground";
      case "hard": return "bg-destructive text-destructive-foreground";
      default: return "bg-gray-500 text-white";
    }
  };

  const getCategoryIcon = (category: string) => {
    return category === "electricity" ? Zap : Droplets;
  };

  if (isLoading) {
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

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Energy & Water Saving Tips</h2>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => refetchFeaturedTip()}
              className="text-primary"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Get New Tips
            </Button>
          </div>

          {/* Featured Tip */}
          {featuredTip && (
            <div className="bg-gradient-to-r from-primary to-blue-600 rounded-lg p-6 text-white mb-6">
              <div className="flex items-start">
                <div className="h-12 w-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mr-4">
                  <Lightbulb className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">Tip of the Day</h3>
                  <p className="text-blue-100 mb-3">{featuredTip.description}</p>
                  <div className="flex items-center text-sm">
                    <Badge variant="secondary" className="bg-white bg-opacity-20 text-white mr-2">
                      {featuredTip.category}
                    </Badge>
                    {featuredTip.potentialSavings && (
                      <span>Potential savings: {featuredTip.potentialSavings}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Category Filter */}
          <div className="flex space-x-4 mb-6">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              onClick={() => setSelectedCategory("all")}
              size="sm"
            >
              All Tips
            </Button>
            <Button
              variant={selectedCategory === "electricity" ? "default" : "outline"}
              onClick={() => setSelectedCategory("electricity")}
              size="sm"
              className="flex items-center"
            >
              <Zap className="h-4 w-4 mr-1" />
              Electricity
            </Button>
            <Button
              variant={selectedCategory === "water" ? "default" : "outline"}
              onClick={() => setSelectedCategory("water")}
              size="sm"
              className="flex items-center"
            >
              <Droplets className="h-4 w-4 mr-1" />
              Water
            </Button>
          </div>

          {/* Tips Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Electricity Tips Column */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <Zap className="h-5 w-5 text-warning mr-2" />
                Electricity Tips
              </h3>
              
              {electricityTips.map((tip) => (
                <Card key={tip.id} className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-start">
                      <div className="h-8 w-8 bg-warning/10 rounded-full flex items-center justify-center mr-3 mt-1">
                        <Zap className="h-4 w-4 text-warning" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">{tip.title}</h4>
                        <p className="text-sm text-gray-600 mb-2">{tip.description}</p>
                        <div className="flex items-center space-x-2">
                          <Badge className={getDifficultyColor(tip.difficulty)}>
                            {tip.difficulty}
                          </Badge>
                          {tip.potentialSavings && (
                            <span className="text-xs text-success font-medium">
                              Save {tip.potentialSavings}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Water Tips Column */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <Droplets className="h-5 w-5 text-primary mr-2" />
                Water Tips
              </h3>
              
              {waterTips.map((tip) => (
                <Card key={tip.id} className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-start">
                      <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center mr-3 mt-1">
                        <Droplets className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">{tip.title}</h4>
                        <p className="text-sm text-gray-600 mb-2">{tip.description}</p>
                        <div className="flex items-center space-x-2">
                          <Badge className={getDifficultyColor(tip.difficulty)}>
                            {tip.difficulty}
                          </Badge>
                          {tip.potentialSavings && (
                            <span className="text-xs text-success font-medium">
                              Save {tip.potentialSavings}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Personalized Recommendations */}
          <div className="mt-8 bg-gray-50 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Personalized Recommendations</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-white rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-warning mr-3" />
                  <span className="text-sm">Track your usage patterns to get personalized tips</span>
                </div>
                <span className="text-xs text-primary font-medium">Add more data for insights</span>
              </div>
              <div className="flex items-center justify-between bg-white rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-success mr-3" />
                  <span className="text-sm">You're doing great with water conservation!</span>
                </div>
                <span className="text-xs text-success font-medium">Keep it up!</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
