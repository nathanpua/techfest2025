# Exposé

<div align="center">
  <img src="images/iconLanding.png" alt="Exposé Logo" width="150" />
  <h3>AI-Powered Misinformation Detection</h3>
  <p>Analyze news articles and images for misinformation, bias, and AI-generated content</p>
</div>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#frameworks-and-technologies">Tech Stack</a> •
  <a href="#setup">Setup</a> •
  <a href="#how-it-works">How It Works</a> •
  <a href="#pages">Pages</a> •
  <a href="#license">License</a>
</p>

## Features

### 🔍 Comprehensive Content Analysis
- **Reliability Scoring**: Get instant reliability scores for any news article based on factual accuracy, source credibility, and bias detection
- **Bias Detection**: Identify political bias, emotional manipulation, and other persuasion techniques used in news articles
- **Claim Verification**: Automatically identify key claims in articles and verify their accuracy against trusted sources
- **AI-Generated Content Detection**: Detect AI-generated images and text with detailed evidence and confidence scores

### 📊 Detailed Insights
- **Evidence Quality Assessment**: Evaluate the strength and relevance of evidence presented in articles
- **Source Credibility Analysis**: Assess the reliability of cited sources and their expertise
- **Reasoning Soundness**: Analyze the logical consistency and validity of arguments
- **Contextual Completeness**: Identify missing context or information that could change interpretation

### 🔄 User Experience
- **History & Comparison**: Save your analysis history and compare reliability scores across different news sources
- **Customizable Analysis**: Tailor your analysis settings to focus on specific aspects of reliability
- **Browser Extension**: Analyze articles directly from your browser with our convenient Chrome extension
- **Dark Mode Support**: Enjoy a comfortable viewing experience in any lighting condition

### 🛡️ Privacy & Security
- **Secure Authentication**: Robust user authentication with email verification
- **Data Protection**: Strong row-level security ensures users can only access their own data
- **Privacy Controls**: Manage your data and privacy settings with granular controls

## Frameworks and Technologies

### Frontend
<p>
  <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React.js" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Chrome_Extension-4285F4?style=for-the-badge&logo=google-chrome&logoColor=white" alt="Chrome Extension API" />
</p>

### Backend
<p>
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/OpenAI_API-412991?style=for-the-badge&logo=openai&logoColor=white" alt="OpenAI API" />
</p>

### Database
<p>
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
</p>

### Authentication
<p>
  <img src="https://img.shields.io/badge/Supabase_Auth-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase Auth" />
</p>

### Development Tools
<p>
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/npm-CB3837?style=for-the-badge&logo=npm&logoColor=white" alt="npm" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
</p>

### Deployment
<p>
  <img src="https://img.shields.io/badge/Chrome_Web_Store-4285F4?style=for-the-badge&logo=google-chrome&logoColor=white" alt="Chrome Web Store" />
  <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
</p>

### APIs
<p>
  <img src="https://img.shields.io/badge/OpenAI_GPT-412991?style=for-the-badge&logo=openai&logoColor=white" alt="OpenAI GPT API" />
  <img src="https://img.shields.io/badge/Supabase_REST-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase REST API" />
</p>

