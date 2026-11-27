LilyAiDataNotes — Project Instructions

1. Project Identity

Project Name: LilyAiDataNotes

Project Type: AI-powered Knowledge Management Platform

Primary Goal:

Build a website that serves as a centralized knowledge and data storage system for AI models and agents.

LilyAiDataNotes provides persistent storage, document management, hybrid memory, and knowledge retrieval. It also includes an AI assistant that lives inside the website and helps users manage, understand, organize, and process stored documents.

The platform must allow different AI models and agents to access authorized knowledge through a consistent API without depending on any particular LLM provider.

Core Principles

1. The database is the source of truth.
2. AI models are replaceable components, not database dependencies.
3. Knowledge must persist independently of conversations and model sessions.
4. Multiple AI agents should be able to access authorized shared knowledge.
5. Documents and other data types must be manageable through the website.
6. WebContainers is a core part of the frontend experience.
7. The architecture must be modular, maintainable, and extensible.
8. Security and data ownership must be considered from the beginning.

---

2. Technology Stack

Backend

- Python
- FastAPI
- Pydantic
- SQLAlchemy
- Alembic
- PostgreSQL

Database

- PostgreSQL
- pgvector for vector-based retrieval
- PostgreSQL full-text search
- JSONB for flexible metadata

Frontend

- Remix (Vite as the build tool)
- TypeScript
- React
- WebContainers API

AI Integration

- Provider-independent AI service architecture
- Optional Vercel AI SDK integration
- Configurable LLM providers
- Configurable embedding providers
- Retrieval-Augmented Generation (RAG)

Testing

- pytest
- Frontend testing appropriate to the selected framework
- API integration tests
- Database integration tests

Use stable, compatible package versions. Verify official documentation before implementing integrations.

---

3. System Architecture

LilyAiDataNotes must be separated into independent architectural layers.

A. Presentation Layer

Responsible for the website interface.

Responsibilities:

- Dashboard
- Document management interface
- File explorer
- Knowledge browser
- Memory management interface
- AI assistant interface
- Search interface
- WebContainers workspace
- Settings and provider configuration

The frontend must communicate with the backend through documented APIs.

B. Backend API Layer

FastAPI provides the central application interface.

Responsibilities:

- Authentication
- Authorization
- Document operations
- File metadata operations
- Knowledge retrieval
- Memory operations
- AI assistant requests
- Search operations
- Dataset export
- WebContainers-related project metadata and integrations

The backend must remain the authoritative data access layer.

C. Knowledge Layer

Responsible for organizing and retrieving information.

Responsibilities:

- Document processing
- Text extraction
- Metadata extraction
- Chunk generation
- Full-text indexing
- Embedding generation
- Semantic retrieval
- Hybrid retrieval
- Knowledge relationships

D. Memory Layer

Responsible for persistent memory.

Responsibilities:

- Shared knowledge
- Project memory
- Agent memory
- Conversation history
- Private memory
- Memory retrieval
- Memory updates
- Memory deletion

E. AI Service Layer

Responsible for communication with external or local AI models.

Responsibilities:

- Model configuration
- Provider adapters
- Chat completion
- Streaming responses
- Embedding generation
- Tool execution
- Document processing
- RAG-based responses

AI services must never become the owner of the database or the only place where knowledge is stored.

F. Execution Layer

WebContainers provides browser-based Node.js execution.

Responsibilities:

- Browser-based filesystem
- Project file manipulation
- Terminal interface
- Node.js command execution
- Development workspace
- Code editing and previews
- AI-assisted file operations

Important: WebContainers runs Node.js in the browser. It must not be treated as a Python execution environment or as a replacement for the FastAPI backend.

Keep the WebContainers integration isolated behind frontend services and a dedicated workspace interface.

---

4. Database Architecture

PostgreSQL is the central source of truth.

The database must remain independent of all LLM providers.

Database Responsibilities

Store:

- Documents
- Files and file metadata
- Extracted text
- Document chunks
- Embeddings
- Knowledge records
- Conversation history
- Agent memory
- Project memory
- Private memory
- User information
- Access permissions
- AI provider configurations
- Processing jobs
- Dataset information
- Audit records

