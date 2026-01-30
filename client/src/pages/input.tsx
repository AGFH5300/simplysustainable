import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Zap, Droplets, Calendar, Clock, StickyNote, Home, AlertTriangle, Leaf } from "lucide-react";

const formSchema = z.object({
  electricityUsage: z.string().optional(),
  waterUsage: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  period: z.string().default("daily"),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const quickScenarios = [
  {
    name: "Normal Day",
    description: "Average household usage",
    details: "~25 kWh, ~200L water",
    icon: Home,
    data: { electricityUsage: "25", waterUsage: "200" }
  },
  {
    name: "High Usage",
    description: "Left devices on, long shower",
    details: "~40 kWh, ~350L water",
    icon: AlertTriangle,
    data: { electricityUsage: "40", waterUsage: "350" }
  },
  {
    name: "Eco Day",
    description: "Conscious conservation effort",
    details: "~15 kWh, ~120L water",
    icon: Leaf,
    data: { electricityUsage: "15", waterUsage: "120" }
  }
];

export default function InputPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      electricityUsage: "",
      waterUsage: "",
      date: new Date().toISOString().split('T')[0],
      period: "daily",
      notes: "",
    },
  });

  const createUsageMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", "/api/usage", data);
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
        date: new Date().toISOString().split('T')[0],
        period: "daily",
        notes: "",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/usage"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: (error) => {
      toast({
        title: "Error adding usage data",
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
    createUsageMutation.mutate(data);
  };

  const loadScenario = (scenario: typeof quickScenarios[0]) => {
    form.setValue("electricityUsage", scenario.data.electricityUsage);
    form.setValue("waterUsage", scenario.data.waterUsage);
    toast({
      title: `${scenario.name} scenario loaded`,
      description: scenario.description,
    });
  };

  const clearForm = () => {
    form.reset({
      electricityUsage: "",
      waterUsage: "",
      date: new Date().toISOString().split('T')[0],
      period: "daily",
      notes: "",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Add Usage Data</h2>
          
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
                        Electricity Usage (kWh)
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
                        Water Usage (Liters)
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
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                        Date
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
                  name="period"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        <Clock className="h-4 w-4 text-gray-500 mr-2" />
                        Time Period
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select time period" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="daily">Daily total</SelectItem>
                          <SelectItem value="morning">Morning (6AM-12PM)</SelectItem>
                          <SelectItem value="afternoon">Afternoon (12PM-6PM)</SelectItem>
                          <SelectItem value="evening">Evening (6PM-12AM)</SelectItem>
                          <SelectItem value="night">Night (12AM-6AM)</SelectItem>
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

              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={clearForm}>
                  Clear
                </Button>
                <Button 
                  type="submit" 
                  disabled={createUsageMutation.isPending}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  {createUsageMutation.isPending ? "Adding..." : "Add Data"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Quick Scenarios */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Scenarios</h3>
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
    </div>
  );
}
