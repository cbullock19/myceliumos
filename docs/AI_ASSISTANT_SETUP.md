# AI Assistant Setup Guide

## Overview

The AI Assistant is a conversational chatbot that helps users create clients, projects, and deliverables through natural language interaction. It's powered by OpenAI's GPT-4 and appears as a floating chat bubble on the dashboard.

## Features

- 🤖 **Natural Language Processing**: Understands user intents like "Create a client for Tesla"
- 🎯 **Smart Data Collection**: Asks follow-up questions to gather required information
- 📝 **Multi-Entity Creation**: Can create clients, projects, and deliverables
- 🎤 **Voice Input**: Supports speech-to-text for hands-free interaction
- ✨ **Beautiful UI**: Modern chat interface with typing indicators and animations

## Setup Instructions

### 1. Environment Variables

Add the following to your `.env.local` file:

```bash
# AI Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### 2. Get OpenAI API Key

1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Navigate to "API Keys" in the sidebar
4. Click "Create new secret key"
5. Copy the key and add it to your `.env.local` file

### 3. Model Requirements

The AI assistant uses GPT-4 which requires:
- OpenAI API access
- Sufficient API credits/billing setup
- GPT-4 model access (may need to be requested)

### 4. Restart the Development Server

After adding the environment variable:

```bash
npm run dev
```

## Usage Examples

The AI assistant can understand various natural language commands:

### Creating Clients
- "Create a new client for Acme Corporation"
- "Add a client named John Smith from Tesla Inc"
- "I need to set up a new client for social media services"

### Creating Projects
- "Create a website project for my client Acme Corp"
- "New project for mobile app development"
- "Start a marketing campaign project for Tesla"

### Creating Deliverables
- "Add a logo design deliverable for Acme"
- "Create a social media post for this week"
- "I need to add an SEO audit task"

## How It Works

1. **Intent Recognition**: The AI analyzes user messages to understand what they want to create
2. **Data Extraction**: Extracts available information from the user's message
3. **Information Gathering**: Asks follow-up questions for missing required fields
4. **Entity Creation**: Makes API calls to create the requested entity
5. **Confirmation**: Provides feedback and optionally navigates to the new entity

## Required Information by Entity

### Client
- **Required**: Name, Company Name, Email, At least one Service Type
- **Optional**: Phone, Notes

### Project  
- **Required**: Project Name, Client
- **Optional**: Description, Start/End Dates, Budget, Manager, Priority

### Deliverable
- **Required**: Title, Client, Service Type
- **Optional**: Description, Project, Assignee, Due Date, Priority

## Troubleshooting

### "Failed to process your message"
- Check that `OPENAI_API_KEY` is set in your environment
- Verify your OpenAI API key is valid and has credits
- Ensure you have access to GPT-4 model

### "Authentication required"
- Make sure you're logged in to the application
- Check that your user session is active

### Voice recognition not working
- Voice input requires a modern browser with Web Speech API support
- Allow microphone permissions when prompted
- Chrome and Edge have the best support

## Cost Considerations

- Each AI conversation uses OpenAI API tokens
- GPT-4 is more expensive than GPT-3.5
- Consider implementing usage limits for production
- Monitor API usage in OpenAI dashboard

## Security Notes

- Never commit API keys to version control
- Use environment variables for all sensitive configuration
- Consider rate limiting for production deployments
- The AI has access to organization data for context

## Future Enhancements

Planned improvements:
- Support for more entity types (team members, service types)
- Integration with other AI providers (Claude, Gemini)
- Custom AI prompts per organization
- Voice output/responses
- File upload support
- Integration with calendar and task management 