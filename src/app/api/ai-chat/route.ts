import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// Helper function to authenticate requests
async function authenticateRequest(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header')
  }
  
  // Extract token from Bearer header
  const token = authHeader.replace('Bearer ', '')
  const supabase = createSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser(token)
  
  if (error || !user) {
    throw new Error('Invalid or expired token')
  }
  
  // Get user from database with organization
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { organization: true }
  })
  
  if (!dbUser || !dbUser.organization) {
    throw new Error('User not found in database - please complete onboarding')
  }
  
  return { user, dbUser, organizationId: dbUser.organizationId }
}

// Helper to get required data for entity creation
async function getEntityCreationData(organizationId: string) {
  const [clients, serviceTypes, users] = await Promise.all([
    prisma.client.findMany({
      where: { organizationId, status: 'ACTIVE' },
      select: { id: true, name: true, slug: true }
    }),
    prisma.serviceType.findMany({
      where: { organizationId },
      select: { id: true, name: true, slug: true, color: true }
    }),
    prisma.user.findMany({
      where: { organizationId, status: 'ACTIVE' },
      select: { id: true, name: true, email: true, role: true }
    })
  ])
  
  return { clients, serviceTypes, users }
}

// AI prompt for intent recognition and data extraction
const SYSTEM_PROMPT = `You are an AI assistant integrated into the Mycelium OS business management platform. You have FULL CAPABILITY to create clients, projects, and deliverables directly in the database through API calls. When users ask you to create something, you WILL create it - that's your primary function.

IMPORTANT: You are NOT just generating JSON - you are ACTUALLY creating real entities in the live database. When you return a "create_entity" action, the system will immediately create that entity and it will appear in the user's dashboard.

ENTITIES YOU CAN CREATE:
1. CLIENT - A business client/customer
2. PROJECT - A project for a client  
3. DELIVERABLE - A specific task/deliverable within a project

REQUIRED FIELDS:
CLIENT:
- name (required): Client contact person's name
- companyName (required): Company/business name
- contactEmail (required): Valid email address
- contactPhone (optional): Phone number
- notes (optional): Additional notes
- serviceTypeIds (required): Array of service type IDs (at least one)

PROJECT:
- name (required): Project name
- description (optional): Project description
- clientId (required): Client ID
- status (optional): 'PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED'
- priority (optional): 'LOW', 'MEDIUM', 'HIGH', 'URGENT'
- startDate (optional): ISO date string
- endDate (optional): ISO date string
- estimatedHours (optional): Number
- budgetAmount (optional): Number
- managerId (optional): User ID

DELIVERABLE:
- title (required): Deliverable title
- description (optional): Deliverable description
- clientId (required): Client ID
- serviceTypeId (required): Service type ID
- projectId (optional): Project ID
- assignedUserId (optional): User ID
- dueDate (optional): ISO date string
- priority (optional): 'LOW', 'MEDIUM', 'HIGH', 'URGENT'

INSTRUCTIONS:
1. When users ask you to create something, DO IT! You have full database access through API calls.
2. If you have enough information, immediately extract the fields and return JSON with "action": "create_entity" 
3. If you need more information, ask follow-up questions naturally, but always aim to create the entity
4. NEVER say you "cannot create things" or "don't have access" - you absolutely do!
5. When asking for service types, clients, or users, reference the available options provided
6. Use the exact IDs from the provided data
7. For dates, accept natural language and convert to ISO format
8. Be confident, helpful, and use emojis occasionally
9. After creating something, tell the user it was successfully created and will appear in their dashboard

RESPONSE FORMAT:
For creating an entity (this will ACTUALLY create it in the database):
{
  "action": "create_entity",
  "type": "client|project|deliverable", 
  "data": { ... entity fields ... },
  "response": "✅ Successfully created [entity type] '[name]'! It's now live in your dashboard and ready to use."
}

For asking questions:
{
  "action": "ask_question",
  "response": "Your question or guidance"
}

For general conversation:
{
  "action": "conversation",
  "response": "Your helpful response"
}

EXAMPLE INTERACTION:
User: "Create a new client for Tesla"
Your response: 
{
  "action": "create_entity",
  "type": "client",
  "data": {
    "name": "Elon Musk",
    "companyName": "Tesla",
    "contactEmail": "contact@tesla.com",
    "serviceTypeIds": ["service_type_id_here"]
  },
  "response": "✅ Successfully created client 'Tesla'! It's now live in your dashboard and ready to use."
}

Remember: You are CREATING REAL DATA, not just simulating or generating examples!`

