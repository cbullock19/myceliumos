const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createSampleDeliverables() {
  try {
    console.log('🚀 Creating sample deliverables...');

    // Get organization ID (assuming we use the first one)
    const org = await prisma.organization.findFirst();
    if (!org) {
      throw new Error('No organization found');
    }

    // Get sample data
    const clients = await prisma.client.findMany({ take: 3 });
    const serviceTypes = await prisma.serviceType.findMany();
    const users = await prisma.user.findMany({ take: 2 });

    if (clients.length === 0 || serviceTypes.length === 0 || users.length === 0) {
      throw new Error('Need clients, service types, and users to create deliverables');
    }

    const sampleDeliverables = [
      {
        title: "Instagram Content Calendar - Q1 2024",
        description: "Create a comprehensive content calendar for Q1 with 90 posts, including captions, hashtags, and visual concepts for Nicole's fitness coaching business.",
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        clientId: clients[0].id,
        serviceTypeId: serviceTypes.find(st => st.name === 'Social Media Management')?.id,
        assignedUserId: users[0].id,
        createdById: users[1].id,
        organizationId: org.id,
        customFields: {
          "platform": "Instagram",
          "postCount": "90",
          "themes": "Fitness motivation, nutrition tips, workout routines"
        }
      },
      {
        title: "SEO Audit & Strategy Report",
        description: "Comprehensive SEO audit of current website performance and detailed strategy document for improving organic search rankings.",
        status: 'NEEDS_REVIEW',
        priority: 'MEDIUM',
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
        clientId: clients[1].id,
        serviceTypeId: serviceTypes.find(st => st.name === 'SEO Services')?.id,
        assignedUserId: users[1].id,
        createdById: users[0].id,
        organizationId: org.id,
        customFields: {
          "auditType": "Technical + Content",
          "targetKeywords": "25 primary keywords",
          "competitorAnalysis": "5 main competitors"
        }
      },
      {
        title: "Homepage Redesign Mockups",
        description: "Design 3 homepage layout options with modern UI/UX principles, mobile responsiveness, and conversion optimization focus.",
        status: 'COMPLETED',
        priority: 'HIGH',
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        clientId: clients[2].id,
        serviceTypeId: serviceTypes.find(st => st.name === 'Website Design')?.id,
        assignedUserId: users[0].id,
        createdById: users[1].id,
        organizationId: org.id,
        customFields: {
          "designStyle": "Modern minimalist",
          "colorScheme": "Blue and white",
          "sections": "Hero, Services, Testimonials, Contact"
        }
      },
      {
        title: "Product Demo Video",
        description: "Create a 2-minute product demonstration video showcasing key features and benefits for social media marketing.",
        status: 'PENDING',
        priority: 'MEDIUM',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        clientId: clients[0].id,
        serviceTypeId: serviceTypes.find(st => st.name === 'Video Production')?.id,
        assignedUserId: users[1].id,
        createdById: users[0].id,
        organizationId: org.id,
        customFields: {
          "videoLength": "2 minutes",
          "style": "Professional with motion graphics",
          "platform": "Social media + website"
        }
      },
      {
        title: "Brand Logo Design",
        description: "Design new company logo with 3 concept variations, brand guidelines, and file formats for web and print use.",
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        clientId: clients[1].id,
        serviceTypeId: serviceTypes.find(st => st.name === 'One-Off Projects')?.id,
        assignedUserId: users[0].id,
        createdById: users[1].id,
        organizationId: org.id,
        customFields: {
          "projectType": "Logo Design",
          "concepts": "3 logo concepts",
          "deliverables": "Logo files, brand guidelines, color palette"
        }
      },
      {
        title: "Website Performance Optimization",
        description: "Optimize website loading speed, implement caching, compress images, and improve Core Web Vitals scores.",
        status: 'PENDING',
        priority: 'URGENT',
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow - urgent!
        clientId: clients[2].id,
        serviceTypeId: serviceTypes.find(st => st.name === 'Website Design')?.id,
        assignedUserId: users[1].id,
        createdById: users[0].id,
        organizationId: org.id,
        customFields: {
          "currentSpeed": "2.3s load time",
          "targetSpeed": "Under 1.5s",
          "metrics": "Lighthouse scores, Core Web Vitals"
        }
      },
      {
        title: "Social Media Ad Campaign Setup",
        description: "Create and launch Facebook and Instagram ad campaigns for fitness program promotion with audience targeting and creative assets.",
        status: 'OVERDUE',
        priority: 'URGENT',
        dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Yesterday - overdue!
        clientId: clients[0].id,
        serviceTypeId: serviceTypes.find(st => st.name === 'Social Media Management')?.id,
        assignedUserId: users[0].id,
        createdById: users[1].id,
        organizationId: org.id,
        customFields: {
          "platforms": "Facebook, Instagram",
          "budget": "$500/month",
          "objective": "Lead generation"
        }
      },
      {
        title: "SEO Content Batch - 10 Blog Posts",
        description: "Research, write, and optimize 10 blog posts targeting primary keywords with proper SEO structure and internal linking.",
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
        clientId: clients[1].id,
        serviceTypeId: serviceTypes.find(st => st.name === 'SEO Services')?.id,
        assignedUserId: users[1].id,
        createdById: users[0].id,
        organizationId: org.id,
        customFields: {
          "postCount": "10",
          "wordCount": "1500-2000 per post",
          "keywords": "Fitness, nutrition, wellness"
        }
      }
    ];

    // Create deliverables
    for (const deliverable of sampleDeliverables) {
      try {
        await prisma.deliverable.create({
          data: deliverable
        });
        console.log(`✅ Created: ${deliverable.title}`);
      } catch (error) {
        console.error(`❌ Failed to create: ${deliverable.title}`, error.message);
      }
    }

    console.log(`🎉 Successfully created ${sampleDeliverables.length} sample deliverables!`);
    
    // Show summary
    const allDeliverables = await prisma.deliverable.findMany({
      include: {
        client: { select: { name: true } },
        serviceType: { select: { name: true } }
      }
    });

    console.log('\n📊 Deliverables Summary:');
    const statusCounts = allDeliverables.reduce((acc, d) => {
      acc[d.status] = (acc[d.status] || 0) + 1;
      return acc;
    }, {});
    
    console.log('By Status:', statusCounts);
    
    const priorityCounts = allDeliverables.reduce((acc, d) => {
      acc[d.priority] = (acc[d.priority] || 0) + 1;
      return acc;
    }, {});
    
    console.log('By Priority:', priorityCounts);

  } catch (error) {
    console.error('❌ Error creating sample deliverables:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleDeliverables(); 