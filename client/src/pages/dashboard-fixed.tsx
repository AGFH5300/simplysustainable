import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Droplets, Target, Lightbulb, RefreshCw, Leaf, Calendar, StickyNote, Settings as SettingsIcon, X, Edit, Recycle, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UsageCharts } from "@/components/charts";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  type UsageEntry, 
  type Tip, 
  type Badge as BadgeType, 
  type Settings as SettingsType,
  insertUsageEntrySchema,
  insertSettingsSchema
} from "@shared/schema";
import { formatUsage } from "@/lib/utils";

const formSchema = insertUsageEntrySchema.extend({
  electricityUnit: z.string(),
  waterUnit: z.string(),
});

const settingsSchema = insertSettingsSchema.extend({
  electricityLimit: z.string().min(1, "Recycling goal is required"),
  waterLimit: z.string().min(1, "Hydration goal is required"),
});

type FormData = z.infer<typeof formSchema>;
type SettingsData = z.infer<typeof settingsSchema>;

const electricityUnits = [
  { label: "Items recycled", value: "items" },
  { label: "Bags recycled", value: "bags" },
  { label: "kg diverted", value: "kg" },
];

const waterUnits = [
  { label: "L (liters)", value: "L" },
  { label: "Cups", value: "cups" },
  { label: "oz (ounces)", value: "oz" },
];

const quickScenarios = [
  { 
    name: "Hydration Focus", 
    description: "Prioritize steady water breaks",
    electricityUsage: "6",
    waterUsage: "14"
  },
  { 
    name: "Recycling Run", 
    description: "Sort and drop off recycling",
    electricityUsage: "12",
    waterUsage: "10"
  },
  { 
    name: "Low Waste Week", 
    description: "Reuse containers and avoid single-use",
    electricityUsage: "8",
    waterUsage: "12"
  },
  { 
    name: "Community Clean-up", 
    description: "Extra impact with a neighborhood sweep",
    electricityUsage: "18",
    waterUsage: "16"
  }
];

