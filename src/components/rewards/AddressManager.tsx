"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Home, Plus, Edit2, Trash2 } from "lucide-react";

interface Address {
  id: string;
  address_type: "SHIPPING" | "BILLING";
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  zip_code: string;
  is_default: boolean;
  is_verified: boolean;
}

interface AddressManagerProps {
  userId: string;
  onAddressVerified?: () => void;
}

export function AddressManager({
  userId,
  onAddressVerified,
}: AddressManagerProps) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    address_type: "SHIPPING",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    zip_code: "",
    is_default: false,
  });

  useEffect(() => {
    fetchAddresses();
  }, [userId]);

  const fetchAddresses = async () => {
    try {
      const response = await fetch(`/api/profile/${userId}/addresses`);
      if (!response.ok) throw new Error("Failed to fetch addresses");
      const data = await response.json();
      setAddresses(data.addresses);
    } catch (error) {
      console.error("Error fetching addresses:", error);
      toast({
        title: "Error",
        description: "Failed to load addresses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const validateAddress = async (addressData: Partial<Address>) => {
    try {
      const response = await fetch("/api/address/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address_line1: addressData.address_line1,
          address_line2: addressData.address_line2,
          city: addressData.city,
          state: addressData.state,
          zip_code: addressData.zip_code,
        }),
      });

      if (!response.ok) throw new Error("Address validation failed");
      const data = await response.json();
      return data.isValid;
    } catch (error) {
      console.error("Error validating address:", error);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate the address first
      const isValid = await validateAddress(formData);
      if (!isValid) {
        toast({
          title: "Invalid Address",
          description: "Please check the address details and try again",
          variant: "destructive",
        });
        return;
      }

      const endpoint = editingAddress
        ? `/api/profile/${userId}/addresses/${editingAddress.id}`
        : `/api/profile/${userId}/addresses`;

      const method = editingAddress ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to save address");

      toast({
        title: "Success",
        description: editingAddress
          ? "Address updated successfully"
          : "Address added successfully",
      });

      // Reset form and refresh addresses
      setFormData({
        address_type: "SHIPPING",
        address_line1: "",
        address_line2: "",
        city: "",
        state: "",
        zip_code: "",
        is_default: false,
      });
      setIsAddingAddress(false);
      setEditingAddress(null);
      await fetchAddresses();

      // Notify parent if address was verified
      if (onAddressVerified) {
        onAddressVerified();
      }
    } catch (error) {
      console.error("Error saving address:", error);
      toast({
        title: "Error",
        description: "Failed to save address",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setFormData({
      address_type: address.address_type,
      address_line1: address.address_line1,
      address_line2: address.address_line2 || "",
      city: address.city,
      state: address.state,
      zip_code: address.zip_code,
      is_default: address.is_default,
    });
    setIsAddingAddress(true);
  };

  const handleDelete = async (addressId: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;

    try {
      const response = await fetch(
        `/api/profile/${userId}/addresses/${addressId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) throw new Error("Failed to delete address");

      toast({
        title: "Success",
        description: "Address deleted successfully",
      });

      await fetchAddresses();
    } catch (error) {
      console.error("Error deleting address:", error);
      toast({
        title: "Error",
        description: "Failed to delete address",
        variant: "destructive",
      });
    }
  };

  if (loading && !addresses.length) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Your Addresses</h3>
          <Dialog open={isAddingAddress} onOpenChange={setIsAddingAddress}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Address
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingAddress ? "Edit Address" : "Add New Address"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address_type">Address Type</Label>
                  <Select
                    value={formData.address_type}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        address_type: value as "SHIPPING" | "BILLING",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select address type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SHIPPING">Shipping</SelectItem>
                      <SelectItem value="BILLING">Billing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address_line1">Address Line 1</Label>
                  <Input
                    id="address_line1"
                    value={formData.address_line1}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address_line1: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address_line2">
                    Address Line 2 (Optional)
                  </Label>
                  <Input
                    id="address_line2"
                    value={formData.address_line2}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address_line2: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) =>
                        setFormData({ ...formData, state: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zip_code">ZIP Code</Label>
                  <Input
                    id="zip_code"
                    value={formData.zip_code}
                    onChange={(e) =>
                      setFormData({ ...formData, zip_code: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_default"
                    checked={formData.is_default}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        is_default: checked as boolean,
                      })
                    }
                  />
                  <Label htmlFor="is_default">Set as default address</Label>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAddingAddress(false);
                      setEditingAddress(null);
                      setFormData({
                        address_type: "SHIPPING",
                        address_line1: "",
                        address_line2: "",
                        city: "",
                        state: "",
                        zip_code: "",
                        is_default: false,
                      });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Saving..." : editingAddress ? "Update" : "Add"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {addresses.map((address) => (
            <Card key={address.id} className="p-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    <span className="font-medium">
                      {address.address_type.charAt(0) +
                        address.address_type.slice(1).toLowerCase()}{" "}
                      Address
                      {address.is_default && (
                        <span className="ml-2 text-sm text-blue-600">
                          (Default)
                        </span>
                      )}
                    </span>
                  </div>
                  <p className="text-sm">
                    {address.address_line1}
                    {address.address_line2 && <>, {address.address_line2}</>}
                  </p>
                  <p className="text-sm">
                    {address.city}, {address.state} {address.zip_code}
                  </p>
                  {address.is_verified && (
                    <span className="text-sm text-green-600">✓ Verified</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(address)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(address.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {!addresses.length && !loading && (
            <div className="text-center py-8 text-gray-500">
              <Home className="h-8 w-8 mx-auto mb-2" />
              <p>No addresses added yet</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
