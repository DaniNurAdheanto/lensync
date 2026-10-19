import React, { useState, useEffect } from 'react';
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  FileJson,
  Layers,
  Camera,
  Server,
  Laptop,
  Database,
  Cloud,
  CheckCircle2,
  Copy,
  Check,
  Play,
  ArrowRight,
  Terminal,
  ExternalLink,
  Cpu,
  RefreshCw,
  HardDrive,
  Eye,
  Shield,
  Smartphone,
  Radio,
  Sliders,
  ChevronRight,
  ChevronDown,
  LayoutTemplate,
  Sparkles
} from 'lucide-react';
import { Navbar } from './components/landing/Navbar';
import { HeroSection } from './components/landing/HeroSection';
import { HowItWorksSection } from './components/landing/HowItWorksSection';
import { FeaturesShowcaseSection } from './components/landing/FeaturesShowcaseSection';
import { CameraCompatibilitySection } from './components/landing/CameraCompatibilitySection';
import { PricingSection } from './components/landing/PricingSection';
import { FaqSection } from './components/landing/FaqSection';
import { CtaBannerSection } from './components/landing/CtaBannerSection';
import { Footer } from './components/landing/Footer';
import { GetStartedModal } from './components/landing/GetStartedModal';
import { formatBytes } from './utils/c2c-helpers';
import { Button, Badge, Accordion, Card, Input, Tabs } from './components/design-system';

interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  category?: 'frontend' | 'backend' | 'agent' | 'contracts' | 'infra' | 'docs' | 'root';
  description?: string;
  children?: FileNode[];
  content?: string;
  language?: string;
}