Suggested Database Domains

Organize database models around these domains:

Identity

- Users
- Roles
- Permissions
- Sessions

Documents

- Documents
- Document versions
- File metadata
- Document relationships
- Processing status

Knowledge

- Knowledge records
- Chunks
- Embeddings
- Sources
- Tags
- Categories

Memory

- Memory records
- Memory scopes
- Agent associations
- Project associations
- Conversation references

Conversations

- Conversations
- Messages
- Message metadata
- Conversation summaries

AI Configuration

- Providers
- Model configurations
- Embedding configurations
- Provider capabilities

Execution

- Workspaces
- Workspace files
- Execution metadata
- Processing jobs

Audit

- Activity records
- Access history
- Modification history

These are logical domains, not instructions to create every table immediately. Inspect requirements and define appropriate schemas before implementation.

Database Rules

1. PostgreSQL owns persistent application data.
2. Never store important knowledge exclusively in an LLM conversation.
3. Never require a particular model provider to read existing records.
4. Store original uploaded files separately from extracted content.
5. Keep embeddings as derived data.
6. Allow embeddings to be regenerated using a different provider or model.
7. Preserve original document content.
8. Use database migrations for schema changes.
9. Use transactions for operations that modify related records.
10. Apply access control to every user- or agent-facing data operation.

---

5. Hybrid Memory Architecture

LilyAiDataNotes uses hybrid memory.

Implement the following memory scopes:

Global Memory

Knowledge shared between authorized projects and agents.

Project Memory

Information belonging to an individual project.

Agent Memory

Information associated with a particular AI agent.

Conversation Memory

Historical messages, conversation summaries, and relevant context.

Private Memory

Information restricted to its owner or explicitly authorized users.

Memory Rules

- Memory records must have identifiable scopes.
- Access permissions must be checked before retrieval.
- Agents must not automatically access private memory.
- Conversation history and extracted knowledge must remain distinguishable.
- Memory must support creation, retrieval, updating, and deletion.
- Memory records should include timestamps and source references.
- Duplicate or contradictory memories should be handled carefully.
- Important memory changes should be traceable.

Memory Retrieval

Support retrieval using:

- Exact identifiers
- PostgreSQL full-text search
- Metadata filters
- Semantic search
- Hybrid search

Use relevance ranking and scope filtering when combining results.

---

6. Document Management

The built-in AI assistant must help manage documents.

Required Document Operations

- Upload documents.
- Read documents.
- Extract content.
- Summarize documents.
- Search document contents.
- Organize documents.
- Categorize documents.
- Add tags.
- Update document metadata.
- Create documents.
- Edit documents.
- Delete documents with appropriate safeguards.
- Retrieve document history.

Data Types

Design the system to support multiple data types:

Text

- TXT
- Markdown
- HTML
- CSV
- JSON
- XML

Documents

- PDF
- DOCX
- Other common office formats where practical

Images

- PNG
- JPG
- JPEG
- WebP
- SVG

Audio

- MP3
- WAV
- Other supported audio formats

Video

- MP4
- WebM
- Other supported video formats

Source Code

- Python
- JavaScript
- TypeScript
- Kotlin
- Java
- HTML
- CSS
- Other common programming languages

Do not assume every file type can be understood directly by an LLM.

Implement suitable extraction and processing adapters. Unsupported formats must be identified clearly rather than silently corrupted.

File Processing Pipeline

1. Receive uploaded file.
2. Validate file type and size.
3. Store original file safely.
4. Create document metadata.
5. Extract available content.
6. Normalize extracted content.
7. Generate chunks when appropriate.
8. Generate embeddings when configured.
9. Index searchable content.
10. Update processing status.

Processing should support retrying failed jobs without duplicating records.

---

7. Built-in AI Assistant

LilyAiDataNotes must have an AI assistant inside the website.

Its primary purpose is to work with the knowledge database and documents.

Initial Capabilities

- Answer questions about stored knowledge.
- Search documents.
- Summarize documents.
- Extract important information.
- Organize knowledge.
- Create documents.
- Edit documents with permission.
- Generate structured information.
- Save approved information into memory.
- Retrieve relevant conversation context.
- Assist with code and workspace operations.

