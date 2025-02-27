'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { rewardsService } from '@/features/rewards/rewards.service'
import { type User } from '@/types/user'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const response = await rewardsService.getAllUsers()
      setUsers(response.users || [])
    } catch (error) {
      console.error('Failed to load users:', error)
      toast({
        title: 'Error',
        description: 'Failed to load users. Please try again later.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateMembership = async (userId: string, membershipLevel: User['membershipLevel']) => {
    try {
      await rewardsService.updateUserMembership(userId, membershipLevel)
      await loadUsers()
      toast({
        title: 'Success',
        description: 'Membership level updated successfully!',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update membership level.',
        variant: 'destructive',
      })
    }
  }

  const handleUpdatePoints = async (userId: string) => {
    const points = prompt('Enter points to add/remove (use negative for removal):')
    if (!points) {
      return; // User cancelled
    }

    const pointsNumber = Number(points);
    if (isNaN(pointsNumber) || !Number.isFinite(pointsNumber)) {
      toast({
        title: 'Error',
        description: 'Please enter a valid number for points.',
        variant: 'destructive',
      })
      return;
    }

    // Format points for display
    const formattedPoints = Math.abs(pointsNumber).toLocaleString();

    try {
      // Make the API call with just points
      await rewardsService.updateUserPoints(
        userId,
        pointsNumber
      );
      
      // Reload users list
      await loadUsers();
      
      // Show success message
      const action = pointsNumber >= 0 ? 'added' : 'deducted';
      toast({
        title: 'Success',
        description: `Successfully ${action} ${formattedPoints} points.`,
      });
    } catch (error) {
      console.error('Debug - Failed to update points:', {
        error,
        userId,
        points: pointsNumber,
        time: new Date().toISOString()
      });
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to update points';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }

  if (loading) {
    return <div>Loading users...</div>
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User ID</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Membership Level</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length > 0 ? (
                users.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>{user.userId}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Select
                        defaultValue={user.membershipLevel}
                        onValueChange={(value) => handleUpdateMembership(user.userId, value as User['membershipLevel'])}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select membership" />
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
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => handleUpdatePoints(user.userId)}
                        >
                          Adjust Points
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No users found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
} 