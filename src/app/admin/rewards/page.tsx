"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TierManagement } from "@/components/rewards/TierManagement";
import { Badge } from "@/components/ui/badge";

interface User {
  _id: string;
  userId: string;
  name: string;
  email: string;
  points: number;
  membershipLevel: string;
  created_at: string;
}

interface Reward {
  _id: string;
  reward_id: string;
  name: string;
  description: string;
  pointsCost: number;
  price?: number;
  isActive: boolean;
  quantity?: number;
  expiresAt?: Date;
  createdAt: string;
  updatedAt?: string;
  availableForTiers: ("Bronze" | "Silver" | "Gold" | "Platinum")[];
  redemptionLimit?: {
    type: "one_time" | "unlimited" | "daily" | "weekly" | "monthly";
    value?: number;
  };
  hasRewardCodes: boolean;
}

interface RewardFormData {
  name: string;
  description: string;
  pointsCost: number;
  price?: number;
  availableForTiers: ("Bronze" | "Silver" | "Gold" | "Platinum")[];
  redemptionLimit: {
    type: "one_time" | "unlimited" | "daily" | "weekly" | "monthly";
    value?: number;
  };
}

interface RewardCodeFormData {
  expiresAt?: string;
  isUnlimitedUse?: boolean;
  pointsValue?: number;
  itemDetails?: {
    name: string;
    description: string;
    value: number;
  };
  rewardType: "points" | "item" | "both";
}

interface RewardCode {
  _id: string;
  code: string;
  reward_id: string;
  isRedeemed: boolean;
  redeemedBy?: string;
  redeemedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  isUnlimitedUse?: boolean;
  userRedemptions?: string[];
  rewardType?: "points" | "item" | "both";
  pointsValue?: number;
  description?: string;
  itemDetails?: {
    name: string;
    description: string;
    value: number;
  };
}

interface Transaction {
  _id: string;
  user_id: string;
  reward_id?: string;
  description: string;
  points: number;
  type: "EARN" | "REDEEM";
  created_at: string;
}