export async function POST(request: NextRequest) {
  try {
    const { dbUser, organizationId } = await authenticateRequest(request)
    const { message, history } = await request.json()
    
    console.log('🤖 AI Chat - Processing message:', { message, userId: dbUser.id })
    
    // Get available data for context
    const { clients, serviceTypes, users } = await getEntityCreationData(organizationId)
    
    // Build context for AI
    const contextData = {
      availableClients: clients,
      availableServiceTypes: serviceTypes,
      availableUsers: users,
      currentUser: {
        id: dbUser.id,
        name: dbUser.name,
        role: dbUser.role
      }
    }
    
    // Prepare messages for OpenAI
    const messages = [
      {
        role: 'system' as const,
        content: `${SYSTEM_PROMPT}\n\nAVAILABLE DATA:\n${JSON.stringify(contextData, null, 2)}`
      },
      // Add conversation history
      ...history.map((msg: any) => ({
        role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content
      })),
      {
        role: 'user' as const,
        content: message
      }
    ]
    
    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      temperature: 0.7,
      max_tokens: 1000
    })
    
    const aiResponse = completion.choices[0]?.message?.content
    if (!aiResponse) {
      throw new Error('No response from AI')
    }
    
    let parsedResponse
    try {
      parsedResponse = JSON.parse(aiResponse)
    } catch {
      // If not JSON, treat as simple text response
      return NextResponse.json({
        response: aiResponse
      })
    }
    
    // Handle entity creation
    if (parsedResponse.action === 'create_entity') {
      const { type, data } = parsedResponse
      
      let createdEntity
      
      switch (type) {
        case 'client':
          // Create client
          const clientData = {
            ...data,
            organizationId,
            createdById: dbUser.id,
            slug: data.companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
          }
          
          createdEntity = await prisma.client.create({
            data: clientData
          })
          
                     // Create service assignments
           if (data.serviceTypeIds?.length > 0) {
             await prisma.clientAssignment.createMany({
               data: data.serviceTypeIds.map((serviceTypeId: string) => ({
                 clientId: createdEntity.id,
                 serviceTypeId,
                 status: 'ACTIVE',
                 isActive: true,
                 assignedAt: new Date(),
                 assignedById: dbUser.id
               }))
             })
           }
          break
          
        case 'project':
          createdEntity = await prisma.project.create({
            data: {
              ...data,
              organizationId,
              createdById: dbUser.id,
              slug: data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
              startDate: data.startDate ? new Date(data.startDate) : undefined,
              endDate: data.endDate ? new Date(data.endDate) : undefined,
              estimatedHours: data.estimatedHours ? parseInt(data.estimatedHours) : undefined,
              budgetAmount: data.budgetAmount ? parseFloat(data.budgetAmount) : undefined
            }
          })
          break
          
        case 'deliverable':
          createdEntity = await prisma.deliverable.create({
            data: {
              ...data,
              organizationId,
              createdById: dbUser.id,
              status: 'PENDING',
              dueDate: data.dueDate ? new Date(data.dueDate) : undefined
            }
          })
          break
          
        default:
          throw new Error(`Unknown entity type: ${type}`)
      }
      
      console.log(`✅ Created ${type}:`, createdEntity)
      
      return NextResponse.json({
        response: parsedResponse.response,
        entityCreated: {
          type,
          data: createdEntity
        }
      })
    }
    
    // Return AI response for questions or conversation
    return NextResponse.json({
      response: parsedResponse.response
    })
    
  } catch (error: any) {
    console.error('❌ AI Chat error:', error)
    
    if (error.message.includes('Authentication') || error.message.includes('token')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    return NextResponse.json({
      response: "I apologize, but I'm having trouble processing your request right now. Please try again or use the manual forms to create your items."
    })
  }
} 