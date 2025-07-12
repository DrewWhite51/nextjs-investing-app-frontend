// app/api/users/route.js
import { userService } from '@/lib/services/userService'
import { NextResponse } from 'next/server'

export async function GET() {
  const result = await userService.getAllUsers()
  
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }
  
  return NextResponse.json(result.data)
}

export async function POST(request) {
  try {
    const body = await request.json()
    const result = await userService.createUser(body)
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    
    return NextResponse.json(result.data, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
}

// app/api/users/[id]/route.js
import { userService } from '@/lib/services/userService'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
  const result = await userService.getUserById(params.id)
  
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 404 })
  }
  
  return NextResponse.json(result.data)
}

export async function PUT(request, { params }) {
  try {
    const body = await request.json()
    const result = await userService.updateUser(params.id, body)
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    
    return NextResponse.json(result.data)
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
}

export async function DELETE(request, { params }) {
  const result = await userService.deleteUser(params.id)
  
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }
  
  return NextResponse.json({ message: result.message })
}

// app/api/db/status/route.js
import { dbUtils } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  const isConnected = await dbUtils.testConnection()
  const info = await dbUtils.getInfo()
  
  return NextResponse.json({
    connected: isConnected,
    info,
    timestamp: new Date().toISOString()
  })
}