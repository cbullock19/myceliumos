const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function migrateClientUserRoles() {
  try {
    console.log('🔄 Starting ClientUser role migration...')

    // Update VIEWER roles to COLLABORATOR
    const viewerUpdate = await prisma.clientUser.updateMany({
      where: {
        role: 'VIEWER'
      },
      data: {
        role: 'COLLABORATOR'
      }
    })

    console.log(`✅ Updated ${viewerUpdate.count} VIEWER roles to COLLABORATOR`)

    // Delete any ADMIN roles (they shouldn't exist for client users)
    const adminDelete = await prisma.clientUser.deleteMany({
      where: {
        role: 'ADMIN'
      }
    })

    if (adminDelete.count > 0) {
      console.log(`⚠️  Deleted ${adminDelete.count} ADMIN roles (inappropriate for client users)`)
    } else {
      console.log('✅ No ADMIN roles found to delete')
    }

    // Verify the migration
    const remainingUsers = await prisma.clientUser.findMany({
      select: {
        id: true,
        email: true,
        role: true
      }
    })

    console.log('\n📊 Migration Results:')
    console.log(`Total ClientUsers: ${remainingUsers.length}`)
    
    const roleCounts = remainingUsers.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1
      return acc
    }, {})

    Object.entries(roleCounts).forEach(([role, count]) => {
      console.log(`  ${role}: ${count}`)
    })

    console.log('\n✅ Migration completed successfully!')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the migration
migrateClientUserRoles()
  .then(() => {
    console.log('🎉 Migration script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Migration script failed:', error)
    process.exit(1)
  }) 