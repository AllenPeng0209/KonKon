# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

KonKon is a React Native/Expo family calendar management app with AI chat functionality, built with TypeScript and integrated with Supabase as the backend. The app features 30+ unique calendar view styles, family management, expense tracking, and AI-powered chat assistance using Alibaba's Bailian AI service.

## Development Commands

### Build and Run
```bash
# Start development server
npm start

# Platform-specific development
npm run android
npm run ios
npm run web

# Testing
npm test
npm run test:watch
npm run test:coverage

# Code quality
npm run lint
```

### AI Service Testing
```bash
# Test Bailian AI integration
npm run test-bailian

# Test calendar AI features
npm run test-bailian-omni
```

### Apple Authentication
```bash
# Generate Apple client secret for authentication
npm run generate-apple-secret
```

## Architecture Overview

### Core Technology Stack
- **Frontend**: React Native 0.79.5 with Expo ~53.0.16
- **Navigation**: Expo Router with file-based routing
- **Backend**: Supabase (PostgreSQL database, Auth, Real-time)
- **AI Services**: Alibaba Bailian (qwen2.5-omni-7b model) + OpenAI
- **State Management**: React Context + Custom Hooks
- **Styling**: React Native Paper + Custom themed components
- **Internationalization**: i18n-js with 4 languages (en, ja, zh-CN, zh-TW)

### Key Architectural Patterns

#### Authentication & Authorization
- Protected routes using `useAuth` hook and route guards in `app/_layout.tsx:55-66`
- Apple Sign-In integration with JWT token generation
- Session persistence via AsyncStorage
- Family-based access control

#### Navigation Structure
- Main tab navigation: Home (Calendar), Explore (Chat), with gesture-based navigation
- Side drawer accessible via swipe gestures (`app/_layout.tsx:36-49`)
- Avatar screen accessible via left swipe gesture

#### Calendar System Architecture
- **30+ Calendar Views**: Each view is a separate component in `components/calendar/`
- **View Selector**: `CalendarViewSelector.tsx` manages view switching
- **Service Layer**: `lib/calendarService.ts` handles all calendar operations
- **Recurring Events**: `lib/recurrenceEngine.ts` processes complex recurrence patterns
- **Real-time Updates**: Supabase real-time subscriptions for family calendar sync

#### AI Integration
- **Chat System**: Multi-layered chat architecture with caching
  - `useChat.ts` - Core chat state management
  - `useFamilyChat.ts` - Family-specific chat features
  - `lib/familyChatCache.ts` - Local conversation caching
- **Voice Integration**: `components/VoiceToCalendar.tsx` with WebSocket ASR
- **Multi-modal AI**: Bailian Omni model for voice + text calendar creation

#### Database Design
- **Type-Safe Operations**: Auto-generated types in `lib/database.types.ts`
- **Migration System**: Versioned SQL migrations in `supabase/migrations/`
- **Service Pattern**: Database operations abstracted into service modules
- **Real-time Sync**: Supabase channels for family data synchronization

## Code Conventions

### File Organization
- **Pages**: `/app/` - Expo Router file-based routing
- **Components**: `/components/` - Reusable UI components
  - `/calendar/` - Calendar view components
  - `/chat/` - Chat-related components  
  - `/ui/` - Base UI components
- **Business Logic**: `/lib/` - Services, utilities, API integrations
- **State**: `/contexts/` - React Context providers
- **Hooks**: `/hooks/` - Custom React hooks
- **Types**: Generated Supabase types in `lib/database.types.ts`

### TypeScript Standards
- Strict TypeScript configuration enabled
- Use Supabase generated types for all database operations
- Define explicit interfaces for component props
- Leverage `@/*` path aliases for clean imports

### Component Patterns
```typescript
// Component props interface
interface ComponentProps {
  title: string;
  onPress?: () => void;
  isVisible: boolean;
}

// Use React.FC with explicit typing
const Component: React.FC<ComponentProps> = ({ title, onPress, isVisible }) => {
  // Component implementation
};
```

### Database Operations
```typescript
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

// Type-safe database operations
type Event = Database['public']['Tables']['events']['Row'];

const { data: events, error } = await supabase
  .from('events')
  .select('*')
  .eq('family_id', familyId);
```

## Environment Configuration