AI Assistant Rules

1. The assistant must retrieve relevant information before answering knowledge-dependent questions.
2. It must distinguish stored facts from generated suggestions.
3. It must identify sources when answering from stored documents.
4. It must not invent document contents.
5. It must request confirmation before destructive operations.
6. It must respect memory scopes and permissions.
7. It must not bypass backend authorization.
8. It must not directly modify PostgreSQL outside approved backend services.

AI Provider Independence

Implement an abstraction layer between the assistant and model providers.

The application should support different providers through adapters.

Do not couple business logic to:

- OpenAI-specific response formats
- Anthropic-specific response formats
- Gemini-specific response formats
- Any single provider's SDK

Provider-specific code must remain inside integration adapters.

Vercel AI SDK is optional. It may be used for frontend streaming or supported integrations, but it must not become a requirement for the database or core backend.

---

8. WebContainers Integration

WebContainers is a core feature, not a decorative optional component.

It must be integrated into the Remix frontend.

Required Workspace Features

- Browser-based terminal.
- Browser-based filesystem.
- File creation and editing.
- Directory navigation.
- Node.js execution.
- Package installation where supported.
- Development server preview.
- Workspace state management.
- AI-assisted workspace operations.

Integration Rules

- Follow official WebContainers API documentation.
- Initialize the runtime through a dedicated integration layer.
- Handle boot failures and unsupported environments.
- Manage runtime lifecycle properly.
- Prevent unauthorized file access.
- Keep workspace operations separate from database operations.
- Do not expose backend secrets to the browser.
- Do not assume browser files are automatically persisted in PostgreSQL.

Persistence

Workspace files must have an explicit persistence strategy.

Use the backend API to save and retrieve persistent workspace data where required.

WebContainers should be responsible for browser execution, not permanent application data ownership.

---

9. API Architecture

Use REST APIs through FastAPI initially.

Organize endpoints by domain.

Suggested API groups:

Documents

- Create document
- Get document
- Update document
- Delete document
- List documents
- Upload document
- Search documents

Knowledge

- Create knowledge record
- Retrieve knowledge
- Search knowledge
- Update knowledge
- Delete knowledge
- Retrieve document chunks

Memory

- Save memory
- Search memory
- Retrieve memory
- Update memory
- Delete memory
- Retrieve scoped memory

Conversations

- Create conversation
- Retrieve conversation
- Store message
- Retrieve messages
- Generate conversation summary

AI

- Send assistant message
- Stream assistant response
- Process document
- Generate summary
- Retrieve relevant knowledge

Workspace

- Create workspace
- Retrieve workspace
- Save workspace files
- Retrieve workspace files
- Update workspace metadata

Export

- Export documents
- Export knowledge
- Export memory
- Export datasets

API endpoints must have clear request and response schemas.

Use consistent error responses, validation, authentication, and authorization.

---

10. Data Retrieval and RAG

Implement Retrieval-Augmented Generation as a service, not as a feature tied to a single model.

Retrieval Pipeline

1. Receive a user or agent query.
2. Identify the requesting identity and memory scope.
3. Normalize the query.
4. Search using available retrieval methods.
5. Apply permission filters.
6. Rank relevant results.
7. Retrieve the original source content.
8. Construct context for the AI provider.
9. Generate the response.
10. Preserve source references.

Retrieval Methods

- PostgreSQL full-text search
- Vector similarity search
- Metadata filtering
- Hybrid retrieval

Embedding generation must be configurable.

The database must remain usable even if all embedding providers are unavailable.

---

11. Tokenization and Training Data

LilyAiDataNotes should be capable of preparing knowledge for future model training and fine-tuning workflows.

Requirements

- Preserve original UTF-8 content.
- Support consistent text normalization.
- Support configurable chunk sizes.
- Track chunk metadata.
- Support tokenizer-specific token counts.
- Allow dataset exports.
- Preserve source references.
- Separate original content from generated datasets.

Important Rules

Token counts depend on the tokenizer and model.

Never assume one token count applies to every model.