function getMondayOfWeek(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

interface DashboardData {
  currentWeekUsage: UsageEntry | null;
  recentUsage: UsageEntry[];
  totalPoints: number;
  monthlySavings: number;
  recentElectricity: number;
  recentWater: number;
  settings: SettingsType;
}

export default function Dashboard() {
  // All state hooks first
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);
  
  // All context hooks
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // All query hooks
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

  // All form hooks
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      electricityUsage: "",
      waterUsage: "",
      weekStartDate: getMondayOfWeek(),
      electricityUnit: "items",
      waterUnit: "L",
      notes: "",
    },
  });

  const settingsForm = useForm<SettingsData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      electricityLimit: "10",
      electricityUnit: "items",
      waterLimit: "14",
      waterUnit: "L",
      weeklyAlerts: true,
      thresholdAlerts: true,
      savingTips: true,
    },
  });

  // All mutation hooks
  const createUsageMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", "/api/usage", data);
      if (!response.ok) {
        if (response.status === 409) {
          try {
            const errorData = await response.json();
            if (errorData.canEdit) {
              setEditingEntry(errorData.existingEntry);
            }
          } catch (e) {
            // Ignore JSON parsing errors
          }
          throw new Error("A habit log for this week already exists. You can edit the existing entry instead.");
        }
        throw new Error("Failed to add habit log");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Habit log saved",
        description: "Your recycling and hydration progress has been recorded.",
      });
      form.reset({
        electricityUsage: "",
        waterUsage: "",
        weekStartDate: getMondayOfWeek(),
        electricityUnit: "items",
        waterUnit: "L",
        notes: "",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/usage"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: (error) => {
      toast({
        title: "Cannot add habit log",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateUsageMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<FormData> }) => {
      const response = await apiRequest("PUT", `/api/usage/${id}`, data);
      if (!response.ok) {
        throw new Error("Failed to update habit log");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Habit log updated",
        description: "Your recycling and hydration progress has been updated.",
      });
      setEditingEntry(null);
      form.reset({
        electricityUsage: "",
        waterUsage: "",
        weekStartDate: getMondayOfWeek(),
        electricityUnit: "items",
        waterUnit: "L",
        notes: "",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/usage"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: (error) => {
      toast({
        title: "Error updating habit log",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: SettingsData) => {
      const response = await apiRequest("PUT", "/api/settings", data);
      if (!response.ok) {
        throw new Error("Failed to update settings");
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

  // All effect hooks
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

  // Event handlers
  const onSubmit = (data: FormData) => {
    if (!data.electricityUsage && !data.waterUsage) {
      toast({
        title: "No data entered",
        description: "Please log at least recycling or hydration progress.",
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
        electricityUnit: editingEntry.electricityUnit || "items",
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
      electricityUnit: "items",
      waterUnit: "L",
      notes: "",
    });
  };

  const handleQuickScenario = (scenario: typeof quickScenarios[0]) => {
    form.setValue("electricityUsage", scenario.electricityUsage);
    form.setValue("waterUsage", scenario.waterUsage);
    toast({
      title: `${scenario.name} scenario loaded`,
      description: scenario.description,
    });
  };

  const onSettingsSubmit = (data: SettingsData) => {
    updateSettingsMutation.mutate(data);
    setShowSettings(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your habits...</p>
        </div>
      </div>
    );
  }

  const settings = dashboardData?.settings;
  const currentUsage = dashboardData?.currentWeekUsage;
  const getTipCategoryLabel = (category?: string) =>
    category === "recycling" ? "Waste & Recycling" : "Water & Hydration";

  return (
    <div className="space-y-6">
      {/* Header with Settings */}
      <div className="relative">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Leaf className="h-8 w-8 text-primary mr-3" />
            <h1 className="text-3xl font-bold text-foreground">GreenSteps</h1>
          </div>
          <p className="text-muted-foreground">
            Track daily habits, stay hydrated, recycle more, and see your sustainable progress grow over time.
          </p>
        </div>
        
        {/* Settings Button */}
        <button
          onClick={() => setShowSettings(true)}
          className="absolute top-0 right-0 p-2 text-muted-foreground hover:text-primary hover:bg-accent rounded-lg transition-colors"
          title="Settings"
        >
          <SettingsIcon className="h-6 w-6" />
        </button>

        {/* Settings Panel */}
        {showSettings && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-card-foreground">Preferences</h2>
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
                          <FormLabel>Recycling Unit</FormLabel>
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
                          <FormLabel>Hydration Unit</FormLabel>
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
                          <FormLabel>Weekly Recycling Goal</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={settingsForm.control}
                      name="waterLimit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weekly Hydration Goal</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-3">
                    <FormField
                      control={settingsForm.control}
                      name="weeklyAlerts"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <FormLabel>Weekly habit alerts</FormLabel>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={settingsForm.control}
                      name="thresholdAlerts"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <FormLabel>Goal threshold alerts</FormLabel>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={settingsForm.control}
                      name="savingTips"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <FormLabel>Show eco tips</FormLabel>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
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
                    <Button type="submit" disabled={updateSettingsMutation.isPending}>
                      {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </div>
        )}
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Overview</TabsTrigger>
          <TabsTrigger value="input">Log Habits</TabsTrigger>
          <TabsTrigger value="tips">Tips</TabsTrigger>
          <TabsTrigger value="badges">Milestones</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Progress Charts */}
          <UsageCharts weeklyData={dashboardData?.recentUsage || []} />

          {/* Current Week Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week's Recycling</CardTitle>
              <Recycle className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {formatUsage(currentUsage?.electricityUsage, settings?.electricityUnit || "items")}
              </div>
              <p className="text-xs text-muted-foreground">
                Week starting {currentUsage?.weekStartDate ? new Date(currentUsage.weekStartDate).toLocaleDateString() : "No data"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week's Hydration</CardTitle>
              <Droplets className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">
                {formatUsage(currentUsage?.waterUsage, settings?.waterUnit || "L")}
              </div>
              <p className="text-xs text-muted-foreground">
                Week starting {currentUsage?.weekStartDate ? new Date(currentUsage.weekStartDate).toLocaleDateString() : "No data"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Habit Streak</CardTitle>
              <Target className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{dashboardData?.totalPoints || 0}</div>
              <p className="text-xs text-muted-foreground">Consistency points</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Impact Score</CardTitle>
              <Sparkles className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{dashboardData?.monthlySavings || 0}</div>
              <p className="text-xs text-muted-foreground">Estimated eco impact</p>
            </CardContent>
          </Card>
          </div>
        </TabsContent>

        <TabsContent value="input" className="space-y-6">
          {/* Edit Alert */}
          {editingEntry && (
              <Card className="border-warning bg-warning/10">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Edit className="h-5 w-5 text-warning" />
                  <div className="flex-1">
                    <p className="font-medium text-warning">Editing existing habit log</p>
                    <p className="text-sm text-muted-foreground">
                      You're updating the week starting {new Date(editingEntry.weekStartDate).toLocaleDateString()}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                    Cancel Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Weekly Habit Check-in</CardTitle>
              <p className="text-sm text-muted-foreground">
                Log your recycling actions and water intake for the week
              </p>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="electricityUsage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center space-x-2">
                              <Recycle className="h-4 w-4 text-primary" />
                              <span>Recycling Actions</span>
                            </FormLabel>
                            <FormControl>
                              <Input {...field} type="number" step="0.01" placeholder="Items or bags recycled" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="electricityUnit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Recycling Unit</FormLabel>
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
                    </div>

                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="waterUsage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center space-x-2">
                              <Droplets className="h-4 w-4 text-secondary" />
                              <span>Water Intake</span>
                            </FormLabel>
                            <FormControl>
                              <Input {...field} type="number" step="0.01" placeholder="Liters or cups of water" />
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
                            <FormLabel>Hydration Unit</FormLabel>
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
                  </div>

                  <FormField
                    control={form.control}
                    name="weekStartDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>Week Starting</span>
                        </FormLabel>
                        <FormControl>
                          <Input {...field} type="date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2">
                          <StickyNote className="h-4 w-4" />
                          <span>Notes (Optional)</span>
                        </FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Add a note about your habits, wins, or challenges..." 
                            value={field.value || ""}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button 
                      type="submit" 
                      className="flex-1"
                      disabled={createUsageMutation.isPending || updateUsageMutation.isPending}
                    >
                      {createUsageMutation.isPending || updateUsageMutation.isPending 
                        ? "Saving..." 
                        : editingEntry 
                          ? "Update Habit Log" 
                          : "Add Habit Log"
                      }
                    </Button>
                    {editingEntry && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleEditExisting}
                      >
                        Load Existing Data
                      </Button>
                    )}
                  </div>
                </form>
              </Form>

              {/* Quick Scenarios */}
              <div className="mt-6 pt-6 border-t">
                <h3 className="text-lg font-semibold mb-4">Quick Habit Boosts</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {quickScenarios.map((scenario, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickScenario(scenario)}
                      className="h-auto p-3 text-left flex flex-col items-start"
                    >
                      <span className="font-medium text-xs">{scenario.name}</span>
                      <span className="text-xs text-muted-foreground mt-1">{scenario.description}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tips" className="space-y-6">
          {featuredTip && settings?.savingTips && (
            <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Lightbulb className="h-5 w-5 text-primary" />
                    <span>Featured Eco Tip</span>
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => refetchFeaturedTip()}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <h3 className="font-semibold text-lg mb-2">{featuredTip.title}</h3>
                <p className="text-muted-foreground mb-4">{featuredTip.description}</p>
                <div className="flex items-center justify-between">
                  <Badge variant={featuredTip.difficulty === 'easy' ? 'default' : featuredTip.difficulty === 'medium' ? 'secondary' : 'destructive'}>
                    {featuredTip.difficulty}
                  </Badge>
                  <span className="text-sm text-success font-medium">
                    Impact +{featuredTip.potentialSavings} pts/week
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4">
            {tips.map((tip) => (
              <Card key={tip.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold mb-2">{tip.title}</h3>
                      <p className="text-muted-foreground text-sm mb-3">{tip.description}</p>
                      <div className="flex items-center space-x-3">
                        <Badge 
                          variant={
                            tip.difficulty === 'easy' ? 'default' : 
                            tip.difficulty === 'medium' ? 'secondary' : 
                            'destructive'
                          }
                        >
                          {tip.difficulty}
                        </Badge>
                        <Badge variant="outline" className="text-primary">
                          {getTipCategoryLabel(tip.category)}
                        </Badge>
                        <span className="text-sm text-success font-medium">
                          +{tip.potentialSavings} pts/week
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      {tip.category === 'recycling' ? (
                        <Recycle className="h-5 w-5 text-primary" />
                      ) : (
                        <Droplets className="h-5 w-5 text-secondary" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="badges" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {allBadges.map((badge) => {
              const isEarned = userBadges.some(ub => ub.badgeId === badge.id);
              return (
                <Card key={badge.id} className={isEarned ? "border-primary bg-primary/5" : "opacity-60"}>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                        isEarned ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}>
                        <Leaf className="h-8 w-8" />
                      </div>
                      <h3 className="font-semibold mb-2">{badge.name}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{badge.description}</p>
                      <Badge variant={isEarned ? "default" : "secondary"}>
                        {isEarned ? "Unlocked" : "In progress"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