export default function App() {
  // Navigation mode: 'landing' (Default Landing Page) or 'workbench' (Dev & Architecture Workbench)
  const [viewMode, setViewMode] = useState<'landing' | 'workbench'>('landing');
  const [activeSection, setActiveSection] = useState<string>('home');

  // Modal states
  const [isGetStartedOpen, setIsGetStartedOpen] = useState<boolean>(false);
  const [activeSessionConfig, setActiveSessionConfig] = useState({
    camera: 'Canon EOS R5 Mark II',
    tetherType: 'USB-C 3.2 High-Speed Tether',
    storage: 'MinIO Local Storage (c2c-photos)',
    projectName: 'Paris Fashion Week 2026 - Main Runway',
  });

  // Workbench internal tab states
  const [workbenchTab, setWorkbenchTab] = useState<'explorer' | 'workflow' | 'schema' | 'quickstart' | 'design-system'>('explorer');
  const [selectedFileId, setSelectedFileId] = useState<string>('readme');
  const [copied, setCopied] = useState<boolean>(false);
  const [dsActiveTab, setDsActiveTab] = useState<string>('segmented');
  const [dsInputVal, setDsInputVal] = useState<string>('Canon EOS R5 Mark II');
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({
    frontend: true,
    'frontend/src': true,
    'frontend/src/components': true,
    'frontend/src/features': true,
    backend: true,
    'backend/api': true,
    'backend/desktop-agent': true,
    'backend/infrastructure': true,
    'backend/contracts': true,
  });

  // Simulator states for live tethering demonstration
  const [simStep, setSimStep] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simLogs, setSimLogs] = useState<string[]>([]);

  // Observe active section on scroll
  useEffect(() => {
    if (viewMode !== 'landing') return;

    const handleScroll = () => {
      const sections = ['home', 'features', 'how-it-works', 'pricing', 'faq'];
      const scrollPosition = window.scrollY + 200;

      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [viewMode]);

  const toggleFolder = (path: string) => {
    setOpenFolders((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLaunchSession = (config: typeof activeSessionConfig) => {
    setActiveSessionConfig(config);
    setIsGetStartedOpen(false);
    setViewMode('workbench');
    setWorkbenchTab('workflow');
    runSimulator();
  };

  // Run tethering simulator
  const runSimulator = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setSimStep(1);
    setSimLogs([
      `[00:00.000] 📸 Shutter triggered on ${activeSessionConfig.camera} (1/500s, f/2.8, ISO 100)`,
    ]);

    setTimeout(() => {
      setSimStep(2);
      setSimLogs((prev) => [
        ...prev,
        `[00:00.320] 🔌 ${activeSessionConfig.tetherType}: Written IMG_4894.CR3 (47.2 MB) to hotfolder`,
        `[00:00.820] ⏱️ Watcher debounce: write buffer stable (500ms passed)`,
      ]);
    }, 900);

    setTimeout(() => {
      setSimStep(3);
      setSimLogs((prev) => [
        ...prev,
        `[00:01.100] 🔐 Calculated SHA-256: 7f83b165... (checking deduplication cache: clean)`,
        `[00:01.250] 📥 Enqueued to local UploadQueue (Queue depth: 1, Active workers: 1/3)`,
      ]);
    }, 1800);

    setTimeout(() => {
      setSimStep(4);
      setSimLogs((prev) => [
        ...prev,
        `[00:01.400] 🌐 POST /api/v1/uploads/request-presigned-url -> Returned presigned S3 PUT URL`,
        `[00:01.750] 🚀 Direct S3 Stream (${activeSessionConfig.storage}): 47.2 MB streaming at 52 MB/s via HTTP PUT...`,
      ]);
    }, 2800);

    setTimeout(() => {
      setSimStep(5);
      setSimLogs((prev) => [
        ...prev,
        `[00:02.500] ✅ S3 Stream Completed (HTTP 200 OK)`,
        `[00:02.650] 📤 POST /api/v1/uploads/confirm (EXIF: 50mm, f/2.8, ISO 100, ${activeSessionConfig.camera})`,
        `[00:02.800] ⚡ PostgreSQL record committed -> WebSocket push to Next.js Web Dashboard!`,
      ]);
      setIsSimulating(false);
    }, 3800);
  };

  // Monorepo File Tree for Explorer
  const fileTree: FileNode[] = [
    {
      id: 'readme',
      name: 'README.md',
      type: 'file',
      path: '/README.md',
      category: 'root',
      language: 'markdown',
      description: 'Master documentation explaining the C2C monorepo structure, C2C concept, prerequisites, and quickstart commands.',
      content: `# Camera-to-Cloud (C2C) Monorepo\n\nPlatform otomatis upload foto dari kamera DSLR/Mirrorless atau Smartphone melalui USB tethering langsung ke Cloud Storage (S3-compatible) secara real-time saat sesi pemotretan berlangsung.\n\n## 🏛️ Arsitektur Monorepo\n- apps/web: Next.js 14, TypeScript, Tailwind CSS\n- apps/desktop-agent: Go Daemon (Watcher, USB Tether, Queue, S3 Uploader)\n- services/api: Go REST API (Echo/Chi, PostgreSQL, S3 Presigned URL, Auth)\n- packages/api-contracts: OpenAPI 3.0 specs & shared TypeScript/Go definitions\n- infrastructure: Local dev stack (PostgreSQL, MinIO S3, Redis)`,
    },
    {
      id: 'env-example',
      name: '.env.example',
      type: 'file',
      path: '/.env.example',
      category: 'root',
      language: 'shell',
      description: 'Centralized environment template with configs for PostgreSQL, MinIO, API server, Agent, and Next.js web.',
      content: `ENVIRONMENT=development\nPOSTGRES_DB=c2c_db\nPOSTGRES_USER=c2c_user\nPOSTGRES_PASSWORD=c2c_secret_password\nS3_ENDPOINT=localhost:9000\nS3_ACCESS_KEY=minioadmin\nS3_SECRET_KEY=minioadmin123\nS3_BUCKET_NAME=c2c-photos\nAPI_PORT=8080\nJWT_SECRET=super_secret_c2c_jwt_token_key_change_in_production_32bytes\nWATCH_DIRECTORY=/Users/photographer/Pictures/C2C_HotFolder\nNEXT_PUBLIC_API_URL=http://localhost:8080/api/v1`,
    },
    {
      id: 'docker-compose',
      name: 'docker-compose.yml',
      type: 'file',
      path: '/docker-compose.yml',
      category: 'root',
      language: 'yaml',
      description: 'Root Docker Compose file orchestrating PostgreSQL 16, MinIO S3 with bucket auto-init, and Redis.',
      content: `name: camera-to-cloud\nservices:\n  postgres:\n    image: postgres:16-alpine\n    ports: ["5432:5432"]\n  minio:\n    image: minio/minio:RELEASE.2024-03-05T04-48-44Z\n    ports: ["9000:9000", "9001:9001"]\n  minio-init:\n    image: minio/mc:RELEASE.2024-03-05T04-48-44Z\n    depends_on: { minio: { condition: service_healthy } }\n  redis:\n    image: redis:7-alpine\n    ports: ["6379:6379"]`,
    },
    {
      id: 'makefile',
      name: 'Makefile',
      type: 'file',
      path: '/Makefile',
      category: 'root',
      language: 'makefile',
      description: 'Developer convenience commands (make up, make down, make api, make agent, make web).',
      content: `up:\n\tdocker compose -f infrastructure/docker-compose.yml up -d\ndown:\n\tdocker compose -f infrastructure/docker-compose.yml down\napi:\n\tcd services/api && go run cmd/server/main.go\nagent:\n\tcd apps/desktop-agent && go run cmd/agent/main.go\nweb:\n\tcd apps/web && npm run dev`,
    },
    {
      id: 'backend',
      name: 'backend',
      type: 'folder',
      path: 'backend',
      children: [
        {
          id: 'backend-api',
          name: 'api (Go REST Backend)',
          type: 'folder',
          path: 'backend/api',
          children: [
            {
              id: 'api-go-mod',
              name: 'go.mod',
              type: 'file',
              path: '/backend/api/go.mod',
              category: 'backend',
              language: 'go',
              description: 'Go module declaration for backend REST API with PostgreSQL driver and JWT.',
              content: `module github.com/c2c/api\n\ngo 1.22\n\nrequire (\n\tgithub.com/golang-jwt/jwt/v5 v5.2.1\n\tgithub.com/google/uuid v1.6.0\n\tgithub.com/lib/pq v1.10.9\n)`,
            },
            {
              id: 'api-main',
              name: 'cmd/server/main.go',
              type: 'file',
              path: '/backend/api/cmd/server/main.go',
              category: 'backend',
              language: 'go',
              description: 'Backend entry point: database connection, S3 storage client, repository injection, and HTTP server.',
              content: `package main\n\n// C2C REST API Server listening on port 8080\n// Clean layered architecture: Handlers -> Services -> Repositories -> PostgreSQL`,
            },
            {
              id: 'api-models',
              name: 'internal/models/models.go',
              type: 'file',
              path: '/backend/api/internal/models/models.go',
              category: 'backend',
              language: 'go',
              description: 'Core domain models: User, Project, ShootSession, Device, Photo, and UploadTask.',
              content: `package models\n\ntype Photo struct {\n\tID string\n\tSessionID string\n\tOriginalFilename string\n\tSHA256Hash string\n\tS3KeyOriginal string\n\tCameraMake string\n\tCameraModel string\n\tISOSpeed int\n\tUploadStatus string\n}`,
            },
          ],
        },
        {
          id: 'backend-desktop-agent',
          name: 'desktop-agent (Go Ingestion Daemon)',
          type: 'folder',
          path: 'backend/desktop-agent',
          children: [
            {
              id: 'agent-go-mod',
              name: 'go.mod',
              type: 'file',
              path: '/backend/desktop-agent/go.mod',
              category: 'agent',
              language: 'go',
              description: 'Go module declaration for desktop-agent daemon.',
              content: `module github.com/c2c/desktop-agent\n\ngo 1.22\n\nrequire (\n\tgopkg.in/yaml.v3 v3.0.1\n)`,
            },
            {
              id: 'agent-main',
              name: 'cmd/agent/main.go',
              type: 'file',
              path: '/backend/desktop-agent/cmd/agent/main.go',
              category: 'agent',
              language: 'go',
              description: 'Main daemon entry point: initializes watcher, tether detector, queue manager, and S3 direct uploader.',
              content: `package main\n\nimport (\n\t"log"\n\t"github.com/c2c/desktop-agent/internal/watcher"\n\t"github.com/c2c/desktop-agent/internal/queue"\n)\n\nfunc main() {\n\tlog.Println("📷 Camera-to-Cloud (C2C) Desktop Agent Daemon")\n\t// Watch folder -> calculate SHA256 -> Enqueue -> S3 Upload -> API Confirm\n}`,
            },
            {
              id: 'agent-watcher',
              name: 'internal/watcher/watcher.go',
              type: 'file',
              path: '/backend/desktop-agent/internal/watcher/watcher.go',
              category: 'agent',
              language: 'go',
              description: 'File watcher detecting RAW (CR3, ARW, NEF, DNG) and JPEG photos with write-buffer debounce and SHA-256 deduplication.',
              content: `package watcher\n\n// FileWatcher monitors local hotfolder\n// - Waits for camera buffer flush (minFileAge)\n// - Calculates SHA-256 hash\n// - Emits DetectedPhoto to upload channel`,
            },
            {
              id: 'agent-queue',
              name: 'internal/queue/queue.go',
              type: 'file',
              path: '/backend/desktop-agent/internal/queue/queue.go',
              category: 'agent',
              language: 'go',
              description: 'Concurrent worker pool managing upload tasks, retry backoff, and failure recovery.',
              content: `package queue\n\n// UploadQueue manages worker pool (concurrency: 3)\n// - Processes tasks\n// - Auto-retries on connection drops\n// - Graceful shutdown`,
            },
          ],
        },
        {
          id: 'backend-infra',
          name: 'infrastructure',
          type: 'folder',
          path: 'backend/infrastructure',
          children: [
            {
              id: 'infra-compose',
              name: 'docker-compose.yml',
              type: 'file',
              path: '/backend/infrastructure/docker-compose.yml',
              category: 'infra',
              language: 'yaml',
              description: 'Local services stack: PostgreSQL 16 container, MinIO S3 server, bucket setup script, and Redis.',
              content: `services:\n  postgres: { image: postgres:16-alpine }\n  minio: { image: minio/minio, command: server /data --console-address ":9001" }\n  minio-init: { image: minio/mc }\n  redis: { image: redis:7-alpine }`,
            },
          ],
        },
        {
          id: 'backend-contracts',
          name: 'contracts',
          type: 'folder',
          path: 'backend/contracts',
          children: [
            {
              id: 'contracts-openapi',
              name: 'openapi.yaml',
              type: 'file',
              path: '/backend/contracts/openapi.yaml',
              category: 'contracts',
              language: 'yaml',
              description: 'Comprehensive OpenAPI 3.1 specification for all REST endpoints, request bodies, and schemas.',
              content: `openapi: 3.1.0\ninfo:\n  title: Camera-to-Cloud (C2C) Ingestion & Streaming API\n  version: 1.0.0`,
            },
          ],
        },
      ],
    },
    {
      id: 'frontend',
      name: 'frontend',
      type: 'folder',
      path: 'frontend',
      children: [
        {
          id: 'frontend-readme',
          name: 'README.md',
          type: 'file',
          path: '/frontend/README.md',
          category: 'frontend',
          language: 'markdown',
          description: 'Frontend documentation, architecture, tech stack, and Next.js start instructions.',
          content: `# Camera-to-Cloud (Frontend)\nAplikasi Web Frontend & Landing Page untuk platform Camera-to-Cloud (C2C), dibangun dengan Next.js 14, TypeScript, Tailwind CSS, dan Untitled UI Design System.`,
        },
        {
          id: 'frontend-package',
          name: 'package.json',
          type: 'file',
          path: '/frontend/package.json',
          category: 'frontend',
          language: 'json',
          description: 'Frontend dependencies, Next.js 14, TypeScript, Tailwind CSS, Lucide React.',
          content: `{\n  "name": "camera-to-cloud-frontend",\n  "version": "1.0.0",\n  "private": true,\n  "scripts": {\n    "dev": "next dev -p 3001",\n    "build": "next build",\n    "start": "next start -p 3001"\n  }\n}`,
        },
        {
          id: 'frontend-app',
          name: 'src/app',
          type: 'folder',
          path: 'frontend/src/app',
          children: [
            {
              id: 'frontend-page',
              name: 'page.tsx (Landing Page)',
              type: 'file',
              path: '/frontend/src/app/page.tsx',
              category: 'frontend',
              language: 'typescript',
              description: 'Main Landing Page built with Untitled UI design system standards.',
              content: `// Next.js App Router - Camera to Cloud Landing Page\nexport default function LandingPage() {\n  return (\n    <main>\n      <Navbar />\n      <HeroSection />\n      <HowItWorksSection />\n      <FeaturesShowcaseSection />\n      <CameraCompatibilitySection />\n      <PricingSection />\n      <FaqSection />\n      <CtaBannerSection />\n      <Footer />\n    </main>\n  );\n}`,
            },
            {
              id: 'frontend-dashboard',
              name: 'dashboard/page.tsx',
              type: 'file',
              path: '/frontend/src/app/dashboard/page.tsx',
              category: 'frontend',
              language: 'typescript',
              description: 'Photographer live tethering dashboard and real-time photo ingestion monitor.',
              content: `// Live Tethering & Upload Stream Dashboard\nexport default function PhotographerDashboard() {\n  return <div>Live Ingestion Stream</div>;\n}`,
            },
          ],
        },
        {
          id: 'frontend-design-system',
          name: 'src/components/design-system',
          type: 'folder',
          path: 'frontend/src/components/design-system',
          children: [
            {
              id: 'ds-button',
              name: 'Button.tsx',
              type: 'file',
              path: '/frontend/src/components/design-system/Button.tsx',
              category: 'frontend',
              language: 'typescript',
              description: 'Untitled UI Button token variants (primary, secondary, tertiary, sizes).',
              content: `export const Button: React.FC<ButtonProps> = ...`,
            },
            {
              id: 'ds-badge',
              name: 'Badge.tsx',
              type: 'file',
              path: '/frontend/src/components/design-system/Badge.tsx',
              category: 'frontend',
              language: 'typescript',
              description: 'Untitled UI Badge tokens with indicator dots and color tints.',
              content: `export const Badge: React.FC<BadgeProps> = ...`,
            },
            {
              id: 'ds-card',
              name: 'Card.tsx',
              type: 'file',
              path: '/frontend/src/components/design-system/Card.tsx',
              category: 'frontend',
              language: 'typescript',
              description: 'Untitled UI Card container tokens with border, padding, and subtle shadows.',
              content: `export const Card: React.FC<CardProps> = ...`,
            },
            {
              id: 'ds-input',
              name: 'Input.tsx',
              type: 'file',
              path: '/frontend/src/components/design-system/Input.tsx',
              category: 'frontend',
              language: 'typescript',
              description: 'Untitled UI Input fields with validation states, labels, and icons.',
              content: `export const Input = React.forwardRef<HTMLInputElement, InputProps>(...)`,
            },
            {
              id: 'ds-tabs',
              name: 'Tabs.tsx',
              type: 'file',
              path: '/frontend/src/components/design-system/Tabs.tsx',
              category: 'frontend',
              language: 'typescript',
              description: 'Untitled UI Segmented and Underline navigation tab tokens.',
              content: `export const Tabs: React.FC<TabsProps> = ...`,
            },
          ],
        },
        {
          id: 'frontend-features',
          name: 'src/features',
          type: 'folder',
          path: 'frontend/src/features',
          children: [
            {
              id: 'feat-devices',
              name: 'devices/DeviceStatusCard.tsx',
              type: 'file',
              path: '/frontend/src/features/devices/DeviceStatusCard.tsx',
              category: 'frontend',
              language: 'typescript',
              description: 'DSLR/Phone USB tether status, battery level, and protocol card.',
              content: `export const DeviceStatusCard: React.FC<...> = ...`,
            },
            {
              id: 'feat-sessions',
              name: 'sessions/ActiveSessionHeader.tsx',
              type: 'file',
              path: '/frontend/src/features/sessions/ActiveSessionHeader.tsx',
              category: 'frontend',
              language: 'typescript',
              description: 'Active photo shoot session header with cloud sync counters.',
              content: `export const ActiveSessionHeader: React.FC<...> = ...`,
            },
            {
              id: 'feat-uploads',
              name: 'uploads/UploadQueueList.tsx',
              type: 'file',
              path: '/frontend/src/features/uploads/UploadQueueList.tsx',
              category: 'frontend',
              language: 'typescript',
              description: 'Real-time multi-part upload queue monitor with retry actions.',
              content: `export const UploadQueueList: React.FC<...> = ...`,
            },
            {
              id: 'feat-gallery',
              name: 'gallery/PhotoThumbnailGrid.tsx',
              type: 'file',
              path: '/frontend/src/features/gallery/PhotoThumbnailGrid.tsx',
              category: 'frontend',
              language: 'typescript',
              description: 'Real-time EXIF preview gallery for synced RAW and JPEG files.',
              content: `export const PhotoThumbnailGrid: React.FC<...> = ...`,
            },
          ],
        },
        {
          id: 'frontend-lib',
          name: 'src/lib',
          type: 'folder',
          path: 'frontend/src/lib',
          children: [
            {
              id: 'lib-api',
              name: 'api-client.ts',
              type: 'file',
              path: '/frontend/src/lib/api-client.ts',
              category: 'frontend',
              language: 'typescript',
              description: 'Typed API client for presigned S3 URLs and upload confirmations.',
              content: `export class C2CClient { ... }`,
            },
            {
              id: 'lib-constants',
              name: 'constants.ts',
              type: 'file',
              path: '/frontend/src/lib/constants.ts',
              category: 'frontend',
              language: 'typescript',
              description: 'Camera brands, RAW formats (.CR3, .ARW, .NEF), and API endpoints.',
              content: `export const SUPPORTED_RAW_FORMATS = [...]`,
            },
          ],
        },
        {
          id: 'frontend-tailwind',
          name: 'tailwind.config.ts',
          type: 'file',
          path: '/frontend/tailwind.config.ts',
          category: 'frontend',
          language: 'typescript',
          description: 'Tailwind CSS configuration for typography and design tokens.',
          content: `import type { Config } from 'tailwindcss';\nconst config: Config = {\n  content: ['./src/**/*.{js,ts,jsx,tsx}'],\n};\nexport default config;`,
        },
      ],
    },
  ];

  const findFile = (nodes: FileNode[], id: string): FileNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findFile(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const selectedFile = findFile(fileTree, selectedFileId) || fileTree[0];

  const renderTree = (nodes: FileNode[], depth: number = 0) => {
    return nodes.map((node) => {
      if (node.type === 'folder') {
        const isOpen = openFolders[node.path] ?? false;
        return (
          <div key={node.id} className="select-none">
            <button
              onClick={() => toggleFolder(node.path)}
              className="w-full flex items-center gap-1.5 px-2 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 rounded transition-colors text-left font-medium"
              style={{ paddingLeft: `${depth * 14 + 8}px` }}
            >
              {isOpen ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              )}
              {isOpen ? (
                <FolderOpen className="w-4 h-4 text-amber-400 shrink-0" />
              ) : (
                <Folder className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <span className="truncate">{node.name}</span>
            </button>
            {isOpen && node.children && <div>{renderTree(node.children, depth + 1)}</div>}
          </div>
        );
      }

      const isSelected = selectedFileId === node.id;
      return (
        <button
          key={node.id}
          onClick={() => setSelectedFileId(node.id)}
          className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded transition-colors text-left ${
            isSelected
              ? 'bg-indigo-500/15 text-indigo-300 font-semibold border-l-2 border-indigo-500'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
          style={{ paddingLeft: `${depth * 14 + 20}px` }}
        >
          <FileCode className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="truncate font-mono">{node.name}</span>
        </button>
      );
    });
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* MODE 1: FULL LANDING PAGE */}
      {viewMode === 'landing' && (
        <div className="flex flex-col min-h-screen">
          {/* Untitled UI Navigation Bar */}
          <Navbar
            onOpenGetStarted={() => setIsGetStartedOpen(true)}
            onOpenLogin={() => setIsGetStartedOpen(true)}
            onToggleWorkbench={() => setViewMode('workbench')}
            activeSection={activeSection}
          />

          <main className="flex-1">
            {/* 1. Hero Section (Matching image.png) */}
            <HeroSection
              onStartClick={() => setIsGetStartedOpen(true)}
              onHowItWorksClick={() => {
                const el = document.getElementById('how-it-works');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            {/* 2. How It Works 4-Step Pipeline (Matching image.png) */}
            <HowItWorksSection />

            {/* 3. Dark High-Contrast Feature Showcase (Matching image.png) */}
            <FeaturesShowcaseSection />

            {/* 4. Camera Compatibility Brands (Matching image.png) */}
            <CameraCompatibilitySection />

            {/* 5. Untitled UI Pricing Section */}
            <PricingSection
              onSelectPlan={(plan) => {
                setIsGetStartedOpen(true);
              }}
            />

            {/* 6. Untitled UI FAQ Accordion Section */}
            <FaqSection />

            {/* 7. Bottom CTA Photography Banner (Matching image.png) */}
            <CtaBannerSection onStartClick={() => setIsGetStartedOpen(true)} />
          </main>

          {/* Untitled UI Clean Footer */}
          <Footer onToggleWorkbench={() => setViewMode('workbench')} />

          {/* Interactive Get Started Modal */}
          <GetStartedModal
            isOpen={isGetStartedOpen}
            onClose={() => setIsGetStartedOpen(false)}
            onLaunchLiveSession={handleLaunchSession}
          />
        </div>
      )}

      {/* MODE 2: DEV WORKBENCH & ARCHITECTURE EXPLORER */}
      {viewMode === 'workbench' && (
        <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
          {/* Top Workbench Navigation Bar */}
          <header className="min-h-14 py-2 border-b border-slate-800 bg-slate-900/90 backdrop-blur px-4 md:px-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5 shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setViewMode('landing')}
                className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 hover:bg-indigo-500/25 transition-colors"
                title="Kembali ke Landing Page"
              >
                <Camera className="w-4 h-4" />
              </button>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm tracking-tight text-white">Camera-to-Cloud</span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Dev Workbench
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  Go REST API • Desktop Agent Daemon • PostgreSQL • S3 MinIO
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto max-w-full">
              {/* Back to Landing Page Switcher */}
              <button
                onClick={() => setViewMode('landing')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-xs shrink-0"
              >
                <LayoutTemplate className="w-3.5 h-3.5" />
                <span>Lihat Landing Page</span>
              </button>

              {/* Workbench Tab Switchers */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 overflow-x-auto shrink-0">
                <button
                  onClick={() => setWorkbenchTab('explorer')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                    workbenchTab === 'explorer'
                      ? 'bg-slate-800 text-indigo-400 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Folder className="w-3.5 h-3.5" />
                  <span>Monorepo Tree</span>
                </button>
                <button
                  onClick={() => setWorkbenchTab('workflow')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                    workbenchTab === 'workflow'
                      ? 'bg-slate-800 text-indigo-400 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>C2C Pipeline & Sim</span>
                </button>
                <button
                  onClick={() => setWorkbenchTab('schema')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                    workbenchTab === 'schema'
                      ? 'bg-slate-800 text-indigo-400 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>DB Schema</span>
                </button>
                <button
                  onClick={() => setWorkbenchTab('quickstart')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                    workbenchTab === 'quickstart'
                      ? 'bg-slate-800 text-indigo-400 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Quick Start</span>
                </button>
                <button
                  onClick={() => setWorkbenchTab('design-system')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                    workbenchTab === 'design-system'
                      ? 'bg-slate-800 text-indigo-400 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Untitled UI System</span>
                </button>
              </div>
            </div>
          </header>

          {/* Workbench Body */}
          <div className="flex-1 overflow-hidden flex">
            {workbenchTab === 'explorer' && (
              <div className="flex flex-1 overflow-hidden">
                <aside className="w-80 border-r border-slate-800 bg-slate-900/40 flex flex-col shrink-0">
                  <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Project Files
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Separated Folders</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                    {renderTree(fileTree)}
                  </div>
                </aside>

                <main className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
                  <div className="h-12 border-b border-slate-800 bg-slate-900/40 px-6 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-indigo-400 font-medium">
                        {selectedFile.path}
                      </span>
                      {selectedFile.category && (
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {selectedFile.category}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleCopy(selectedFile.content || '')}
                      className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <div className="flex-1 overflow-auto p-6 font-mono text-xs text-slate-300 leading-relaxed bg-slate-950/90">
                    <pre className="whitespace-pre-wrap">{selectedFile.content}</pre>
                  </div>
                </main>
              </div>
            )}

            {workbenchTab === 'workflow' && (
              <div className="flex-1 overflow-y-auto p-8 max-w-6xl mx-auto space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Camera-to-Cloud Real-time Pipeline</h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Simulasi live streaming dari kamera {activeSessionConfig.camera} ({activeSessionConfig.tetherType}) ke {activeSessionConfig.storage}.
                  </p>
                </div>

                {/* 5 Pipeline Stages */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  {[
                    { step: 1, title: '1. Camera Shutter', sub: activeSessionConfig.camera, desc: 'Foto RAW/JPEG terambil via USB' },
                    { step: 2, title: '2. Watcher Debounce', sub: 'desktop-agent (Go)', desc: 'Menunggu 500ms write buffer' },
                    { step: 3, title: '3. SHA-256 Check', sub: 'Local Deduplication', desc: 'Mencegah upload ganda file identik' },
                    { step: 4, title: '4. Direct S3 Upload', sub: 'Presigned PUT URL', desc: 'Direct streaming ke cloud storage' },
                    { step: 5, title: '5. Metadata Sync', sub: 'PostgreSQL & Web', desc: 'EXIF telemetri live di dashboard' },
                  ].map((st) => (
                    <div
                      key={st.step}
                      className={`p-4 rounded-xl border transition-all ${
                        simStep === st.step
                          ? 'bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/20'
                          : simStep > st.step
                          ? 'bg-slate-900 border-indigo-800/40 text-slate-300'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="text-[10px] font-mono mb-2 text-indigo-400">
                        {simStep > st.step ? '✓ Done' : simStep === st.step ? '⚡ Active' : `Step ${st.step}`}
                      </div>
                      <h4 className="font-bold text-sm text-white">{st.title}</h4>
                      <p className="text-xs text-indigo-400 font-mono mt-0.5">{st.sub}</p>
                      <p className="text-xs text-slate-400 mt-2">{st.desc}</p>
                    </div>
                  ))}
                </div>

                {/* Simulator Trigger */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-white flex items-center gap-2">
                        <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                        Live Tethering Simulator
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Sesi Aktif: <span className="text-white font-medium">{activeSessionConfig.projectName}</span>
                      </p>
                    </div>

                    <button
                      onClick={runSimulator}
                      disabled={isSimulating}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-xs transition-colors shadow-lg shadow-indigo-900/20"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>{isSimulating ? 'Ingesting Photo...' : 'Simulate Shutter Click (.CR3)'}</span>
                    </button>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs text-indigo-300 min-h-36 max-h-60 overflow-y-auto space-y-1">
                    {simLogs.length === 0 ? (
                      <div className="text-slate-600 italic">
                        Tekan tombol "Simulate Shutter Click (.CR3)" di atas untuk memulai simulasi pengunggahan...
                      </div>
                    ) : (
                      simLogs.map((log, idx) => (
                        <div key={idx} className="leading-relaxed">
                          {log}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {workbenchTab === 'schema' && (
              <div className="flex-1 overflow-y-auto p-8 max-w-6xl mx-auto space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">PostgreSQL Relational Schema</h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Tabel database metadata foto, sesi pemotretan, perangkat tether, dan antrean upload.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {[
                    {
                      table: 'photos',
                      cols: ['id (UUID PK)', 'session_id (UUID FK)', 'original_filename', 'file_format (RAW/JPG)', 'file_size_bytes', 'sha256_hash (UNIQUE)', 's3_key_original', 'camera_make', 'camera_model', 'iso_speed', 'upload_status'],
                    },
                    {
                      table: 'shoot_sessions',
                      cols: ['id (UUID PK)', 'project_id (UUID FK)', 'title', 'session_date', 'location', 'is_live (BOOLEAN)'],
                    },
                    {
                      table: 'devices',
                      cols: ['id (UUID PK)', 'device_uid (UNIQUE)', 'name', 'device_type (DSLR/Phone/Agent)', 'status (tethered/offline)', 'last_heartbeat'],
                    },
                    {
                      table: 'upload_tasks',
                      cols: ['id (UUID PK)', 'photo_id (UUID FK)', 'agent_id', 'status (queued/completed)', 'bytes_uploaded', 'retry_count (max 5)'],
                    },
                    {
                      table: 'projects',
                      cols: ['id (UUID PK)', 'name', 'client_name', 'owner_id (UUID FK)', 'storage_folder_prefix', 'is_active'],
                    },
                    {
                      table: 'users',
                      cols: ['id (UUID PK)', 'email (UNIQUE)', 'password_hash', 'full_name', 'role (photographer/client)'],
                    },
                  ].map((t) => (
                    <div key={t.table} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                        <span className="font-mono font-bold text-indigo-400 text-sm">{t.table}</span>
                        <Database className="w-4 h-4 text-slate-500" />
                      </div>
                      <div className="space-y-1.5 pt-1">
                        {t.cols.map((col, idx) => (
                          <div key={idx} className="text-[11px] font-mono text-slate-300">
                            {col}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {workbenchTab === 'quickstart' && (
              <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Developer Quickstart Guide</h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Perintah untuk menjalankan infrastruktur, API backend, desktop agent, dan frontend web yang sudah dipisahkan dalam folder <code className="text-indigo-400">backend/</code> dan <code className="text-indigo-400">frontend/</code>.
                  </p>
                </div>

                <div className="space-y-4">
                  {[
                    { title: '1. Nyalakan Infrastruktur Lokal (PostgreSQL 16 + MinIO S3)', cmd: 'cd backend/infrastructure && docker compose up -d' },
                    { title: '2. Jalankan Backend REST API (Go)', cmd: 'cd backend/api && go run cmd/server/main.go' },
                    { title: '3. Jalankan Desktop Ingestion Agent (Go)', cmd: 'cd backend/desktop-agent && go run cmd/agent/main.go --config=config.example.yaml' },
                    { title: '4. Jalankan Frontend Web Dashboard (Next.js)', cmd: 'cd frontend && npm install && npm run dev' },
                  ].map((step, idx) => (
                    <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
                      <h4 className="font-semibold text-sm text-white">{step.title}</h4>
                      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between font-mono text-xs text-indigo-400">
                        <code>{step.cmd}</code>
                        <button onClick={() => handleCopy(step.cmd)} className="text-slate-400 hover:text-white p-1">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {workbenchTab === 'design-system' && (
              <div className="flex-1 overflow-y-auto p-8 max-w-6xl mx-auto space-y-8 bg-slate-950">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold text-white tracking-tight">Untitled UI Design System</h2>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        untitledui.com standard
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 mt-1">
                      Koleksi token dan komponen UI yang konsisten digunakan di seluruh Landing Page dan Dashboard Camera-to-Cloud.
                    </p>
                  </div>
                  <a
                    href="https://www.untitledui.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium shrink-0"
                  >
                    <span>Untitled UI Specs</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* 1. Buttons Showcase */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-white">1. Button Components</h3>
                      <p className="text-xs text-slate-400">Variants: Primary, Secondary, Tertiary, Outline with 4 sizing tokens (sm, md, lg, xl).</p>
                    </div>
                    <span className="text-xs font-mono text-slate-500">components/design-system/Button.tsx</span>
                  </div>

                  <div className="bg-white p-6 rounded-xl space-y-4">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Light Canvas Preview</div>
                    <div className="flex flex-wrap items-center gap-3">
                      <Button variant="primary" size="md" iconLeading={<Camera className="w-4 h-4" />}>
                        Primary Button
                      </Button>
                      <Button variant="secondary" size="md">
                        Secondary Button
                      </Button>
                      <Button variant="tertiary" size="md">
                        Tertiary Button
                      </Button>
                      <Button variant="primary" size="md" isLoading>
                        Loading State
                      </Button>
                      <Button variant="primary" size="md" disabled>
                        Disabled
                      </Button>
                    </div>

                    <div className="pt-2 flex flex-wrap items-center gap-3">
                      <Button variant="primary" size="sm">Small (sm)</Button>
                      <Button variant="primary" size="md">Medium (md)</Button>
                      <Button variant="primary" size="lg">Large (lg)</Button>
                      <Button variant="primary" size="xl" iconTrailing={<ArrowRight className="w-4 h-4" />}>
                        Extra Large (xl)
                      </Button>
                    </div>
                  </div>
                </div>

                {/* 2. Badges Showcase */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-white">2. Badge Components</h3>
                      <p className="text-xs text-slate-400">Semantic color tints with status indicator dots.</p>
                    </div>
                    <span className="text-xs font-mono text-slate-500">components/design-system/Badge.tsx</span>
                  </div>

                  <div className="bg-white p-6 rounded-xl space-y-4">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Semantic Statuses</div>
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge variant="indigo" dot size="md">Tether Active</Badge>
                      <Badge variant="success" dot size="md">Sync Completed</Badge>
                      <Badge variant="warning" dot size="md">Debouncing Buffer</Badge>
                      <Badge variant="error" dot size="md">Upload Failed</Badge>
                      <Badge variant="blue" dot size="md">S3 Multipart</Badge>
                      <Badge variant="gray" size="md">RAW CR3</Badge>
                    </div>
                  </div>
                </div>

                {/* 3. Input & Form Controls Showcase */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-white">3. Input & Form Controls</h3>
                      <p className="text-xs text-slate-400">Focus rings, leading/trailing icons, error states, and helper texts.</p>
                    </div>
                    <span className="text-xs font-mono text-slate-500">components/design-system/Input.tsx</span>
                  </div>

                  <div className="bg-white p-6 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="Connected Camera Model"
                      value={dsInputVal}
                      onChange={(e) => setDsInputVal(e.target.value)}
                      iconLeading={<Camera className="w-4 h-4" />}
                      helperText="Detected automatically via USB PTP protocol"
                    />
                    <Input
                      label="Target S3 Bucket Name"
                      defaultValue="c2c-photos"
                      iconLeading={<Cloud className="w-4 h-4" />}
                      helperText="S3 compatible object storage endpoint"
                    />
                    <Input
                      label="API Key (With Validation Error Demo)"
                      defaultValue="c2c_invalid_key_123"
                      error="Invalid agent token. Please generate a new key from settings."
                      iconLeading={<Shield className="w-4 h-4" />}
                    />
                    <Input
                      label="Hotfolder Watch Path"
                      defaultValue="/Users/photographer/Pictures/C2C_HotFolder"
                      iconLeading={<HardDrive className="w-4 h-4" />}
                      helperText="Local folder monitored by Go agent daemon"
                    />
                  </div>
                </div>

                {/* 4. Tabs Showcase */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-white">4. Tabs (Segmented & Underline)</h3>
                      <p className="text-xs text-slate-400">Interactive tab navigation with pill indicators and badges.</p>
                    </div>
                    <span className="text-xs font-mono text-slate-500">components/design-system/Tabs.tsx</span>
                  </div>

                  <div className="bg-white p-6 rounded-xl space-y-6">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Segmented Style</p>
                      <Tabs
                        variant="segmented"
                        items={[
                          { id: 'all', label: 'All Photos', badge: 142 },
                          { id: 'raw', label: 'RAW Files', badge: 98 },
                          { id: 'jpeg', label: 'JPEGs', badge: 44 },
                          { id: 'failed', label: 'Retries', badge: 0 },
                        ]}
                        activeId={dsActiveTab}
                        onChange={(id) => setDsActiveTab(id)}
                      />
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Underline Style</p>
                      <Tabs
                        variant="underline"
                        items={[
                          { id: 'all', label: 'All Photos', badge: 142 },
                          { id: 'raw', label: 'RAW Files', badge: 98 },
                          { id: 'jpeg', label: 'JPEGs', badge: 44 },
                        ]}
                        activeId={dsActiveTab}
                        onChange={(id) => setDsActiveTab(id)}
                      />
                    </div>
                  </div>
                </div>

                {/* 5. Card Containers Showcase */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-white">5. Card Containers</h3>
                      <p className="text-xs text-slate-400">Surface hierarchy: Default, Subtle, Elevated, and Dark.</p>
                    </div>
                    <span className="text-xs font-mono text-slate-500">components/design-system/Card.tsx</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card variant="default" padding="md">
                      <Badge variant="indigo" size="sm" dot>Default Card</Badge>
                      <h4 className="font-semibold text-gray-900 text-sm mt-2">Bordered Surface</h4>
                      <p className="text-xs text-gray-500 mt-1">Light border with shadow-xs for crisp clarity.</p>
                    </Card>

                    <Card variant="subtle" padding="md">
                      <Badge variant="gray" size="sm">Subtle Card</Badge>
                      <h4 className="font-semibold text-gray-900 text-sm mt-2">Muted Container</h4>
                      <p className="text-xs text-gray-500 mt-1">Soft background tint for secondary groupings.</p>
                    </Card>

                    <Card variant="elevated" padding="md">
                      <Badge variant="success" size="sm" dot>Elevated Card</Badge>
                      <h4 className="font-semibold text-gray-900 text-sm mt-2">Floating Elevation</h4>
                      <p className="text-xs text-gray-500 mt-1">Shadow-lg for modal dialogs and highlighted cards.</p>
                    </Card>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