Do not permanently replace readable source documents with token IDs.

Training dataset generation must be a separate process from normal memory retrieval.

Storing information in PostgreSQL does not automatically train a model.

---

12. Security Requirements

Security must be part of the initial architecture.

Implement:

- Authentication
- Role-based access control where appropriate
- Resource-level authorization
- API input validation
- Secure file upload validation
- File size limits
- Secret management
- Rate limiting
- Audit logging
- Safe error handling
- Database access controls

AI Security

- Treat uploaded documents as untrusted input.
- Treat retrieved content as data, not instructions.
- Protect against prompt injection.
- Do not allow retrieved documents to override system instructions.
- Require permission checks before tools access private information.
- Require confirmation for destructive actions.
- Do not expose provider API keys to the frontend.

WebContainers Security

- Treat browser execution as untrusted.
- Do not expose server credentials.
- Restrict workspace operations to authorized files.
- Validate backend requests.
- Never assume browser-side restrictions replace backend authorization.

---

13. Project Structure

Use a modular structure. The following is a proposed starting point, not permission to create unnecessary files.

LilyAiDataNotes/
│
├── CLAUDE.md
├── README.md
├── LICENSE
├── .gitignore
├── .editorconfig
├── .env.example
├── docker-compose.yml
├── Makefile
│
├── .github/
│   └── workflows/
│       ├── backend-tests.yml
│       ├── frontend-tests.yml
│       └── code-quality.yml
│
├── backend/
│   ├── pyproject.toml
│   ├── alembic.ini
│   ├── Dockerfile
│   │
│   ├── migrations/
│   │   ├── env.py
│   │   ├── script.py.mako
│   │   └── versions/
│   │
│   ├── src/
│   │   └── lilyaidatanotes/
│   │       ├── __init__.py
│   │       ├── main.py
│   │       │
│   │       ├── config/
│   │       │   ├── settings.py
│   │       │   ├── logging.py
│   │       │   └── constants.py
│   │       │
│   │       ├── database/
│   │       │   ├── session.py
│   │       │   ├── base.py
│   │       │   └── health.py
│   │       │
│   │       ├── api/
│   │       │   ├── router.py
│   │       │   ├── dependencies.py
│   │       │   ├── exception_handlers.py
│   │       │   └── v1/
│   │       │       ├── documents.py
│   │       │       ├── knowledge.py
│   │       │       ├── memory.py
│   │       │       ├── conversations.py
│   │       │       ├── assistant.py
│   │       │       ├── providers.py
│   │       │       ├── workspaces.py
│   │       │       ├── exports.py
│   │       │       └── users.py
│   │       │
│   │       ├── auth/
│   │       │   ├── authentication.py
│   │       │   ├── authorization.py
│   │       │   ├── password.py
│   │       │   └── tokens.py
│   │       │
│   │       ├── users/
│   │       │   ├── models/
│   │       │   ├── schemas/
│   │       │   └── repositories/
│   │       │
│   │       ├── documents/
│   │       │   ├── models/
│   │       │   ├── schemas/
│   │       │   ├── repositories/
│   │       │   ├── services/
│   │       │   └── versioning/
│   │       │
│   │       ├── storage/
│   │       │   ├── interfaces/
│   │       │   ├── local/
│   │       │   ├── object_storage/
│   │       │   ├── file_validation/
│   │       │   └── storage_registry.py
│   │       │
│   │       ├── processing/
│   │       │   ├── pipeline/
│   │       │   ├── extraction/
│   │       │   │   ├── text/
│   │       │   │   ├── pdf/
│   │       │   │   ├── office/
│   │       │   │   ├── images/
│   │       │   │   ├── audio/
│   │       │   │   ├── video/
│   │       │   │   └── code/
│   │       │   ├── normalization/
│   │       │   ├── chunking/
│   │       │   └── jobs/
│   │       │
│   │       ├── knowledge/
│   │       │   ├── models/
│   │       │   ├── schemas/
│   │       │   ├── repositories/
│   │       │   ├── services/
│   │       │   ├── indexing/
│   │       │   └── relationships/
│   │       │
│   │       ├── retrieval/
│   │       │   ├── full_text/
│   │       │   ├── vector/
│   │       │   ├── hybrid/
│   │       │   ├── ranking/
│   │       │   └── filters/
│   │       │
│   │       ├── memory/
│   │       │   ├── models/
│   │       │   ├── schemas/
│   │       │   ├── repositories/
│   │       │   ├── scopes/
│   │       │   ├── retrieval/
│   │       │   ├── consolidation/
│   │       │   └── policies/
│   │       │
│   │       ├── conversations/
│   │       │   ├── models/
│   │       │   ├── schemas/
│   │       │   ├── repositories/
│   │       │   └── summarization/
│   │       │
│   │       ├── ai/
│   │       │   ├── interfaces/
│   │       │   ├── adapters/
│   │       │   ├── orchestration/
│   │       │   ├── prompts/
│   │       │   ├── tools/
│   │       │   ├── streaming/
│   │       │   └── context_builder/
│   │       │
│   │       ├── providers/
│   │       │   ├── registry.py
│   │       │   ├── models/
│   │       │   ├── llm/
│   │       │   ├── embeddings/
│   │       │   └── configuration/
│   │       │
│   │       ├── datasets/
│   │       │   ├── models/
│   │       │   ├── tokenization/
│   │       │   ├── preparation/
│   │       │   └── exporters/
│   │       │
│   │       ├── workspace/
│   │       │   ├── models/
│   │       │   ├── schemas/
│   │       │   ├── repositories/
│   │       │   ├── persistence/
│   │       │   └── permissions/
│   │       │
│   │       ├── jobs/
│   │       │   ├── queue/
│   │       │   ├── workers/
│   │       │   ├── scheduling/
│   │       │   └── retry/
│   │       │
│   │       ├── audit/
│   │       │   ├── models/
│   │       │   ├── repositories/
│   │       │   └── services/
│   │       │
│   │       └── common/
│   │           ├── exceptions/
│   │           ├── types/
│   │           ├── utilities/
│   │           └── validation/
│   │
│   ├── worker/
│   │   └── main.py
│   │
│   └── tests/
│       ├── unit/
│       ├── integration/
│       ├── api/
│       ├── security/
│       └── fixtures/
│
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── Dockerfile
│   │
│   ├── public/
│   │
│   ├── app/
│   │   ├── root.tsx
│   │   ├── entry.client.tsx
│   │   ├── entry.server.tsx
│   │   │
│   │   ├── routes/
│   │   │   ├── _index.tsx
│   │   │   ├── dashboard.tsx
│   │   │   ├── documents.tsx
│   │   │   ├── knowledge.tsx
│   │   │   ├── memory.tsx
│   │   │   ├── conversations.tsx
│   │   │   ├── assistant.tsx
│   │   │   ├── workspace.tsx
│   │   │   ├── settings.tsx
│   │   │   └── login.tsx
│   │   │
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   ├── navigation/
│   │   │   ├── documents/
│   │   │   ├── knowledge/
│   │   │   ├── memory/
│   │   │   ├── assistant/
│   │   │   └── workspace/
│   │   │
│   │   ├── features/
│   │   │   ├── document-manager/
│   │   │   ├── knowledge-browser/
│   │   │   ├── memory-manager/
│   │   │   ├── ai-assistant/
│   │   │   └── workspace-manager/
│   │   │
│   │   ├── services/
│   │   │   ├── api/
│   │   │   ├── authentication/
│   │   │   └── streaming/
│   │   │
│   │   ├── workspace/
│   │   │   ├── runtime/
│   │   │   │   ├── boot/
│   │   │   │   └── lifecycle/
│   │   │   ├── filesystem/
│   │   │   ├── terminal/
│   │   │   ├── editor/
│   │   │   ├── preview/
│   │   │   ├── persistence/
│   │   │   └── permissions/
│   │   │
│   │   ├── hooks/
│   │   ├── context/
│   │   ├── utils/
│   │   ├── types/
│   │   └── styles/
│   │
│   └── tests/
│       ├── components/
│       ├── routes/
│       ├── workspace/
│       └── integration/
│
├── infrastructure/
│   ├── docker/
│   ├── database/
│   ├── reverse-proxy/
│   ├── monitoring/
│   └── deployment/
│
├── scripts/
│   ├── development/
│   ├── database/
│   ├── maintenance/
│   └── validation/
│
└── docs/
    ├── ARCHITECTURE.md
    ├── DATABASE.md
    ├── API.md
    ├── MEMORY.md
    ├── AI_PROVIDERS.md
    ├── DOCUMENT_PROCESSING.md
    ├── WEBCONTAINERS.md
    ├── SECURITY.md
    ├── TESTING.md
    ├── DEPLOYMENT.md
    └── DEVELOPMENT.md