This tech stack combines modern frontend technologies with powerful AI capabilities and a scalable backend solution, allowing for both web and browser extension implementations of the article analysis tool.

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_OPENAI_API_KEY=your_openai_api_key
   ```
4. Get your OpenAI API key from [OpenAI's platform](https://platform.openai.com/api-keys)
5. Set up a Supabase project:
   - Create a new project at [Supabase](https://supabase.com)
   - Enable email authentication in Authentication > Providers
   - Create the required tables with the following schema:

   ```sql
   -- Scans table
   CREATE TABLE scans (
     id uuid default uuid_generate_v4() primary key,
     created_at timestamp with time zone default now(),
     content text not null,
     source text,
     analysis jsonb,
     user_id uuid references auth.users(id),
     article_url text,
     is_hidden boolean default false,
     image_data text
   );

   -- Profiles table
   CREATE TABLE profiles (
     id uuid primary key references auth.users(id),
     created_at timestamp with time zone default now(),
     updated_at timestamp with time zone default now(),
     full_name text,
     website text,
     avatar_url text
   );

   -- User settings table
   CREATE TABLE user_settings (
     id uuid default uuid_generate_v4() primary key,
     created_at timestamp with time zone default now(),
     updated_at timestamp with time zone default now(),
     user_id uuid references auth.users(id) not null,
     openai_api_key text,
     theme text default 'light',
     email_notifications boolean default true,
     browser_notifications boolean default true
   );
   ```

   - If you already have an existing database without the `image_data` column, run this SQL command:
   ```sql
   ALTER TABLE scans ADD COLUMN image_data TEXT;
   ```

   - Set up Row Level Security (RLS) to protect user data:
   ```sql
   -- Enable RLS on all tables
   ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
   ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
   ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

   -- Create policies for scans table
   CREATE POLICY "Users can only view their own scans"
     ON scans FOR SELECT
     USING (auth.uid() = user_id);

   CREATE POLICY "Users can only insert their own scans"
     ON scans FOR INSERT
     WITH CHECK (auth.uid() = user_id);

   CREATE POLICY "Users can only delete their own scans"
     ON scans FOR DELETE
     USING (auth.uid() = user_id);

   -- Create policies for profiles table
   CREATE POLICY "Users can view their own profile"
     ON profiles FOR SELECT
     USING (auth.uid() = id);

   CREATE POLICY "Users can update their own profile"
     ON profiles FOR UPDATE
     USING (auth.uid() = id);

   CREATE POLICY "Users can insert their own profile"
     ON profiles FOR INSERT
     WITH CHECK (auth.uid() = id);

   -- Create policies for user_settings table
   CREATE POLICY "Users can view their own settings"
     ON user_settings FOR SELECT
     USING (auth.uid() = user_id);

   CREATE POLICY "Users can update their own settings"
     ON user_settings FOR UPDATE
     USING (auth.uid() = user_id);

   CREATE POLICY "Users can insert their own settings"
     ON user_settings FOR INSERT
     WITH CHECK (auth.uid() = user_id);
   ```

6. Start the development server:
   ```
   npm run dev
   ```

## How It Works

### Article Analysis

<div align="center">
  <img src="https://via.placeholder.com/800x400?text=Article+Analysis+Flow" alt="Article Analysis Flow" width="80%" />
</div>

When you submit an article for scanning:

1. The application sends the article text to OpenAI's GPT-4 model
2. The model analyzes the text for misinformation, bias, and reliability
3. The analysis is displayed in a user-friendly format with detailed scores
4. Both the article and analysis are saved to your Supabase database

### Image Analysis

<div align="center">
  <img src="https://via.placeholder.com/800x400?text=Image+Analysis+Flow" alt="Image Analysis Flow" width="80%" />
</div>

When you upload an image for analysis:

1. The application converts the image to base64 format
2. The image is sent to OpenAI's GPT-4o model (with fallback to other vision-capable models)
3. The model analyzes the image for signs of AI generation or manipulation
4. The analysis includes a conclusion, confidence score, and detailed evidence
5. Both the image (as base64) and analysis are saved to your Supabase database

## Pages

### Dashboard
- Main scanning interface with intuitive design
- Submit articles for analysis with paste or URL options
- Upload images for AI-generation detection
- View analysis results in real-time with interactive visualizations
- See recent scans with quick access to detailed reports

### History
- Comprehensive view of all past scans with advanced filtering
- Filter by scan type (articles or images)
- Filter by reliability score or date range
- Sort by date, reliability, or source
- Delete or archive unwanted scans
- View detailed analysis of any scan with expandable sections
- View analyzed images with detection results and evidence

### Settings
- Update profile information and preferences
- Change password and security settings
- Manage API keys for custom OpenAI integration
- Customize appearance with theme options
- Configure notification preferences for scan results

## Authentication Flow

<div align="center">
  <img src="https://via.placeholder.com/800x400?text=Authentication+Flow" alt="Authentication Flow" width="80%" />
</div>

### User Registration
- Email and password registration with validation
- Social login options (Google, GitHub)
- Email verification for account security
- Strong password requirements

### Authentication Process
- JWT-based authentication via Supabase Auth
- Secure token storage and management
- Automatic token refresh
- Session persistence across browser sessions

### Security Features
- Row-level security in database
- User-specific data isolation
- API rate limiting
- CSRF protection

### User Management
- Password reset functionality
- Account recovery options
- Profile management
- Session management across devices

## Contributors
- Tay Kai Wen (@newiakyat)
- Yeo Ke Jun (@yeokjunn)
- Nathan Pua (@nathanpua)
- Stephanie Heather Zaw (@stephan0b)

## License

MIT 

