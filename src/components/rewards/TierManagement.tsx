import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Loader2, Check, X, ChevronDown } from "lucide-react";
import { rewardsService, TierData } from "@/features/rewards/rewards.service";
import { useToast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";

// Helper component to format benefits
const BenefitsDisplay = ({ benefits }: { benefits: Record<string, any> }) => {
  const formatKey = (key: string) => {
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .replace(/([a-z])([A-Z])/g, "$1 $2");
  };

  const formatValue = (key: string, value: any) => {
    if (typeof value === "boolean") {
      return value ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <X className="h-4 w-4 text-red-500" />
      );
    }
    if (typeof value === "number" && key.toLowerCase().includes("multiplier")) {
      return `${value}x`;
    }
    if (Array.isArray(value)) {
      return value.join(", ");
    }
    return value;
  };

  return (
    <div className="space-y-1">
      {Object.entries(benefits).map(([key, value]) => (
        <div key={key} className="flex items-center gap-2 text-sm">
          <span className="font-medium">{formatKey(key)}:</span>
          <span className="flex items-center">{formatValue(key, value)}</span>
        </div>
      ))}
    </div>
  );
};

// Analytics component
const TierAnalytics = ({ tiers }: { tiers: Tier[] }) => {
  const [analytics, setAnalytics] = useState<{
    userDistribution: Record<string, number>;
    averagePoints: Record<string, number>;
    progressionRates: Record<string, number>;
  }>({
    userDistribution: {},
    averagePoints: {},
    progressionRates: {},
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch("/api/rewards/tiers/analytics");
        if (!response.ok) {
          throw new Error("Failed to fetch analytics");
        }
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || "Invalid response format");
        }
        setAnalytics(data.analytics);
      } catch (error) {
        console.error("Error fetching tier analytics:", error);
        setError(error instanceof Error ? error.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    if (tiers.length > 0) {
      fetchAnalytics();
    }
  }, [tiers]);

  if (error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-red-500">
              Error Loading Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-500">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Loading Analytics...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            User Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          {Object.entries(analytics.userDistribution).map(([tier, count]) => (
            <div key={tier} className="flex justify-between items-center mb-2">
              <span>{tier}</span>
              <Badge variant="secondary">{count} users</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Average Points</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.entries(analytics.averagePoints).map(([tier, points]) => (
            <div key={tier} className="flex justify-between items-center mb-2">
              <span>{tier}</span>
              <span>{Math.round(points).toLocaleString()} pts</span>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Monthly Progression Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          {Object.entries(analytics.progressionRates).map(([tier, rate]) => (
            <div key={tier} className="flex justify-between items-center mb-2">
              <span>to {tier}</span>
              <span>{(rate * 100).toFixed(1)}%</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

interface Tier {
  id: string;
  tier_id: string;
  name: string;
  level: number;
  points_threshold: number;
  benefits: string[];
  created_at: string;
  updated_at: string;
}

interface TierFormData {
  name: string;
  level: number;
  pointsThreshold: number;
  benefits: {
    pointMultiplier?: number;
    discountPercentage?: number;
    freeShipping?: boolean;
    prioritySupport?: boolean;
    earlyAccess?: boolean;
    exclusiveEvents?: boolean;
    birthdayBonus?: number;
    referralBonus?: number;
    customBenefits?: string[];
  };
}

export function TierManagement() {
  const { toast } = useToast();
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingTier, setEditingTier] = useState<Tier | null>(null);
  const [formData, setFormData] = useState<TierFormData>({
    name: "",
    level: 0,
    pointsThreshold: 0,
    benefits: {
      pointMultiplier: 1,
      discountPercentage: 0,
      freeShipping: false,
      prioritySupport: false,
      earlyAccess: false,
      exclusiveEvents: false,
      birthdayBonus: 0,
      referralBonus: 0,
      customBenefits: [],
    },
  });

  useEffect(() => {
    loadTiers();
  }, []);

  const loadTiers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/rewards/tiers");
      if (!response.ok) {
        throw new Error("Failed to fetch tiers");
      }
      const data = await response.json();
      if (!data.success || !Array.isArray(data.tiers)) {
        throw new Error("Invalid response format");
      }
      setTiers(data.tiers);
    } catch (error) {
      console.error("Failed to load tiers:", error);
      toast({
        title: "Error",
        description: "Failed to load tiers. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTier = async () => {
    try {
      if (
        !formData.name ||
        formData.level < 0 ||
        formData.pointsThreshold < 0
      ) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields with valid values",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch("/api/rewards/tiers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to create tier");
      }

      toast({
        title: "Success",
        description: "Tier created successfully",
      });

      setShowDialog(false);
      loadTiers();
      resetForm();
    } catch (error) {
      console.error("Error creating tier:", error);
      toast({
        title: "Error",
        description: "Failed to create tier",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      level: 0,
      pointsThreshold: 0,
      benefits: {
        pointMultiplier: 1,
        discountPercentage: 0,
        freeShipping: false,
        prioritySupport: false,
        earlyAccess: false,
        exclusiveEvents: false,
        birthdayBonus: 0,
        referralBonus: 0,
        customBenefits: [],
      },
    });
    setEditingTier(null);
  };

  const handleDialogClose = () => {
    resetForm();
    setShowDialog(false);
  };

  const renderTierForm = () => {
    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="level">Level</Label>
          <Input
            id="level"
            type="number"
            min="0"
            value={formData.level}
            onChange={(e) =>
              setFormData({ ...formData, level: parseInt(e.target.value) || 0 })
            }
          />
        </div>
        <div>
          <Label htmlFor="pointsThreshold">Points Threshold</Label>
          <Input
            id="pointsThreshold"
            type="number"
            min="0"
            value={formData.pointsThreshold}
            onChange={(e) =>
              setFormData({
                ...formData,
                pointsThreshold: parseInt(e.target.value) || 0,
              })
            }
          />
        </div>
        <div className="space-y-4">
          <Label>Benefits</Label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pointMultiplier">Point Multiplier</Label>
              <Input
                id="pointMultiplier"
                type="number"
                min="1"
                step="0.1"
                value={formData.benefits.pointMultiplier}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    benefits: {
                      ...formData.benefits,
                      pointMultiplier: parseFloat(e.target.value) || 1,
                    },
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="discountPercentage">Discount Percentage</Label>
              <Input
                id="discountPercentage"
                type="number"
                min="0"
                max="100"
                value={formData.benefits.discountPercentage}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    benefits: {
                      ...formData.benefits,
                      discountPercentage: parseInt(e.target.value) || 0,
                    },
                  })
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="freeShipping"
                checked={formData.benefits.freeShipping}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    benefits: {
                      ...formData.benefits,
                      freeShipping: checked === true,
                    },
                  })
                }
              />
              <Label htmlFor="freeShipping">Free Shipping</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="prioritySupport"
                checked={formData.benefits.prioritySupport}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    benefits: {
                      ...formData.benefits,
                      prioritySupport: checked === true,
                    },
                  })
                }
              />
              <Label htmlFor="prioritySupport">Priority Support</Label>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="earlyAccess"
                checked={formData.benefits.earlyAccess}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    benefits: {
                      ...formData.benefits,
                      earlyAccess: checked === true,
                    },
                  })
                }
              />
              <Label htmlFor="earlyAccess">Early Access</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="exclusiveEvents"
                checked={formData.benefits.exclusiveEvents}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    benefits: {
                      ...formData.benefits,
                      exclusiveEvents: checked === true,
                    },
                  })
                }
              />
              <Label htmlFor="exclusiveEvents">Exclusive Events</Label>
            </div>
          </div>
          <div>
            <Label htmlFor="customBenefits">
              Custom Benefits (one per line)
            </Label>
            <Textarea
              id="customBenefits"
              value={formData.benefits.customBenefits?.join("\n") || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  benefits: {
                    ...formData.benefits,
                    customBenefits: e.target.value
                      .split("\n")
                      .filter((b) => b.trim()),
                  },
                })
              }
              rows={4}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <TierAnalytics tiers={tiers} />

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Tier Management</h2>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>Add New Tier</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTier ? "Edit Tier" : "Create New Tier"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {renderTierForm()}
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={handleDialogClose}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTier}>
                  {editingTier ? "Update Tier" : "Create Tier"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Points Threshold</TableHead>
              <TableHead>Benefits</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  Loading...
                </TableCell>
              </TableRow>
            ) : tiers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  No tiers found
                </TableCell>
              </TableRow>
            ) : (
              tiers.map((tier) => (
                <TableRow key={tier.id}>
                  <TableCell>{tier.name}</TableCell>
                  <TableCell>{tier.level}</TableCell>
                  <TableCell>{tier.points_threshold}</TableCell>
                  <TableCell>
                    {typeof tier.benefits === "object" &&
                    tier.benefits !== null ? (
                      <BenefitsDisplay benefits={tier.benefits} />
                    ) : Array.isArray(tier.benefits) ? (
                      <ul className="list-disc list-inside">
                        {tier.benefits.map((benefit, index) => (
                          <li key={index}>{benefit}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-gray-500">No benefits</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingTier(tier);
                          setFormData({
                            name: tier.name,
                            level: tier.level,
                            pointsThreshold: tier.points_threshold,
                            benefits: tier.benefits,
                          });
                          setShowDialog(true);
                        }}
                      >
                        Edit
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
