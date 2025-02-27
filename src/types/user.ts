export interface User {
    _id: string
    userId: string
    name: string
    email: string
    points: number
    membershipLevel: 'Bronze' | 'Silver' | 'Gold' | 'Platinum'
}

export interface UserResponse {
    users: User[]
} 