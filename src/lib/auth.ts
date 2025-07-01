import { prisma } from './prisma'
import { User, UserRole, UserStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { createSupabaseAdminClient } from './supabase'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: UserRole
  status: UserStatus
  organizationId: string
  permissions?: any
  organization?: {
    id: string
    name: string
    slug: string
    branding?: any
  }
}

export interface CustomPermissions {
  canCreateClients: boolean
  canEditClients: boolean
  canDeleteClients: boolean
  canCreateDeliverables: boolean
  canEditDeliverables: boolean
  canDeleteDeliverables: boolean
  canInviteUsers: boolean
  canEditUsers: boolean
  canDeleteUsers: boolean
  serviceTypeAccess: string[]
  clientAccess: 'assigned' | 'service_type' | 'all'
}

// Default permissions by role
export const getDefaultPermissions = (role: UserRole): CustomPermissions => {
  switch (role) {
    case UserRole.ADMIN:
      return {
        canCreateClients: true,
        canEditClients: true,
        canDeleteClients: true,
        canCreateDeliverables: true,
        canEditDeliverables: true,
        canDeleteDeliverables: true,
        canInviteUsers: true,
        canEditUsers: true,
        canDeleteUsers: true,
        serviceTypeAccess: [],
        clientAccess: 'all'
      }
    case UserRole.VIDEO_EDITOR:
      return {
        canCreateClients: false,
        canEditClients: false,
        canDeleteClients: false,
        canCreateDeliverables: true,
        canEditDeliverables: true,
        canDeleteDeliverables: false,
        canInviteUsers: false,
        canEditUsers: false,
        canDeleteUsers: false,
        serviceTypeAccess: ['social-media'],
        clientAccess: 'assigned'
      }
    case UserRole.SEO_STRATEGIST:
      return {
        canCreateClients: false,
        canEditClients: false,
        canDeleteClients: false,
        canCreateDeliverables: true,
        canEditDeliverables: true,
        canDeleteDeliverables: false,
        canInviteUsers: false,
        canEditUsers: false,
        canDeleteUsers: false,
        serviceTypeAccess: ['seo'],
        clientAccess: 'assigned'
      }
    case UserRole.WEBSITE_DESIGNER:
      return {
        canCreateClients: false,
        canEditClients: false,
        canDeleteClients: false,
        canCreateDeliverables: true,
        canEditDeliverables: true,
        canDeleteDeliverables: false,
        canInviteUsers: false,
        canEditUsers: false,
        canDeleteUsers: false,
        serviceTypeAccess: ['website-design'],
        clientAccess: 'assigned'
      }
    case UserRole.FILMER:
      return {
        canCreateClients: false,
        canEditClients: false,
        canDeleteClients: false,
        canCreateDeliverables: true,
        canEditDeliverables: true,
        canDeleteDeliverables: false,
        canInviteUsers: false,
        canEditUsers: false,
        canDeleteUsers: false,
        serviceTypeAccess: ['video-production'],
        clientAccess: 'assigned'
      }
    default:
      return {
        canCreateClients: false,
        canEditClients: false,
        canDeleteClients: false,
        canCreateDeliverables: false,
        canEditDeliverables: false,
        canDeleteDeliverables: false,
        canInviteUsers: false,
        canEditUsers: false,
        canDeleteUsers: false,
        serviceTypeAccess: [],
        clientAccess: 'assigned'
      }
  }
}

// Permission validation
export const checkPermission = (user: AuthUser, action: string, resource?: any): boolean => {
  // Admin users have all permissions within their organization
  if (user.role === UserRole.ADMIN) {
    return true
  }

  const permissions = user.permissions || getDefaultPermissions(user.role)

  switch (action) {
    case 'create:clients':
      return permissions.canCreateClients
    case 'edit:clients':
      return permissions.canEditClients
    case 'delete:clients':
      return permissions.canDeleteClients
    case 'create:deliverables':
      return permissions.canCreateDeliverables
    case 'edit:deliverables':
      return permissions.canEditDeliverables && (
        !resource || 
        resource.assignedUserId === user.id || 
        permissions.clientAccess === 'all'
      )
    case 'delete:deliverables':
      return permissions.canDeleteDeliverables
    case 'invite:users':
      return permissions.canInviteUsers
    case 'edit:users':
      return permissions.canEditUsers
    case 'delete:users':
      return permissions.canDeleteUsers
    case 'view:clients':
      if (permissions.clientAccess === 'all') return true
      if (permissions.clientAccess === 'assigned' && resource) {
        return resource.assignments?.some((assignment: any) => assignment.userId === user.id)
      }
      return false
    default:
      return false
  }
}

// Get user with organization data
export const getUserWithOrganization = async (userId: string): Promise<AuthUser | null> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        organization: {
          include: {
            branding: true
          }
        }
      }
    })

    if (!user) return null

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      organizationId: user.organizationId,
      permissions: user.permissions,
      organization: user.organization
    }
  } catch (error) {
    console.error('Error fetching user:', error)
    return null
  }
}

// Create user invitation
export const createUserInvitation = async (
  organizationId: string,
  email: string,
  role: UserRole,
  invitedBy: string,
  permissions?: CustomPermissions
) => {
  try {
    // Generate temporary password
    const temporaryPassword = generateSecurePassword()
    const hashedPassword = await bcrypt.hash(temporaryPassword, 12)

    // Create user in database
    const user = await prisma.user.create({
      data: {
        organizationId,
        email,
        name: email.split('@')[0], // Temporary name, will be updated on first login
        role,
        status: UserStatus.PENDING,
        hashedPassword,
        temporaryPassword: hashedPassword,
        invitedBy,
        invitedAt: new Date(),
                 permissions: role === UserRole.CUSTOM ? (permissions as any) : null
      }
    })

    // Create Supabase auth user
    const supabaseAdmin = createSupabaseAdminClient()
    const { data: authUser, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        organizationId,
        role,
        userId: user.id
      }
    })

    if (error) {
      // Rollback database user creation
      await prisma.user.delete({ where: { id: user.id } })
      throw error
    }

    return {
      user,
      temporaryPassword,
      authUser
    }
  } catch (error) {
    console.error('Error creating user invitation:', error)
    throw error
  }
}

// Generate secure password
const generateSecurePassword = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

// Validate organization access
export const validateOrganizationAccess = async (userId: string, organizationId: string): Promise<boolean> => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        organizationId,
        status: UserStatus.ACTIVE
      }
    })

    return !!user
  } catch (error) {
    console.error('Error validating organization access:', error)
    return false
  }
} 