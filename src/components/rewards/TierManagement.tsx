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

// Helper component to format benefits
const BenefitsDisplay = ({ benefits }: { benefits: Record<string, any> }) => {
  const formatKey = (key: string) => {
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .replace(/([a-z])([A-Z])/g, "$1 $2");
  };

  const formatValue = (value: any) => {
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
          <span className="flex items-center">{formatValue(value)}</span>
        </div>
      ))}
    </div>
  );
};

// Analytics component
const TierAnalytics = ({ tiers }: { tiers: TierData[] }) => {
  const [analytics, setAnalytics] = useState<{
    userDistribution: Record<string, number>;
    averagePoints: Record<string, number>;
    progressionRates: Record<string, number>;
  }>({
    userDistribution: {},
    averagePoints: {},
    progressionRates: {},
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await rewardsService.getTierAnalytics();
        setAnalytics(data);
      } catch (error) {
        console.error("Error fetching tier analytics:", error);
      }
    };
    fetchAnalytics();
  }, [tiers]);

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

export function TierManagement() {
  const { toast } = useToast();
  const [tiers, setTiers] = useState<TierData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTier, setEditingTier] = useState<TierData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    tier_id: "",
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
    progressionRequirements: {
      minPurchaseCount: 0,
      minTotalSpent: 0,
      minDaysActive: 0,
      additionalRequirements: [],
    },
  });

  useEffect(() => {
    loadTiers();
  }, []);

  const loadTiers = async () => {
    try {
      const data = await rewardsService.getTiers();
      setTiers(data);
    } catch (error) {
      console.error("Error loading tiers:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load tiers",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTier) {
        await rewardsService.updateTier(editingTier.tier_id, formData);
        toast({
          title: "Success",
          description: "Tier updated successfully",
        });
      } else {
        await rewardsService.createTier(formData);
        toast({
          title: "Success",
          description: "Tier created successfully",
        });
      }
      setIsDialogOpen(false);
      resetForm();
      loadTiers();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: editingTier
          ? "Failed to update tier"
          : "Failed to create tier",
      });
      console.error("Error saving tier:", error);
    }
  };

  const handleEdit = (tier: TierData) => {
    setEditingTier(tier);
    setFormData({
      ...tier,
      benefits: {
        ...defaultBenefits,
        ...tier.benefits,
      },
      progressionRequirements: {
        ...defaultProgressionRequirements,
        ...tier.progressionRequirements,
      },
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (tierId: string) => {
    if (window.confirm("Are you sure you want to delete this tier?")) {
      try {
        await rewardsService.deleteTier(tierId);
        toast({
          title: "Success",
          description: "Tier deleted successfully",
        });
        loadTiers();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete tier",
        });
        console.error("Error deleting tier:", error);
      }
    }
  };

  const resetForm = () => {
    setEditingTier(null);
    setFormData({
      tier_id: "",
      name: "",
      level: 0,
      pointsThreshold: 0,
      benefits: defaultBenefits,
      progressionRequirements: defaultProgressionRequirements,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TierAnalytics tiers={tiers} />

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Tier Management</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                resetForm();
                setIsDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Tier
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingTier ? "Edit Tier" : "Create New Tier"}
              </DialogTitle>
              <DialogDescription>
                Configure the tier settings, benefits, and progression
                requirements.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Accordion type="single" collapsible defaultValue="basic">
                <AccordionItem value="basic">
                  <AccordionTrigger>Basic Information</AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Tier ID</Label>
                        <Input
                          value={formData.tier_id}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              tier_id: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Level</Label>
                        <Input
                          type="number"
                          value={formData.level}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              level: parseInt(e.target.value),
                            })
                          }
                          min="0"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Points Threshold</Label>
                        <Input
                          type="number"
                          value={formData.pointsThreshold}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              pointsThreshold: parseInt(e.target.value),
                            })
                          }
                          min="0"
                          required
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="benefits">
                  <AccordionTrigger>Benefits</AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Points Multiplier</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={formData.benefits.pointMultiplier}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              benefits: {
                                ...formData.benefits,
                                pointMultiplier: parseFloat(e.target.value),
                              },
                            })
                          }
                          min="1"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Discount Percentage</Label>
                        <Input
                          type="number"
                          value={formData.benefits.discountPercentage}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              benefits: {
                                ...formData.benefits,
                                discountPercentage: parseInt(e.target.value),
                              },
                            })
                          }
                          min="0"
                          max="100"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Birthday Bonus Points</Label>
                        <Input
                          type="number"
                          value={formData.benefits.birthdayBonus}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              benefits: {
                                ...formData.benefits,
                                birthdayBonus: parseInt(e.target.value),
                              },
                            })
                          }
                          min="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Referral Bonus Points</Label>
                        <Input
                          type="number"
                          value={formData.benefits.referralBonus}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              benefits: {
                                ...formData.benefits,
                                referralBonus: parseInt(e.target.value),
                              },
                            })
                          }
                          min="0"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Additional Benefits</Label>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={formData.benefits.freeShipping}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  benefits: {
                                    ...formData.benefits,
                                    freeShipping: e.target.checked,
                                  },
                                })
                              }
                            />
                            <Label>Free Shipping</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={formData.benefits.prioritySupport}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  benefits: {
                                    ...formData.benefits,
                                    prioritySupport: e.target.checked,
                                  },
                                })
                              }
                            />
                            <Label>Priority Support</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={formData.benefits.earlyAccess}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  benefits: {
                                    ...formData.benefits,
                                    earlyAccess: e.target.checked,
                                  },
                                })
                              }
                            />
                            <Label>Early Access</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={formData.benefits.exclusiveEvents}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  benefits: {
                                    ...formData.benefits,
                                    exclusiveEvents: e.target.checked,
                                  },
                                })
                              }
                            />
                            <Label>Exclusive Events</Label>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Custom Benefits (one per line)</Label>
                        <Textarea
                          value={formData.benefits.customBenefits.join("\n")}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              benefits: {
                                ...formData.benefits,
                                customBenefits: e.target.value
                                  .split("\n")
                                  .filter(Boolean),
                              },
                            })
                          }
                          placeholder="Enter custom benefits..."
                          className="h-[120px]"
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="progression">
                  <AccordionTrigger>Progression Requirements</AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Minimum Purchase Count</Label>
                        <Input
                          type="number"
                          value={
                            formData.progressionRequirements.minPurchaseCount
                          }
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              progressionRequirements: {
                                ...formData.progressionRequirements,
                                minPurchaseCount: parseInt(e.target.value),
                              },
                            })
                          }
                          min="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Minimum Total Spent ($)</Label>
                        <Input
                          type="number"
                          value={formData.progressionRequirements.minTotalSpent}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              progressionRequirements: {
                                ...formData.progressionRequirements,
                                minTotalSpent: parseInt(e.target.value),
                              },
                            })
                          }
                          min="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Minimum Days Active</Label>
                        <Input
                          type="number"
                          value={formData.progressionRequirements.minDaysActive}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              progressionRequirements: {
                                ...formData.progressionRequirements,
                                minDaysActive: parseInt(e.target.value),
                              },
                            })
                          }
                          min="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Additional Requirements (one per line)</Label>
                        <Textarea
                          value={formData.progressionRequirements.additionalRequirements.join(
                            "\n"
                          )}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              progressionRequirements: {
                                ...formData.progressionRequirements,
                                additionalRequirements: e.target.value
                                  .split("\n")
                                  .filter(Boolean),
                              },
                            })
                          }
                          placeholder="Enter additional requirements..."
                          className="h-[120px]"
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <DialogFooter>
                <Button type="submit">
                  {editingTier ? "Update Tier" : "Create Tier"}
                </Button>
              </DialogFooter>
            </form>
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
              <TableHead className="w-[300px]">Benefits</TableHead>
              <TableHead>Requirements</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tiers.map((tier) => (
              <TableRow key={tier.tier_id}>
                <TableCell className="font-medium">{tier.name}</TableCell>
                <TableCell>{tier.level}</TableCell>
                <TableCell>
                  {tier.pointsThreshold.toLocaleString()} points
                </TableCell>
                <TableCell>
                  <BenefitsDisplay benefits={tier.benefits} />
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {tier.progressionRequirements?.minPurchaseCount > 0 && (
                      <div>
                        Min. Purchases:{" "}
                        {tier.progressionRequirements.minPurchaseCount}
                      </div>
                    )}
                    {tier.progressionRequirements?.minTotalSpent > 0 && (
                      <div>
                        Min. Spent: $
                        {tier.progressionRequirements.minTotalSpent}
                      </div>
                    )}
                    {tier.progressionRequirements?.minDaysActive > 0 && (
                      <div>
                        Min. Days Active:{" "}
                        {tier.progressionRequirements.minDaysActive}
                      </div>
                    )}
                    {tier.progressionRequirements?.additionalRequirements?.map(
                      (req, i) => (
                        <div key={i}>{req}</div>
                      )
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(tier)}
                    className="mr-2"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(tier.tier_id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