Create files only when they have a real responsibility.

The actual structure may be adjusted when implementation requirements justify it.

---

14. Strict Coding Rules

These rules are mandatory.

Rule 1 — One Function Per Source File

Every implementation source file must contain exactly one primary function.

Avoid placing multiple independent functions in one source file.

When multiple functions are needed, separate them into individual files.

Do not use this rule as an excuse to create unnecessary files.

For non-function-oriented files such as configuration, migrations, schemas, and stylesheets, keep the file focused on one responsibility.

Do not artificially introduce functions into files that do not need them.

Rule 2 — Maximum 200 Lines

Every non-Markdown file must not exceed 200 lines.

This applies to:

- Python
- TypeScript
- JavaScript
- JSON
- YAML
- TOML
- SQL
- CSS
- HTML
- Shell scripts
- Configuration files
- Other non-Markdown files

Markdown files are exempt.

When a file approaches the limit, refactor it before it exceeds 200 lines.

Do not solve line-limit problems by compressing code into unreadable one-line statements.

Rule 3 — Single Responsibility

Each file must have one clear responsibility.

Avoid large files that mix unrelated operations.

Rule 4 — No Unnecessary Complexity

- Do not introduce unnecessary abstractions.
- Do not build features before their requirements are understood.
- Do not add dependencies without a reason.
- Do not duplicate existing functionality.
- Prefer simple, maintainable implementations.

