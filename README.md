# MDVault

GitHub-powered Markdown content management system. Create, edit, and manage your posts with a modern, intuitive interface.

## What is MDVault?

MDVault is a lightweight, developer-friendly CMS designed for managing Markdown-based content stored directly in GitHub repositories. It provides a clean web interface for writing, editing, and organizing posts without the complexity of traditional CMS platforms.

## Key Features

- **Markdown Editor**: Rich MDX editor with live preview and formatting tools
- **GitHub Integration**: Store all content in your GitHub repository as the single source of truth
- **Image Management**: Upload and organize images with built-in gallery and preview
- **Metadata Management**: Easily manage post titles, descriptions, slugs, tags, and cover images
- **Post Organization**: Browse, search, and manage all posts from a centralized dashboard
- **Draft & Publish**: Save drafts or publish posts directly from the editor

## Why Use MDVault?

- **Cost Effective**: No backend server costs - GitHub is your database
- **Version Control**: Full Git history of all content changes
- **Developer Friendly**: Built for developers who prefer working with Markdown
- **Privacy First**: Your content stays in your own GitHub repository
- **Simple Setup**: Minimal configuration required to get started
- **Modern UI**: Clean, responsive interface that works on desktop and tablet

## Getting Started

### Prerequisites

- Node.js 18+
- Bun or npm installed
- A GitHub repository for storing content
- GitHub Personal Access Token (for API authentication)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/victor3spoir/mdvault.git
cd mdvault
```

1. Install dependencies:

```bash
bun install
# or
npm install
```

1. Set up environment variables:

```bash
cp .env.example .env.local
```

1. Configure your GitHub repository:
   - Add your GitHub token to `.env.local`
   - Specify your repository name for storing content

### Running the Development Server

```bash
bun dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Building for Production

```bash
bun run build
npm run start
```

## How It Works

1. **Connect GitHub**: MDVault connects to your GitHub repository using a personal access token
2. **Store Content**: All posts are stored as Markdown files in your repository
3. **Edit Online**: Use MDVault's web interface to create, edit, and organize content
4. **Version Control**: Every change is automatically committed to GitHub
5. **Deploy**: Push to production whenever your content is ready

## Architecture

- **Frontend**: Next.js 16 with React 19
- **Editor**: MDXEditor with live Markdown support
- **Backend**: GitHub API (Octokit) for content storage
- **Styling**: Tailwind CSS with shadcn/ui components
- **Icons**: Tabler Icons for consistent iconography

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests to help improve MDVault.

## License

MIT License - feel free to use this project for personal or commercial purposes.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
