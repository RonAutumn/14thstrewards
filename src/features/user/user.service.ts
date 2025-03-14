export const userService = {
  async getUser(userId: string) {
    try {
      const response = await fetch(`/api/rewards/users/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      const data = await response.json();
      return { profile: data };
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }
}; 