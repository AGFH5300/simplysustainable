import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Zap, Droplets, Target, PiggyBank, TrendingUp, TrendingDown, Plus, Lightbulb, RefreshCw, Home, AlertTriangle, Leaf, Calendar, Clock, StickyNote, Settings, X, Edit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { AlertBanner } from "@/components/alert-banner";
import { UsageCharts } from "@/components/charts";
import { UsageEntry, Tip, Badge as BadgeType } from "@shared/schema";

const formSchema = z.object({
  electricityUsage: z.string().optional(),
  waterUsage: z.string().optional(),
  weekStartDate: z.string().min(1, "Week start date is required"),
  electricityUnit: z.string().default("kWh"),
  waterUnit: z.string().default("L"),
  notes: z.string().optional(),
});

const settingsSchema = z.object({
  electricityLimit: z.string(),
  electricityUnit: z.string(),
  waterLimit: z.string(),
  waterUnit: z.string(),
  weeklyAlerts: z.boolean(),
  thresholdAlerts: z.boolean(),
  savingTips: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;
type SettingsData = z.infer<typeof settingsSchema>;

// Unit conversion constants
const electricityUnits = [
  { value: "kWh", label: "Kilowatt Hours (kWh)" },
  { value: "MWh", label: "Megawatt Hours (MWh)" },
  { value: "Wh", label: "Watt Hours (Wh)" },
  { value: "GWh", label: "Gigawatt Hours (GWh)" }
];

const waterUnits = [
  { value: "L", label: "Liters (L)" },
  { value: "gal", label: "Gallons (gal)" },
  { value: "m³", label: "Cubic Meters (m³)" },
  { value: "ft³", label: "Cubic Feet (ft³)" }
];

// Helper function to get Monday of current week
function getMondayOfWeek(date: Date = new Date()): string {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  return monday.toISOString().split('T')[0];
}

const quickScenarios = [
  {
    name: "Normal Week",
    description: "Average household weekly usage",
    details: "~150 kWh, ~1200L water",
    icon: Home,
    data: { electricityUsage: "150", waterUsage: "1200" }
  },
  {
    name: "High Usage Week",
    description: "Heavy consumption week",
    details: "~250 kWh, ~2000L water",
    icon: AlertTriangle,
    data: { electricityUsage: "250", waterUsage: "2000" }
  },
  {
    name: "Eco Week",
    description: "Conservation focused week",
    details: "~100 kWh, ~800L water",
    icon: Leaf,
    data: { electricityUsage: "100", waterUsage: "800" }
  }
];

interface DashboardData {
  currentWeekUsage: UsageEntry | null;
  recentUsage: UsageEntry[];
  totalPoints: number;
  monthlySavings: number;
  recentElectricity: number;
  recentWater: number;
  settings: {
    electricityLimit: string;
    electricityUnit: string;
    waterLimit: string;
    waterUnit: string;
    weeklyAlerts: boolean;
    thresholdAlerts: boolean;
    savingTips: boolean;
  };
}

export default function Dashboard() {
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: dashboardData, isLoading } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
  });

  const { data: tips = [] } = useQuery<Tip[]>({
    queryKey: ["/api/tips"],
  });

  const { data: featuredTip, refetch: refetchFeaturedTip } = useQuery<Tip>({
    queryKey: ["/api/tips/random"],
  });

  const { data: allBadges = [] } = useQuery<BadgeType[]>({
    queryKey: ["/api/badges"],
  });

  const { data: userBadges = [] } = useQuery<any[]>({
    queryKey: ["/api/badges/user"],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      electricityUsage: "",
      waterUsage: "",
      weekStartDate: getMondayOfWeek(),
      electricityUnit: "kWh",
      waterUnit: "L",
      notes: "",
    },
  });

  const settingsForm = useForm<SettingsData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      electricityLimit: "200",
      electricityUnit: "kWh",
      waterLimit: "1500",
      waterUnit: "L",
      weeklyAlerts: true,
      thresholdAlerts: true,
      savingTips: true,
    },
  });

  const createUsageMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", "/api/usage", data);
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 409 && errorData.canEdit) {
          setEditingEntry(errorData.existingEntry);
          throw new Error(`Data for this week already exists. You can edit the existing entry instead.`);
        }
        throw new Error(errorData.message || "Failed to add usage data");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Usage data added successfully",
        description: "Your electricity and water usage has been recorded.",
      });
      form.reset({
        electricityUsage: "",
        waterUsage: "",
        weekStartDate: getMondayOfWeek(),
        electricityUnit: dashboardData?.settings?.electricityUnit || "kWh",
        waterUnit: dashboardData?.settings?.waterUnit || "L",
        notes: "",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/usage"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: (error) => {
      toast({
        title: "Cannot add usage data",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateUsageMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<FormData> }) => {
      const response = await apiRequest("PUT", `/api/usage/${id}`, data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update usage data");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Usage data updated successfully",
        description: "Your electricity and water usage has been updated.",
      });
      setEditingEntry(null);
      form.reset({
        electricityUsage: "",
        waterUsage: "",
        weekStartDate: getMondayOfWeek(),
        electricityUnit: dashboardData?.settings?.electricityUnit || "kWh",
        waterUnit: dashboardData?.settings?.waterUnit || "L",
        notes: "",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/usage"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: (error) => {
      toast({
        title: "Error updating usage data",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: SettingsData) => {
      const response = await apiRequest("PUT", "/api/settings", data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update settings");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings updated",
        description: "Your preferences have been saved.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: (error) => {
      toast({
        title: "Error updating settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    if (!data.electricityUsage && !data.waterUsage) {
      toast({
        title: "No data entered",
        description: "Please enter at least electricity or water usage.",
        variant: "destructive",
      });
      return;
    }
    
    if (editingEntry) {
      updateUsageMutation.mutate({ id: editingEntry.id, data });
    } else {
      createUsageMutation.mutate(data);
    }
  };

  const handleEditExisting = () => {
    if (editingEntry) {
      form.reset({
        electricityUsage: editingEntry.electricityUsage || "",
        waterUsage: editingEntry.waterUsage || "",
        weekStartDate: editingEntry.weekStartDate,
        electricityUnit: editingEntry.electricityUnit || "kWh",
        waterUnit: editingEntry.waterUnit || "L",
        notes: editingEntry.notes || "",
      });
      setEditingEntry(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
    form.reset({
      electricityUsage: "",
      waterUsage: "",
      weekStartDate: getMondayOfWeek(),
      electricityUnit: dashboardData?.settings?.electricityUnit || "kWh",
      waterUnit: dashboardData?.settings?.waterUnit || "L",
      notes: "",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-16 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return <div>Error loading dashboard data</div>;
  }

  const { currentWeekUsage, recentUsage, totalPoints, settings } = dashboardData;
  const currentElectricity = parseFloat(currentWeekUsage?.electricityUsage || "0");
  const currentWater = parseFloat(currentWeekUsage?.waterUsage || "0");
  const electricityLimit = parseFloat(settings.electricityLimit);
  const waterLimit = parseFloat(settings.waterLimit);

  const lastWeek = recentUsage && recentUsage.length > 1 ? recentUsage[1] : null;
  const lastWeekElectricity = parseFloat(lastWeek?.electricityUsage || "0");
  const lastWeekWater = parseFloat(lastWeek?.waterUsage || "0");

  const electricityChange = lastWeekElectricity > 0 
    ? ((currentElectricity - lastWeekElectricity) / lastWeekElectricity) * 100 
    : 0;
  const waterChange = lastWeekWater > 0 
    ? ((currentWater - lastWeekWater) / lastWeekWater) * 100 
    : 0;

  const targetProgress = Math.min((currentElectricity / electricityLimit) * 100, 100);

  const electricityTips = tips.filter(tip => tip.category === "electricity");
  const waterTips = tips.filter(tip => tip.category === "water");
  const earnedBadgeIds = userBadges?.map((ub: any) => ub.badgeId) || [];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "bg-success text-success-foreground";
      case "medium": return "bg-warning text-warning-foreground";
      case "hard": return "bg-destructive text-destructive-foreground";
      default: return "bg-gray-500 text-white";
    }
  };

  const getBadgeIcon = (iconName: string) => {
    const icons: Record<string, any> = {
      tint: Droplets,
      bolt: Zap,
      leaf: Leaf,
      trophy: Target,
    };
    return icons[iconName] || Target;
  };

  const handleDismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => [...prev, alertId]);
  };



  const loadScenario = (scenario: typeof quickScenarios[0]) => {
    form.setValue("electricityUsage", scenario.data.electricityUsage);
    form.setValue("waterUsage", scenario.data.waterUsage);
    toast({
      title: `${scenario.name} scenario loaded`,
      description: scenario.description,
    });
  };

  const onSettingsSubmit = (data: SettingsData) => {
    updateSettingsMutation.mutate(data);
    setShowSettings(false);
  };

  // ESC key handler for settings modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showSettings) {
        setShowSettings(false);
      }
    };

    if (showSettings) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showSettings]);

  return (
    <div className="space-y-6">
      {/* Header with Settings */}
      <div className="relative">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Zap className="h-8 w-8 text-primary mr-3" />
            <h1 className="text-3xl font-bold text-foreground">WattWatch</h1>
          </div>
          <p className="text-muted-foreground">Monitor and reduce your electricity and water consumption</p>
        </div>
        
        {/* Settings Button */}
        <button
          onClick={() => setShowSettings(true)}
          className="absolute top-0 right-0 p-2 text-muted-foreground hover:text-primary hover:bg-accent rounded-lg transition-colors"
          title="Settings"
        >
          <Settings className="h-6 w-6" />
        </button>

        {/* Settings Panel */}
        {showSettings && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-card-foreground">Settings</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-muted-foreground hover:text-primary"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <Form {...settingsForm}>
                <form onSubmit={settingsForm.handleSubmit(onSettingsSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={settingsForm.control}
                      name="electricityUnit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Electricity Unit</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {electricityUnits.map((unit) => (
                                <SelectItem key={unit.value} value={unit.value}>
                                  {unit.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={settingsForm.control}
                      name="waterUnit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Water Unit</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {waterUnits.map((unit) => (
                                <SelectItem key={unit.value} value={unit.value}>
                                  {unit.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={settingsForm.control}
                      name="electricityLimit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weekly Electricity Limit</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="200" />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={settingsForm.control}
                      name="waterLimit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weekly Water Limit</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="1500" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowSettings(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={updateSettingsMutation.isPending}
                    >
                      {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </div>
        )}
      </div>

      {/* Alert Banners */}
      {currentElectricity > electricityLimit && 
       !dismissedAlerts.includes("electricity") && (
        <AlertBanner
          type="electricity"
          usage={currentElectricity}
          threshold={electricityLimit}
          onDismiss={() => handleDismissAlert("electricity")}
        />
      )}
      
      {currentWater > waterLimit && 
       !dismissedAlerts.includes("water") && (
        <AlertBanner
          type="water"
          usage={currentWater}
          threshold={waterLimit}
          onDismiss={() => handleDismissAlert("water")}
        />
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Week's Electricity</p>
                <p className="text-2xl font-bold text-gray-900">{currentElectricity.toFixed(1)} {settings.electricityUnit}</p>
                <div className="flex items-center text-sm">
                  {electricityChange >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-warning mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-success mr-1" />
                  )}
                  <span className={electricityChange >= 0 ? "text-warning" : "text-success"}>
                    {electricityChange >= 0 ? "↑" : "↓"} {Math.abs(electricityChange).toFixed(0)}% from last week
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 bg-warning/10 rounded-lg flex items-center justify-center">
                <Zap className="h-6 w-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Week's Water</p>
                <p className="text-2xl font-bold text-gray-900">{currentWater.toFixed(1)} {settings.waterUnit}</p>
                <div className="flex items-center text-sm">
                  {waterChange >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-warning mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-success mr-1" />
                  )}
                  <span className={waterChange >= 0 ? "text-warning" : "text-success"}>
                    {waterChange >= 0 ? "↑" : "↓"} {Math.abs(waterChange).toFixed(0)}% from last week
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Droplets className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Weekly Progress</p>
                <p className="text-2xl font-bold text-gray-900">{targetProgress.toFixed(0)}%</p>
                <p className="text-sm text-success">
                  {targetProgress <= 75 ? "On track to meet goal" : "Approaching limit"}
                </p>
              </div>
              <div className="h-12 w-12 bg-success/10 rounded-lg flex items-center justify-center">
                <Target className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Achievement Points</p>
                <p className="text-2xl font-bold text-gray-900">{totalPoints}</p>
                <p className="text-sm text-success">Keep earning badges!</p>
              </div>
              <div className="h-12 w-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                <PiggyBank className="h-6 w-6 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Charts */}
      <UsageCharts weeklyData={recentUsage || []} />

      {/* Main Content Tabs */}
      <Tabs defaultValue="input" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="input" className="flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Add Data
          </TabsTrigger>
          <TabsTrigger value="tips" className="flex items-center">
            <Lightbulb className="h-4 w-4 mr-2" />
            Tips
          </TabsTrigger>
          <TabsTrigger value="badges" className="flex items-center">
            <Target className="h-4 w-4 mr-2" />
            Achievements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="input" className="space-y-6">
          {/* Alert for existing entry */}
          {editingEntry && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Edit className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <h3 className="font-medium text-blue-900">Data already exists for this week</h3>
                      <p className="text-sm text-blue-700">
                        Week of {new Date(editingEntry.weekStartDate).toLocaleDateString()} - 
                        Electricity: {editingEntry.electricityUsage} {editingEntry.electricityUnit}, 
                        Water: {editingEntry.waterUsage} {editingEntry.waterUnit}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" onClick={handleEditExisting} variant="outline">
                      Edit This Data
                    </Button>
                    <Button size="sm" onClick={handleCancelEdit} variant="ghost">
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>{editingEntry ? "Edit Usage Data" : "Add Usage Data"}</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="electricityUsage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center">
                            <Zap className="h-4 w-4 text-warning mr-2" />
                            Electricity Usage ({settings.electricityUnit})
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="Enter kWh"
                              {...field}
                            />
                          </FormControl>
                          <p className="text-xs text-gray-500">Check your meter reading or estimate daily usage</p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="waterUsage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center">
                            <Droplets className="h-4 w-4 text-primary mr-2" />
                            Water Usage ({settings.waterUnit})
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Enter liters"
                              {...field}
                            />
                          </FormControl>
                          <p className="text-xs text-gray-500">Include all water usage: drinking, washing, etc.</p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="weekStartDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center">
                            <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                            Week Starting
                          </FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="waterUnit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center">
                            <Droplets className="h-4 w-4 text-gray-500 mr-2" />
                            Water Unit
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select unit" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {waterUnits.map((unit) => (
                                <SelectItem key={unit.value} value={unit.value}>
                                  {unit.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          <StickyNote className="h-4 w-4 text-gray-500 mr-2" />
                          Notes (Optional)
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            rows={3}
                            placeholder="Add any observations or special circumstances..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={createUsageMutation.isPending || updateUsageMutation.isPending}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      {createUsageMutation.isPending ? "Adding..." : 
                       updateUsageMutation.isPending ? "Updating..." :
                       editingEntry ? "Update Data" : "Add Data"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Quick Scenarios */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Scenarios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {quickScenarios.map((scenario) => {
                  const Icon = scenario.icon;
                  return (
                    <Button
                      key={scenario.name}
                      variant="outline"
                      className="p-4 h-auto text-left flex-col items-start"
                      onClick={() => loadScenario(scenario)}
                    >
                      <div className="flex items-center mb-2">
                        <Icon className="h-5 w-5 text-primary mr-2" />
                        <span className="font-medium">{scenario.name}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{scenario.description}</p>
                      <p className="text-xs text-gray-500">{scenario.details}</p>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tips" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Energy & Water Saving Tips</CardTitle>
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
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="badges" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Achievements & Badges</CardTitle>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">{totalPoints}</p>
                  <p className="text-sm text-gray-600">Total Points</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Badge Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                          Locked
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
