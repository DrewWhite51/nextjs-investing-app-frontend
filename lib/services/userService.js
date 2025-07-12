import { db } from '../db.js'

export const userService = {
  // Create a new user
  async createUser(userData) {
    try {
      const user = await db.user.create({
        data: userData,
        include: { posts: true }
      })
      return { success: true, data: user }
    } catch (error) {
      console.error('Error creating user:', error)
      return { success: false, error: error.message }
    }
  },

  // Get all users
  async getAllUsers() {
    try {
      const users = await db.user.findMany({
        include: { posts: true },
        orderBy: { createdAt: 'desc' }
      })
      return { success: true, data: users }
    } catch (error) {
      console.error('Error fetching users:', error)
      return { success: false, error: error.message }
    }
  },

  // Get user by ID
  async getUserById(id) {
    try {
      const user = await db.user.findUnique({
        where: { id: parseInt(id) },
        include: { posts: true }
      })
      
      if (!user) {
        return { success: false, error: 'User not found' }
      }
      
      return { success: true, data: user }
    } catch (error) {
      console.error('Error fetching user:', error)
      return { success: false, error: error.message }
    }
  },

  // Update user
  async updateUser(id, userData) {
    try {
      const user = await db.user.update({
        where: { id: parseInt(id) },
        data: userData,
        include: { posts: true }
      })
      return { success: true, data: user }
    } catch (error) {
      console.error('Error updating user:', error)
      return { success: false, error: error.message }
    }
  },

  // Delete user
  async deleteUser(id) {
    try {
      await db.user.delete({
        where: { id: parseInt(id) }
      })
      return { success: true, message: 'User deleted successfully' }
    } catch (error) {
      console.error('Error deleting user:', error)
      return { success: false, error: error.message }
    }
  },

  // Search users by email or name
  async searchUsers(query) {
    try {
      const users = await db.user.findMany({
        where: {
          OR: [
            { email: { contains: query } },
            { name: { contains: query } }
          ]
        },
        include: { posts: true }
      })
      return { success: true, data: users }
    } catch (error) {
      console.error('Error searching users:', error)
      return { success: false, error: error.message }
    }
  }
}