Rule 5 — Read Before Editing

Before modifying any existing file:

1. Inspect the current file.
2. Understand its purpose.
3. Inspect relevant dependencies.
4. Identify affected functionality.
5. Make the smallest appropriate change.
6. Verify that existing functionality still works.

Never overwrite working code blindly.

Rule 6 — No Fake Implementations

Do not create placeholder implementations that appear functional.

If a feature is incomplete, clearly identify it as incomplete.

Do not claim that a feature works without verifying it.

Rule 7 — Type Safety

Use appropriate type hints in Python and TypeScript.

Avoid unnecessary use of "Any", unsafe casts, and unvalidated data.

Rule 8 — Error Handling

Handle errors explicitly.

Do not silently swallow exceptions.

Return useful error messages without exposing secrets or internal sensitive information.

---

15. Development Workflow

Claude must follow this workflow when working on LilyAiDataNotes.

Before Implementation

1. Read this CLAUDE.md.
2. Inspect the repository.
3. Identify existing files and architecture.
4. Review relevant official documentation.
5. Identify dependencies and compatibility requirements.
6. Explain the intended changes.
7. Avoid creating files before understanding where they belong.

During Implementation

1. Implement one logical feature at a time.
2. Keep files within the 200-line limit.
3. Maintain the one-function-per-source-file rule.
4. Preserve existing functionality.
5. Use database migrations for schema changes.
6. Validate all external inputs.
7. Keep provider-specific integrations isolated.
8. Update documentation when architecture changes.

After Implementation

1. Run relevant tests.
2. Check imports and type errors.
3. Check API behavior.
4. Check database operations.
5. Check the 200-line limit.
6. Check the one-function-per-source-file rule.
7. Review security implications.
8. Report exactly what was completed.
9. Identify anything that remains incomplete.

Never report tests as passing if they were not actually executed.

---

16. Testing Requirements

Backend

Test:

- Database connections
- Database migrations
- CRUD operations
- Authentication
- Authorization
- Document processing
- Memory retrieval
- Search
- AI provider adapters
- RAG pipeline
- API validation
- Error handling

