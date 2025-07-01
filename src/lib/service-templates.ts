// Service type templates with correct FieldType enum values
export const SERVICE_TEMPLATES = [
  {
    id: 'social-media',
    name: 'Social Media Management',
    description: 'Posts, stories, community management',
    defaultFields: [
      { name: 'Due Date', type: 'DATE', required: true },
      { name: 'Platform', type: 'SELECT', required: true, options: ['Instagram', 'Facebook', 'Twitter', 'LinkedIn', 'TikTok'] },
      { name: 'Post Type', type: 'SELECT', required: true, options: ['Feed Post', 'Story', 'Reel', 'IGTV'] },
      { name: 'Caption', type: 'TEXT', required: false },
      { name: 'Hashtags', type: 'TEXT', required: false },
      { name: 'Dropbox Link', type: 'URL', required: false }
    ]
  },
  {
    id: 'seo',
    name: 'SEO Services',
    description: 'Keyword research, content optimization, reporting',
    defaultFields: [
      { name: 'Due Date', type: 'DATE', required: true },
      { name: 'Target Keywords', type: 'TEXT', required: true },
      { name: 'Page URL', type: 'URL', required: false },
      { name: 'Content Type', type: 'SELECT', required: true, options: ['Blog Post', 'Landing Page', 'Product Page', 'Category Page'] },
      { name: 'Word Count', type: 'NUMBER', required: false },
      { name: 'Google Drive Link', type: 'URL', required: false }
    ]
  },
  {
    id: 'website-design',
    name: 'Website Design',
    description: 'Web design, development, maintenance',
    defaultFields: [
      { name: 'Due Date', type: 'DATE', required: true },
      { name: 'Project Type', type: 'SELECT', required: true, options: ['New Website', 'Redesign', 'Landing Page', 'E-commerce', 'Maintenance'] },
      { name: 'Design Status', type: 'SELECT', required: true, options: ['Wireframe', 'Design', 'Development', 'Testing', 'Live'] },
      { name: 'Client Notes', type: 'TEXTAREA', required: false },
      { name: 'Figma Link', type: 'URL', required: false },
      { name: 'Staging URL', type: 'URL', required: false }
    ]
  },
  {
    id: 'video-production',
    name: 'Video Production',
    description: 'Video editing, motion graphics, animation',
    defaultFields: [
      { name: 'Due Date', type: 'DATE', required: true },
      { name: 'Video Type', type: 'SELECT', required: true, options: ['Social Media Video', 'Commercial', 'Explainer', 'Tutorial', 'Event'] },
      { name: 'Duration', type: 'TEXT', required: false },
      { name: 'Resolution', type: 'SELECT', required: false, options: ['1080p', '4K', '720p'] },
      { name: 'Raw Footage', type: 'URL', required: false },
      { name: 'Final Video', type: 'URL', required: false }
    ]
  },
  {
    id: 'paid-advertising',
    name: 'Paid Advertising',
    description: 'Google Ads, Facebook Ads, campaign management',
    defaultFields: [
      { name: 'Due Date', type: 'DATE', required: true },
      { name: 'Platform', type: 'SELECT', required: true, options: ['Google Ads', 'Facebook Ads', 'Instagram Ads', 'LinkedIn Ads', 'Twitter Ads'] },
      { name: 'Campaign Type', type: 'SELECT', required: true, options: ['Search', 'Display', 'Video', 'Shopping', 'Lead Generation'] },
      { name: 'Budget', type: 'NUMBER', required: false },
      { name: 'Target Audience', type: 'TEXTAREA', required: false },
      { name: 'Ad Creative', type: 'URL', required: false }
    ]
  }
] 