const PointsMultiplierSection = () => {
  const [multipliers, setMultipliers] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formType, setFormType] = useState<"multiplier" | "rule">("multiplier");
  const [formData, setFormData] = useState({
    type: "multiplier",
    multiplier: 2,
    startDate: "",
    endDate: "",
    description: "",
    isActive: true,
    // Rule specific fields
    ruleName: "",
    productCategory: [],
    minimumPurchase: 0,
  });

  useEffect(() => {
    fetchMultipliers();
  }, []);

  const fetchMultipliers = async () => {
    try {
      const response = await fetch("/api/rewards/multipliers");
      const data = await response.json();
      if (data.success) {
        setMultipliers(data.data.multipliers);
        setRules(data.data.rules);
      }
    } catch (error) {
      console.error("Error fetching multipliers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/rewards/multipliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        setShowAddModal(false);
        fetchMultipliers();
        setFormData({
          type: "multiplier",
          multiplier: 2,
          startDate: "",
          endDate: "",
          description: "",
          isActive: true,
          ruleName: "",
          productCategory: [],
          minimumPurchase: 0,
        });
      }
    } catch (error) {
      console.error("Error creating multiplier:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Points Multipliers</h2>
        <Button onClick={() => setShowAddModal(true)}>Add Multiplier</Button>
      </div>

      <Tabs defaultValue="global" className="w-full">
        <TabsList>
          <TabsTrigger value="global">Global Multipliers</TabsTrigger>
          <TabsTrigger value="rules">Rule-Based Multipliers</TabsTrigger>
        </TabsList>

        <TabsContent value="global">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Multiplier</TableHead>
                <TableHead>Date Range</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : multipliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4">
                    No multipliers found
                  </TableCell>
                </TableRow>
              ) : (
                multipliers.map((multiplier) => (
                  <TableRow key={multiplier.id}>
                    <TableCell>{multiplier.multiplier}x</TableCell>
                    <TableCell>
                      {new Date(multiplier.start_date).toLocaleDateString()} -{" "}
                      {new Date(multiplier.end_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{multiplier.description}</TableCell>
                    <TableCell>
                      <Badge
                        variant={multiplier.is_active ? "default" : "secondary"}
                      >
                        {multiplier.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="rules">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rule Name</TableHead>
                <TableHead>Multiplier</TableHead>
                <TableHead>Categories</TableHead>
                <TableHead>Min. Purchase</TableHead>
                <TableHead>Date Range</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : rules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    No rules found
                  </TableCell>
                </TableRow>
              ) : (
                rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell>{rule.rule_name}</TableCell>
                    <TableCell>{rule.multiplier}x</TableCell>
                    <TableCell>
                      {Array.isArray(rule.product_category)
                        ? rule.product_category.join(", ")
                        : rule.product_category}
                    </TableCell>
                    <TableCell>${rule.minimum_purchase}</TableCell>
                    <TableCell>
                      {new Date(rule.start_date).toLocaleDateString()} -{" "}
                      {new Date(rule.end_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={rule.is_active ? "default" : "secondary"}>
                        {rule.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>

      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Points Multiplier</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: "multiplier" | "rule") => {
                  setFormData((prev) => ({ ...prev, type: value }));
                  setFormType(value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="multiplier">Global Multiplier</SelectItem>
                  <SelectItem value="rule">Rule-Based Multiplier</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Multiplier</Label>
              <Input
                type="number"
                min="1"
                step="0.1"
                value={formData.multiplier}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    multiplier: parseFloat(e.target.value),
                  })
                }
                required
              />
            </div>

            {formType === "rule" && (
              <>
                <div>
                  <Label>Rule Name</Label>
                  <Input
                    type="text"
                    value={formData.ruleName}
                    onChange={(e) =>
                      setFormData({ ...formData, ruleName: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label>Product Categories (comma-separated)</Label>
                  <Input
                    type="text"
                    value={
                      Array.isArray(formData.productCategory)
                        ? formData.productCategory.join(", ")
                        : ""
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        productCategory: e.target.value
                          .split(",")
                          .map((cat) => cat.trim()),
                      })
                    }
                    required
                  />
                </div>
                <div>
                  <Label>Minimum Purchase ($)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.minimumPurchase}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minimumPurchase: parseFloat(e.target.value),
                      })
                    }
                    required
                  />
                </div>
              </>
            )}

            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label>End Date</Label>
              <Input
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                required
              />
            </div>
            {formType === "multiplier" && (
              <div>
                <Label>Description</Label>
                <Input
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
            )}

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Add</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default function AdminRewardsPage() {
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState<User[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showRewardCodeDialog, setShowRewardCodeDialog] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [rewardCodes, setRewardCodes] = useState<RewardCode[]>([]);
  const [selectedRewardId, setSelectedRewardId] = useState<string>("");
  const [rewardCodeFormData, setRewardCodeFormData] =
    useState<RewardCodeFormData>({
      isUnlimitedUse: false,
      pointsValue: 0,
      rewardType: "points",
    });
  const { toast } = useToast();
  const [formData, setFormData] = useState<RewardFormData>({
    name: "",
    description: "",
    pointsCost: 0,
    price: 0,
    availableForTiers: ["Bronze", "Silver", "Gold", "Platinum"],
    redemptionLimit: {
      type: "unlimited",
    },
  });

  useEffect(() => {
    loadUsers();
    loadRewards();
    loadTransactions();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/rewards/users");
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      const data = await response.json();
      setUsers(data.users);
    } catch (error) {
      console.error("Failed to load users:", error);
      toast({
        title: "Error",
        description: "Failed to load users. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadRewards = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/rewards", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Ensure rewards is always an array and each reward has required properties
      const rewardsArray = Array.isArray(data.rewards)
        ? data.rewards.map((reward) => ({
            ...reward,
            availableForTiers: reward.availableForTiers || [],
            isActive: reward.isActive ?? true,
            pointsCost: reward.pointsCost || 0,
            description: reward.description || "",
            hasRewardCodes: reward.hasRewardCodes || false,
          }))
        : [];

      setRewards(rewardsArray);
    } catch (error) {
      console.error("Failed to load rewards:", error);
      toast({
        title: "Error",
        description: "Failed to load rewards. Please try again later.",
        variant: "destructive",
      });
      // Set rewards to empty array on error
      setRewards([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const intervalId = setInterval(() => {
      loadRewards();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(intervalId);
  }, []);

  const loadTransactions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/rewards/transactions");
      if (!response.ok) {
        throw new Error("Failed to fetch transactions");
      }
      const data = await response.json();
      if (!data.success || !Array.isArray(data.transactions)) {
        throw new Error("Invalid response format");
      }
      setTransactions(data.transactions);
    } catch (error) {
      console.error("Failed to load transactions:", error);
      toast({
        title: "Error",
        description: "Failed to load transactions. Please try again later.",
        variant: "destructive",
      });
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdjustPoints = async (userId: string) => {
    try {
      const points = prompt(
        "Enter points to add/deduct (use negative for deduction):"
      );
      if (points === null) return;

      const numPoints = parseInt(points);
      if (isNaN(numPoints)) {
        toast({
          title: "Error",
          description: "Please enter a valid number",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(`/api/rewards/points/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ points: numPoints }),
      });

      if (!response.ok) {
        throw new Error("Failed to adjust points");
      }

      toast({
        title: "Success",
        description: `Points ${
          numPoints >= 0 ? "added" : "deducted"
        } successfully`,
      });

      await loadUsers();
    } catch (error) {
      console.error("Failed to adjust points:", error);
      toast({
        title: "Error",
        description: "Failed to adjust points. Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateMembership = async (userId: string, level: string) => {
    try {
      const response = await fetch(`/api/rewards/users/${userId}/membership`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ membershipLevel: level }),
      });

      if (!response.ok) {
        throw new Error("Failed to update membership level");
      }

      toast({
        title: "Success",
        description: "Membership level updated successfully",
      });

      await loadUsers();
    } catch (error) {
      console.error("Failed to update membership:", error);
      toast({
        title: "Error",
        description:
          "Failed to update membership level. Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleToggleRewardStatus = async (
    rewardId: string,
    isActive: boolean
  ) => {
    try {
      const response = await fetch(`/api/rewards/${rewardId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive }),
      });

      if (!response.ok) {
        throw new Error("Failed to update reward status");
      }

      toast({
        title: "Success",
        description: `Reward ${
          isActive ? "activated" : "deactivated"
        } successfully`,
      });

      await loadRewards();
    } catch (error) {
      console.error("Failed to update reward status:", error);
      toast({
        title: "Error",
        description: "Failed to update reward status. Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleCleanup = async () => {
    try {
      const response = await fetch("/api/rewards/cleanup", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to cleanup users");
      }

      const data = await response.json();
      toast({
        title: "Success",
        description: data.message,
      });

      await loadUsers();
    } catch (error) {
      console.error("Failed to cleanup users:", error);
      toast({
        title: "Error",
        description: "Failed to cleanup users. Please try again later.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      pointsCost: 0,
      price: 0,
      availableForTiers: ["Bronze", "Silver", "Gold", "Platinum"],
      redemptionLimit: {
        type: "unlimited",
      },
    });
    setEditingReward(null);
  };

  const handleCreateReward = async () => {
    try {
      if (
        !formData.name ||
        !formData.pointsCost ||
        formData.availableForTiers.length === 0
      ) {
        toast({
          title: "Validation Error",
          description:
            "Please fill in all required fields and select at least one tier",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch("/api/rewards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          pointsCost: formData.pointsCost,
          price: formData.price,
          availableForTiers: formData.availableForTiers,
          redemptionLimit: formData.redemptionLimit,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create reward");
      }

      toast({
        title: "Success",
        description: "Reward created successfully",
      });

      setShowDialog(false);
      loadRewards();
    } catch (error) {
      console.error("Error creating reward:", error);
      toast({
        title: "Error",
        description: "Failed to create reward",
        variant: "destructive",
      });
    }
  };

  const handleUpdateReward = async (rewardId: string) => {
    try {
      if (
        !formData.name ||
        !formData.pointsCost ||
        formData.availableForTiers.length === 0
      ) {
        toast({
          title: "Validation Error",
          description:
            "Please fill in all required fields and select at least one tier",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(`/api/rewards/${rewardId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          pointsCost: formData.pointsCost,
          price: formData.price,
          availableForTiers: formData.availableForTiers,
          redemptionLimit: formData.redemptionLimit,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update reward");
      }

      toast({
        title: "Success",
        description: "Reward updated successfully",
      });

      setShowDialog(false);
      loadRewards();
    } catch (error) {
      console.error("Error updating reward:", error);
      toast({
        title: "Error",
        description: "Failed to update reward",
        variant: "destructive",
      });
    }
  };

  const handleDeleteReward = async (rewardId: string) => {
    if (!confirm("Are you sure you want to delete this reward?")) {
      return;
    }

    try {
      const response = await fetch(`/api/rewards/${rewardId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete reward");
      }

      toast({
        title: "Success",
        description: data.message || "Reward deleted successfully",
      });

      await loadRewards();
    } catch (error) {
      console.error("Failed to delete reward:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to delete reward. Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleEditClick = (reward: Reward) => {
    setEditingReward(reward);
    setFormData({
      name: reward.name,
      description: reward.description,
      pointsCost: reward.pointsCost,
      price: reward.price || 0,
      availableForTiers: reward.availableForTiers,
      redemptionLimit: reward.redemptionLimit || { type: "unlimited" },
    });
    setShowDialog(true);
  };

  const handleDialogClose = () => {
    resetForm();
    setShowDialog(false);
  };

  const handleGenerateRewardCodes = async () => {
    try {
      // Validate required fields based on reward type
      if (
        rewardCodeFormData.rewardType === "points" ||
        rewardCodeFormData.rewardType === "both"
      ) {
        if (
          !rewardCodeFormData.pointsValue ||
          rewardCodeFormData.pointsValue <= 0
        ) {
          toast({
            title: "Error",
            description: "Please enter a valid points value",
            variant: "destructive",
          });
          return;
        }
      }

      if (
        rewardCodeFormData.rewardType === "item" ||
        rewardCodeFormData.rewardType === "both"
      ) {
        if (!rewardCodeFormData.itemDetails?.name) {
          toast({
            title: "Error",
            description: "Please enter an item name",
            variant: "destructive",
          });
          return;
        }
      }

      const response = await fetch("/api/rewards/codes/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          ...rewardCodeFormData,
          expiresAt: rewardCodeFormData.expiresAt
            ? new Date(rewardCodeFormData.expiresAt).toISOString()
            : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate reward code");
      }

      const data = await response.json();

      // Update the reward codes list with the new code
      setRewardCodes((prevCodes) => [...prevCodes, data.code]);

      toast({
        title: "Success",
        description: "Generated reward code successfully",
      });

      setShowDialog(false);

      // Reset form data
      setRewardCodeFormData({
        isUnlimitedUse: false,
        pointsValue: 0,
        rewardType: "points",
      });
    } catch (error) {
      console.error("Failed to generate reward code:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to generate reward code",
        variant: "destructive",
      });
    }
  };

  const loadRewardCodes = async (rewardId?: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(
        rewardId
          ? `/api/reward-codes?rewardId=${rewardId}`
          : "/api/reward-codes"
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch reward codes");
      }

      const data = await response.json();
      console.log("Loaded reward codes:", data); // Debug log

      if (!data.codes || !Array.isArray(data.codes)) {
        throw new Error("Invalid response format");
      }

      setRewardCodes(data.codes);
    } catch (error) {
      console.error("Failed to load reward codes:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to load reward codes. Please try again later.",
        variant: "destructive",
      });
      setRewardCodes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRewardCode = async (code: string) => {
    if (!confirm("Are you sure you want to delete this reward code?")) {
      return;
    }

    try {
      const response = await fetch(`/api/reward-codes/${code}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete reward code");
      }

      toast({
        title: "Success",
        description: "Reward code deleted successfully",
      });

      // Reload codes for the selected reward
      if (selectedRewardId) {
        loadRewardCodes(selectedRewardId);
      }
    } catch (error) {
      console.error("Failed to delete reward code:", error);
      toast({
        title: "Error",
        description: "Failed to delete reward code. Please try again later.",
        variant: "destructive",
      });
    }
  };

  const renderRewardForm = () => {
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
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />
        </div>
        <div>
          <Label htmlFor="pointsCost">Points Cost</Label>
          <Input
            id="pointsCost"
            type="number"
            value={formData.pointsCost}
            onChange={(e) =>
              setFormData({
                ...formData,
                pointsCost: parseInt(e.target.value) || 0,
              })
            }
          />
        </div>
        <div>
          <Label htmlFor="price">Price (optional)</Label>
          <Input
            id="price"
            type="number"
            value={formData.price}
            onChange={(e) =>
              setFormData({
                ...formData,
                price: parseFloat(e.target.value) || 0,
              })
            }
          />
        </div>
        <div>
          <Label>Available for Tiers</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {["Bronze", "Silver", "Gold", "Platinum"].map((tier) => (
              <label key={tier} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.availableForTiers.includes(tier as any)}
                  onChange={(e) => {
                    const newTiers = e.target.checked
                      ? [...formData.availableForTiers, tier]
                      : formData.availableForTiers.filter((t) => t !== tier);
                    setFormData({
                      ...formData,
                      availableForTiers: newTiers as (
                        | "Bronze"
                        | "Silver"
                        | "Gold"
                        | "Platinum"
                      )[],
                    });
                  }}
                />
                <span>{tier}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <Label>Redemption Limit</Label>
          <Select
            value={formData.redemptionLimit.type}
            onValueChange={(value: any) =>
              setFormData({
                ...formData,
                redemptionLimit: {
                  type: value,
                  value:
                    value === "unlimited"
                      ? undefined
                      : formData.redemptionLimit.value,
                },
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="one_time">One Time</SelectItem>
              <SelectItem value="unlimited">Unlimited</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {formData.redemptionLimit.type !== "unlimited" &&
          formData.redemptionLimit.type !== "one_time" && (
            <div>
              <Label htmlFor="limitValue">Limit Value</Label>
              <Input
                id="limitValue"
                type="number"
                value={formData.redemptionLimit.value || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    redemptionLimit: {
                      ...formData.redemptionLimit,
                      value: parseInt(e.target.value) || undefined,
                    },
                  })
                }
              />
            </div>
          )}
      </div>
    );
  };

  const renderRewardsTable = () => {
    if (isLoading) {
      return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Points Cost</TableHead>
              <TableHead>Available Tiers</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={6} className="text-center py-4">
                Loading...
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Points Cost</TableHead>
            <TableHead>Available Tiers</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!rewards || rewards.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-4">
                No rewards found
              </TableCell>
            </TableRow>
          ) : (
            rewards.map((reward) => (
              <TableRow key={reward._id}>
                <TableCell>{reward.name}</TableCell>
                <TableCell>{reward.description}</TableCell>
                <TableCell>{reward.pointsCost}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {(reward.availableForTiers || []).map((tier) => (
                      <span
                        key={tier}
                        className={`px-2 py-1 rounded text-xs ${
                          tier === "Platinum"
                            ? "bg-purple-100 text-purple-800"
                            : tier === "Gold"
                            ? "bg-yellow-100 text-yellow-800"
                            : tier === "Silver"
                            ? "bg-gray-100 text-gray-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {tier}
                      </span>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <Button
                    variant={reward.isActive ? "default" : "secondary"}
                    onClick={() =>
                      handleToggleRewardStatus(
                        reward.reward_id,
                        !reward.isActive
                      )
                    }
                  >
                    {reward.isActive ? "Active" : "Inactive"}
                  </Button>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => handleEditClick(reward)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleDeleteReward(reward.reward_id)}
                    >
                      Delete
                    </Button>
                    {reward.hasRewardCodes && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedRewardId(reward.reward_id);
                          setActiveTab("codes");
                          loadRewardCodes(reward.reward_id);
                        }}
                      >
                        View Codes
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Tabs
        defaultValue="users"
        className="space-y-6"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList>
          <TabsTrigger value="users">Users & Points</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="tiers">Tier Management</TabsTrigger>
          <TabsTrigger value="multipliers">Points Multipliers</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Membership Level</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {user.userId}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Select
                          defaultValue={user.membershipLevel}
                          onValueChange={(value) =>
                            handleUpdateMembership(user.userId, value)
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Bronze">Bronze</SelectItem>
                            <SelectItem value="Silver">Silver</SelectItem>
                            <SelectItem value="Gold">Gold</SelectItem>
                            <SelectItem value="Platinum">Platinum</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>{user.points}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAdjustPoints(user.userId)}
                        >
                          Adjust Points
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="rewards" className="mt-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Rewards Management</h1>
            <Button variant="outline" onClick={handleCleanup}>
              Cleanup Invalid Users
            </Button>
          </div>

          <div className="flex justify-end mb-4">
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button variant="default" onClick={() => resetForm()}>
                  Add New Reward
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingReward ? "Edit Reward" : "Create New Reward"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {renderRewardForm()}
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={handleDialogClose}>
                      Cancel
                    </Button>
                    <Button
                      onClick={() =>
                        editingReward
                          ? handleUpdateReward(editingReward.reward_id)
                          : handleCreateReward()
                      }
                    >
                      {editingReward ? "Update Reward" : "Create Reward"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {renderRewardsTable()}
        </TabsContent>

        <TabsContent value="transactions" className="mt-6">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Reward</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      No transactions found
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((transaction) => (
                    <TableRow key={transaction._id}>
                      <TableCell>
                        {new Date(transaction.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {transaction.user_id}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded text-sm ${
                            transaction.type === "EARN"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {transaction.type}
                        </span>
                      </TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell
                        className={
                          transaction.type === "EARN"
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {transaction.type === "EARN" ? "+" : "-"}
                        {Math.abs(transaction.points)}
                      </TableCell>
                      <TableCell>
                        {transaction.reward_id
                          ? rewards.find(
                              (r) => r.reward_id === transaction.reward_id
                            )?.name || transaction.reward_id
                          : "N/A"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="tiers" className="mt-6">
          <TierManagement />
        </TabsContent>

        <TabsContent value="multipliers" className="mt-6">
          <PointsMultiplierSection />
        </TabsContent>
      </Tabs>

      {/* Reward Code Generation Dialog */}
      <Dialog
        open={showRewardCodeDialog}
        onOpenChange={setShowRewardCodeDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Reward Code</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rewardType">Reward Type</Label>
              <Select
                value={rewardCodeFormData.rewardType}
                onValueChange={(value: "points" | "item" | "both") =>
                  setRewardCodeFormData((prev) => ({
                    ...prev,
                    rewardType: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select reward type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="points">Points Only</SelectItem>
                  <SelectItem value="item">Item Only</SelectItem>
                  <SelectItem value="both">Points and Item</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(rewardCodeFormData.rewardType === "points" ||
              rewardCodeFormData.rewardType === "both") && (
              <div>
                <Label htmlFor="pointsValue">Points Value</Label>
                <Input
                  id="pointsValue"
                  type="number"
                  min="0"
                  value={rewardCodeFormData.pointsValue || 0}
                  onChange={(e) =>
                    setRewardCodeFormData((prev) => ({
                      ...prev,
                      pointsValue: parseInt(e.target.value) || 0,
                    }))
                  }
                  placeholder="Enter points value"
                />
              </div>
            )}

            {/* ... rest of the dialog content ... */}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