Frontend

Test:

- Routes
- Forms
- Document management
- API communication
- Assistant interface
- WebContainers initialization
- Workspace file operations
- Terminal behavior
- Error states

Integration

Verify:

- Frontend-to-backend communication.
- Backend-to-PostgreSQL communication.
- AI provider switching.
- Memory retrieval across scopes.
- Document upload and extraction.
- WebContainers workspace persistence.
- Authorization boundaries.

---

17. Development Phases

Implement LilyAiDataNotes incrementally.

Do not attempt to build the entire platform in one uncontrolled operation.

Phase 1 — Foundation

- Repository structure
- Backend initialization
- Frontend initialization
- PostgreSQL connection
- Configuration management
- Database migrations
- Basic health endpoint

Phase 2 — Document Storage

- Document database models
- File storage abstraction
- Upload API
- Document metadata
- Document retrieval
- Document update and deletion

Phase 3 — Knowledge Engine

- Content extraction
- Text normalization
- Document chunking
- Full-text indexing
- Embedding abstraction
- Knowledge retrieval

Phase 4 — Hybrid Memory

- Memory scopes
- Memory records
- Agent associations
- Conversation storage
- Memory retrieval
- Memory permissions

Phase 5 — AI Assistant

- Provider abstraction
- Model configuration
- Assistant API
- Streaming responses
- Document understanding
- RAG integration
- Memory integration

Phase 6 — Web Interface

- Dashboard
- Document manager
- Knowledge browser
- Memory browser
- Assistant interface
- Search interface

Phase 7 — WebContainers Workspace

- WebContainers initialization
- Browser filesystem
- Terminal
- File editor
- Runtime execution
- Preview
- Workspace persistence

Phase 8 — Advanced Features

- Dataset export
- Tokenization
- Advanced retrieval
- Document versioning
- Additional data extraction
- Agent integrations
- Audit and monitoring

Phase 9 — Production Readiness

- Security review
- Performance optimization
- Database backup strategy
- Error monitoring
- Deployment configuration
- Documentation
- Full integration testing

---

18. Important Architectural Restrictions

Claude must never:

- Tie PostgreSQL directly to an LLM provider.
- Store all knowledge exclusively in chat history.
- Make an LLM provider mandatory for basic database operations.
- Treat embeddings as the original source of truth.
- Assume WebContainers can run Python.
- Expose backend secrets to the browser.
- Bypass authentication or authorization.
- Create unnecessary architecture.
- Create oversized files.
- Ignore the one-function-per-source-file requirement.
- Exceed the 200-line limit for non-Markdown files.
- Replace working implementations without inspection.
- Introduce unrequested features that significantly change the project direction.

---

19. Final Project Objective

LilyAiDataNotes should become an independent knowledge infrastructure for AI models and agents.

Its purpose is to provide persistent, organized, searchable, and reusable information without forcing AI models to depend on their own internal memory.

The website is the management interface.

PostgreSQL is the persistent source of truth.

FastAPI is the backend access layer.

Remix is the frontend application.

WebContainers provides the browser-based execution workspace.

The AI assistant is the intelligent document and knowledge management interface.

The provider-independent architecture allows different models and agents to use the same knowledge infrastructure.

Build LilyAiDataNotes as a reusable knowledge platform, not as a chatbot with a database attached.

Additional Architecture Requirements

- Maintain clear separation between file storage, database storage, document processing, knowledge retrieval, memory, AI providers, and frontend execution.
- Original uploaded files must be preserved independently from extracted text and generated embeddings.
- Use background workers for expensive document-processing and indexing operations.
- WebContainers must remain a core frontend capability and must not be confused with backend execution.
- Implement a storage abstraction so storage providers can be replaced without changing document business logic.
- Implement provider adapters so LLM and embedding providers can be replaced independently.
- All agent access to memory and documents must pass authorization checks.
- Add structured logging, health checks, database backup procedures, and automated validation.
- Create directories and files only when needed for a working feature.
- Do not generate placeholder files simply to match the architecture tree.
- Preserve the one-function-per-implementation-source-file rule and the 200-line maximum for every non-Markdown file.