### Required Environment Variables
```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Alibaba Bailian AI
EXPO_PUBLIC_BAILIAN_API_KEY=your_bailian_api_key
EXPO_PUBLIC_BAILIAN_ENDPOINT=https://dashscope-intl.aliyuncs.com
EXPO_PUBLIC_BAILIAN_WORKSPACE_ID=your_workspace_id

# Apple Authentication
APPLE_TEAM_ID=your_apple_team_id
APPLE_KEY_ID=your_apple_key_id
APPLE_PRIVATE_KEY=your_apple_private_key
```

## Key Features & Components

### Calendar Views System
- 30+ unique calendar visualizations (Bento Box, Garden, Constellation Wheel, etc.)
- View switching via `CalendarViewSelector.tsx`
- Each view implements consistent interface defined in `CalendarViewTypes.ts`

### Family Management
- Multi-user family groups with role-based permissions
- Real-time calendar synchronization across family members
- Family chat with AI assistance integration

### AI Chat Features
- Conversation caching for performance optimization
- Voice-to-text calendar event creation
- Multi-language support with context-aware responses
- Family conversation sharing capabilities

### Meal Management
- Daily meal tracking with nutrition analysis
- Multiple view types (Daily Records, Weekly Overview, Nutrition Charts)
- Integration with calendar for meal planning

## Database Schema Key Tables

- `events` - Calendar events with recurrence support
- `families` - Family group management
- `family_members` - User-family relationships
- `conversations` - AI chat conversations
- `conversation_shares` - Family chat sharing
- `expenses` - Family expense tracking
- `memory_interactions` - AI memory system

## Testing Strategy

- Jest configuration for unit testing
- Component testing with React Native Testing Library
- AI service integration testing via custom scripts
- Manual testing guidelines in various `.md` documentation files

## Platform-Specific Considerations

- iOS and Android icon sets in `/assets/images/icon-pack/`
- Platform-specific components using `.ios.tsx` and `.android.tsx` extensions
- Gesture handling optimized for mobile interaction patterns
- Apple App Store authentication compliance

## Chore Management System

### Architecture Overview
The chore management system is built following the same patterns as the calendar system, with a comprehensive view system, database layer, and service architecture.

### Database Schema
- **chore_templates**: Pre-defined chore types with instructions and metadata
- **chore_tasks**: Actual assigned chores with status tracking
- **chore_completions**: Historical completion records with quality ratings
- **chore_skills**: Member skill levels by category
- **chore_points**: Gamification points system
- **chore_rewards**: Point redemption rewards
- **chore_assignment_rules**: Automated assignment rules

### Service Layer Architecture
- **ChoreTaskService**: CRUD operations for chore tasks
- **ChoreTemplateService**: Manage chore templates
- **ChoreStatsService**: Generate statistics and reports
- **ChoreSkillService**: Track member skill progression
- **ChorePointService**: Handle points and rewards

### View System (25+ Views)
Similar to calendar views, chores support multiple visualization styles:
- **Basic Views**: Task Board, Calendar Grid, Timeline, List
- **Family Views**: Family Dashboard, Member Rotation, Responsibility Wheel
- **Gamified Views**: Achievement Board, Progress Garden, Skill Tree
- **Data Views**: Stats Dashboard, Completion Heatmap, Workload Balance
- **Themed Views**: Kitchen Commander, Cleaning Ninja, Home Hero

### Key Components
- `ChoreViewSelector`: Main view switching component
- `AddChoreModal`: Task creation with template support
- `ChoreTaskModal`: Task details and completion tracking
- `ChoreViewStyleModal`: View style selection interface
- `ChoreStatsReport`: Statistics and performance reporting

### Usage Patterns
```typescript
// Using the chore service
import { ChoreTaskService } from '@/lib/choreService';

// Create new chore task
const task = await ChoreTaskService.create({
  family_id: familyId,
  title: 'Clean Kitchen',
  category: '清潔',
  assigned_to: memberId,
  due_date: new Date().toISOString(),
  priority: 3
});

// Mark task completed
await ChoreTaskService.markCompleted(taskId, userId, {
  notes: 'Kitchen is spotless!',
  timeTaken: 30,
  qualityRating: 5
});
```

### Integration Points
- Accessible via Settings → Family → Chore Management
- Supports same family context as calendar system
- Uses consistent authentication and member management
- Integrates with notification system for reminders

## Performance Optimizations

- Conversation caching reduces AI API calls
- Lazy loading for calendar view components
- Optimized database queries with proper indexing
- Image optimization and lazy loading strategies
- Chore view component lazy loading for performance
- Efficient caching of family chore statistics