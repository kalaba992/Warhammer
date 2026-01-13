# Carinski Alat - AI Customs Classification System

A legally-defensible AI-powered customs classification system for 8-digit HS code determination with zero-tolerance anti-hallucination validation.

**Experience Qualities:**
1. **Trustworthy** - Every classification must be verifiable, auditable, and backed by legal precedents with zero tolerance for AI hallucinations
2. **Professional** - Clean, authoritative interface that conveys expertise and regulatory compliance for customs professionals
3. **Intelligent** - Natural conversational AI that guides users through complex classification decisions with transparent reasoning

**Complexity Level**: Complex Application (advanced functionality, likely with multiple views)
The system requires sophisticated AI integration, multi-layer validation architecture, multi-language support, role-based access control, document analysis, audit trails, and legal defensibility scoring. It's a production-grade regulatory compliance tool requiring advanced state management and security features.

## Essential Features

### 1. AI Chat Classification Interface
- **Functionality**: ChatGPT-style conversational interface for product classification with real-time AI responses
- **Purpose**: Enable natural language product descriptions to be classified into precise 8-digit HS codes with legal reasoning
- **Trigger**: User types product description or asks classification question
- **Progression**: User enters query → AI analyzes using GIR rules → Multi-layer validation (Zero Tolerance → Anti-Hallucination → Hierarchical) → Display HS code with confidence score and legal reasoning → User can refine or accept
- **Success criteria**: 100% of suggested HS codes pass TARIC validation, defensibility score ≥7/10 for high-confidence results, zero hallucinated codes

### 2. Three-Layer Anti-Hallucination System
- **Functionality**: Triple validation architecture ensuring AI never invents non-existent HS codes
- **Purpose**: Prevent legal liability from incorrect classifications that could result in customs penalties
- **Trigger**: Every AI-generated HS code passes through all three validation layers before display
- **Progression**: AI suggests code → Layer 1 (Zero Tolerance Blocker checks TARIC database, generates verification hash) → Layer 2 (Anti-Hallucination Validator computes trust score) → Layer 3 (Hierarchical Validator checks 4→6→8 digit consistency) → Display result or block with error
- **Success criteria**: System blocks 100% of non-existent codes, provides clear warnings for medium/low confidence, maintains audit trail of all validations

### 3. HS Code Search & Browse
- **Functionality**: Searchable database of 8-digit HS codes with chapter/heading hierarchy navigation
- **Purpose**: Allow direct lookup and exploration of HS code structure and precedents
- **Trigger**: User searches by code, keyword, or browses chapter structure
- **Progression**: User enters search → Filter by code/description/chapter → View results with tariff info → Select code to view full details including precedents and classification criteria → Bookmark favorites
- **Success criteria**: Search returns results in <2 seconds, supports multilingual descriptions, displays complete tariff and legal information

### 4. Document Analysis & Upload
- **Functionality**: Upload commercial invoices, product specifications, or certificates for automated HS code extraction
- **Purpose**: Streamline classification of multiple products from documentation
- **Trigger**: User uploads PDF/image document
- **Progression**: Upload document → OCR/text extraction → AI identifies products → Classify each product → Generate classification report with all codes → Export certificate
- **Success criteria**: Successfully extracts text from 95%+ documents, identifies products with context, produces exportable classification reports

### 4a. Multi-File Batch Document Upload with Progress Tracking
- **Functionality**: Upload and process multiple documents simultaneously (up to 50 files) with real-time progress tracking, pause/resume capability, comprehensive result export to professionally formatted Excel, and detailed processing metrics
- **Purpose**: Enable efficient bulk document processing for customs brokers handling multiple shipments or invoices
- **Trigger**: User selects batch upload view and adds multiple files via drag-and-drop or file picker
- **Progression**: Add files (up to 50) → Review file list → Start batch processing → Monitor real-time progress (per-file and overall) → Pause/resume if needed → View individual file results → Export all results to professionally formatted Excel with styled columns and auto-filters → Clear completed or retry failed
- **Success criteria**: 
  - Process up to 50 files sequentially without memory issues
  - Display accurate per-file progress (pending → uploading → processing → completed/error)
  - Show overall progress with estimated time remaining
  - Allow pause/resume during batch processing
  - Provide detailed results for each file including HS code, confidence, and defensibility score
  - Excel export of all batch results with:
    * Localized column headers (Naziv Fajla, HS Kod, Pouzdanost, Defensive Score, Razlog, Vrijeme Obrade, Datum)
    * Bold headers with gray background and centered alignment
    * Optimized column widths (25, 15, 15, 15, 60, 12, 20 characters)
    * Data cells with top-aligned, wrap-text formatting for long reasoning text
    * Auto-filter enabled on all columns
    * Confidence translated (Visoka/Srednja/Niska)
    * Processing time calculated and displayed (e.g., "2.5s")
    * Timestamp-based filename (e.g., Carinski-Alat-Batch-Export-2024-01-15-143025.xlsx)
  - Handle failures gracefully with clear error messages per file
  - Show processing time for each document
  - Allow removal of pending files and clearing of completed files
  - Success toast shows count of exported records

### 4b. CSV/Excel Bulk Import for Spreadsheet Processing
- **Functionality**: Import product lists from CSV/Excel files (up to 100 rows) for automated batch classification with structured data table view, supporting both .csv and .xlsx/.xls formats, with intelligent column detection and professional Excel export of results
- **Purpose**: Enable customs brokers and traders to classify entire product catalogs or shipment manifests directly from their existing spreadsheet workflows without format conversion
- **Trigger**: User navigates to CSV/Excel Import view and uploads CSV or Excel file
- **Progression**: Download optional CSV/Excel template → Upload CSV or Excel with product descriptions → System parses and validates data (intelligent column detection) → Preview products in table format → Start batch classification → Real-time progress tracking → View results with HS codes in table → Export classified results to professionally formatted Excel with styled headers, auto-filters, and optimized column widths
- **Success criteria**: 
  - Parse CSV files with flexible column names (Product Description, Opis Proizvoda, Description, etc.)
  - Parse Excel files (.xlsx, .xls) directly using SheetJS library without requiring CSV conversion
  - Auto-detect product description columns in Excel by searching for keywords (product, description, opis, proizvod) in header row
  - Support optional "Additional Info" column for supplementary product details
  - Handle up to 100 rows per import
  - Display products in sortable, filterable table with row numbers
  - Show status badges (pending, processing, completed, error) per row
  - Display HS code and confidence level for each classified product
  - Provide downloadable CSV and Excel templates with example data
  - Export results as professionally formatted Excel (.xlsx) with:
    * Localized column headers (Br., Opis Proizvoda, HS Kod, Pouzdanost, Dodatne Informacije)
    * Bold headers with gray background and centered alignment
    * Auto-adjusted column widths (8, 45, 15, 15, 45 characters)
    * Data cells with top-aligned, wrap-text formatting
    * Auto-filter enabled on all columns
    * Confidence translated to local language (Visoka/Srednja/Niska)
    * Timestamp-based filename (e.g., Carinski-Alat-CSV-Export-2024-01-15-143025.xlsx)
  - Show clear error messages for parsing failures
  - Native Excel format support eliminates conversion step
  - Support pause/stop during processing
  - Success toast shows count of exported records

### 5. Classification History & Audit Trail with Excel Export
- **Functionality**: Complete historical record of all classifications with timestamps, reasoning, and defensibility scores, plus advanced Excel export with customizable filters, formatted columns, professional styling, real-time preview, side-by-side comparison tool, and export templates manager
- **Purpose**: Regulatory compliance, audit support, organizational learning, professional report generation with Excel integration, detailed comparison analysis, and reusable export configurations
- **Trigger**: Every classification is automatically logged; export triggered via dedicated export button with filter dialog; comparison triggered via comparison button; templates triggered via templates manager button
- **Progression**: Classification completed → Store in history with full context → User views dashboard → Filter/search history → Click comparison to analyze multiple classifications side-by-side → Click templates manager to create/use/edit export templates → Click Excel export → Configure export options (all/basic fields, favorites filter, confidence filter) → See real-time count of filtered records → Generate formatted Excel with auto-filters, bold headers, styled cells, and optimized column widths → Download .xlsx file with localized column headers and formatted data
- **Success criteria**: 
  - 100% of classifications logged with immutable records
  - Searchable by date/user/code/product
  - Excel export includes professionally formatted columns with proper headers in selected language and script variant
  - Auto-filters enabled on all columns for easy data manipulation
  - Column widths auto-adjusted based on content (min 15, max 60 characters)
  - Header row styled with bold font, gray background, centered alignment
  - Data cells with top-aligned, wrap-text formatting for readability
  - Support filtering by favorites, confidence level before export with live count preview
  - Export includes all classification details: HS code, confidence, defensibility score, descriptions, tariff info, reasoning, legal basis, verification hash
  - Exported file named with precise timestamp for version tracking (e.g., Carinski-Alat-Export-2024-01-15-143025.xlsx)
  - Export respects user's language and script preferences (Latin/Cyrillic)
  - File format compatible with Excel 2010+, Google Sheets, and LibreOffice
  - Option to include/exclude detailed fields for streamlined vs. comprehensive reports
  - Real-time validation prevents exporting empty result sets with clear user feedback
  - Confidence level filter shows record counts for each option (High: X, Medium: Y, Low: Z)
  - Export button disabled when no records match selected filters
  - Warning alert displayed when filter combination yields zero results
  - **Side-by-side comparison**: Select up to 3 classifications for detailed analysis with visual comparison of confidence, defensibility, reasoning, legal basis, and verification hashes
  - **Comparison statistics**: Show aggregate metrics (avg defensive score, high confidence count, unique chapters) for compared items
  - **Export templates**: Create, save, edit, and delete reusable export configurations with custom names, descriptions, and filter presets
  - **4 default templates**: Full export, basic export, favorites only, high confidence only - cannot be deleted or edited
  - **Template badges**: Visual indicators show each template's settings (all/basic fields, favorites, confidence filter)
  - **One-click export**: Apply saved template and export instantly without reconfiguring filters

### 6. Multilingual Interface & Content with Real-Time Script Conversion
- **Functionality**: 12-language support for UI, HS descriptions, and AI communication with live Latin/Cyrillic script conversion, including automatic conversion of user input before sending
- **Purpose**: Support international trade operations across Balkan and EU markets with native script preferences
- **Trigger**: User selects language from settings and optionally chooses script variant (Latin/Cyrillic)
- **Progression**: Select UI language → Select HS description language → Select AI communication language → Choose script variant (for BA/SR) → All content updates instantly with real-time conversion → User types message → Input auto-converts to selected script before sending → Preferences persist → Chat messages, classification results, and all UI text convert dynamically
- **Success criteria**: Complete translations for BA/EN/DE/HR/SR/SK/SL/AL/MK/FR/ES/IT, language changes apply instantly, separate controls for UI/content/AI, seamless Latin↔Cyrillic conversion for Bosnian and Serbian without page reload, user input automatically converts to chosen script variant before being sent to AI

### 7. God Mode Administration with Role-Based Access Control & Activity Audit Log
- **Functionality**: Special administrative features for authorized owner users only, with automatic role verification and access restriction, plus comprehensive activity audit logging with timestamps and user tracking
- **Purpose**: System configuration, training data management, advanced diagnostics, complete system control while preventing unauthorized access, and maintain detailed audit trail of all administrative actions for security compliance and accountability
- **Trigger**: User navigates to Admin panel → System verifies user role via spark.user() API → Owner users gain full access, non-owner users see access denied message → All admin actions automatically logged with timestamp, user details, and action metadata
- **Progression**: User authenticates → System checks isOwner flag → Admin menu item visible only to owners in sidebar → Owner accesses Admin Dashboard → Execute terminal commands (all logged) → View system stats → Manage data (export/import/backup/restore - all logged) → Configure God Mode settings → View comprehensive audit logs with filtering (by date, user, action type, success/failure) → Click any log entry to see detailed information → Export audit logs → Non-owner users cannot see admin menu and receive "Access Denied" alert if attempting direct access
- **Success criteria**: 
  - Only users with isOwner=true can access Admin Dashboard
  - Admin menu item hidden from non-owners in sidebar
  - Access denied message displayed to non-owners attempting to access admin view
  - All admin commands restricted to owner accounts
  - Role verification happens automatically on app load
  - Seamless UX without exposing admin features to regular users
  - **Audit Log Features:**
    - Every admin action automatically logged with precise timestamp (date + time with seconds)
    - User tracking captures userId, email, and GitHub login for each action
    - Action type categorization (17 types: COMMAND_EXECUTED, DATA_EXPORT, DATA_IMPORT, DATA_DELETED, CACHE_CLEARED, BACKUP_CREATED, BACKUP_RESTORED, SETTINGS_CHANGED, GOD_MODE_TOGGLED, USER_LOGIN, CLASSIFICATION_CREATED, CLASSIFICATION_DELETED, CONVERSATION_DELETED, SYSTEM_OPTIMIZED, ERROR_OCCURRED, etc.)
    - Success/failure status tracking for all operations
    - Metadata capture including old/new values for changes, resource IDs, error messages
    - User agent and browser information logged for security auditing
    - Searchable and filterable logs (by date range, user, action type, success status, free text search)
    - Detailed log viewer with expandable entries showing full context
    - Visual status indicators (green checkmark for success, red X for failures)
    - Color-coded action type badges for quick scanning
    - Statistics dashboard showing total logs, today's activity, success rate, error rate
    - Export audit logs to JSON for external analysis or compliance reporting
    - Logs stored in persistent KV storage (up to 1000 most recent entries)
    - Audit log viewer accessible from dedicated "Audit Log" tab in admin dashboard
    - Separate from command execution logs - permanent audit trail vs. temporary command output
    - Delete audit logs requires confirmation (action itself is logged)

### 8. Knowledge Base Data Import System
- **Functionality**: Comprehensive bulk data import system for building and expanding the customs classification knowledge base with support for HS codes, legal precedents, classification examples, and AI training data via Excel templates
- **Purpose**: Enable rapid population and scaling of the knowledge base with large datasets from official sources (TARIC, WCO, national customs authorities) and organizational learning, eliminating manual data entry for thousands of records
- **Trigger**: Owner user navigates to Knowledge Base Import view from sidebar (restricted to isOwner=true accounts only)
- **Progression**: Access Knowledge Base view → View current database statistics (HS codes, precedents, examples, training data counts) → Select import type (HS Codes / Precedents / Examples / Training) → Download Excel template with pre-defined columns and example row → Populate template with bulk data → Upload completed Excel file → System validates and parses data → Real-time progress tracking (0% → 25% → 50% → 100%) → View detailed import results (successful/failed/skipped counts) → Review error log for failed rows with specific line numbers and reasons → Imported data immediately available in all system features → View aggregated statistics across all imports → Export audit trail of all import operations
- **Success criteria**:
  - **Access Control**: Only owner accounts can access Knowledge Base Import, non-owners see "Access Denied" alert
  - **Template System**: 
    - Download professionally formatted Excel templates for each data type (HS Codes, Precedents, Examples, Training)
    - Templates include header row with all required and optional column names
    - Example data row demonstrates proper formatting and values
    - Bold headers with gray background for clarity
    - Column widths optimized (20 characters) for readability
  - **HS Code Import**:
    - Required fields: code8Digits, descriptionBa, descriptionEn
    - Optional fields: code4Digits, code6Digits, descriptionDe/Hr/Sr, chapter, heading, dutyRate, vatRate, excise, materialComposition, processingMethod, endUse, isActive
    - Auto-derives chapter from first 2 digits of code8Digits if not provided
    - Auto-derives code4Digits and code6Digits from code8Digits if not provided
    - Validates HS code format (8 digits, properly structured)
    - Prevents duplicate imports (checks existing code8Digits)
    - Stores in persistent KV storage: 'hs-code-database'
  - **Precedents Import**:
    - Required fields: hsCode, caseId, source
    - Optional fields: bindingLevel, date, url, summary, fullText
    - Validates source values (TARIC, WCO, EU_CURIA, UIO_BIH)
    - Validates bindingLevel values (mandatory, persuasive, informative, defaults to informative)
    - Links precedents to HS codes for legal defensibility scoring
    - Stores in persistent KV storage: 'precedent-database'
  - **Classification Examples Import**:
    - Required fields: productDescription, hsCode
    - Optional fields: confidence, reasoning, materialComposition, processingMethod, endUse, language
    - Defaults confidence to 'high' if not specified
    - Language field for multilingual examples (defaults to 'ba')
    - Used for AI training and user reference
    - Stores in persistent KV storage: 'classification-examples'
  - **Training Data Import**:
    - Required fields: query, expectedHsCode
    - Optional fields: context, keyTerms (comma-separated), alternativeDescriptions (comma-separated), commonMistakes, validationNotes
    - Parses comma-separated keyTerms into array for AI training
    - Parses alternativeDescriptions for query expansion
    - Used to improve AI classification accuracy over time
    - Stores in persistent KV storage: 'training-data'
  - **Import Processing**:
    - Parse Excel files (.xlsx, .xls) using SheetJS library
    - Read first worksheet automatically
    - Process all rows sequentially with validation
    - Real-time progress indicator (25% parse, 50% validate, 100% complete)
    - Display current filename being processed
    - Handle parsing errors gracefully with specific error messages
  - **Import Results & Statistics**:
    - Detailed import result card for each operation
    - Statistics: Total records, Successful, Failed, Skipped
    - Error log with specific row numbers and failure reasons (e.g., "Row 15: Missing required fields")
    - Timestamp for each import operation
    - Show first 10 errors inline, indicate if more errors exist
    - Aggregate statistics: Total imports, Total successful records, Total failed records
    - Real-time database counts: Total HS codes, Precedents, Examples, Training data
    - Color-coded badges (green for success, red for failures, amber for warnings)
  - **Data Persistence**:
    - All imported data persists across sessions in Spark KV storage
    - HS codes automatically integrate with search, tree view, and classification features
    - Precedents enhance defensibility scoring and legal basis display
    - Examples improve AI responses and provide user references
    - Training data feeds into AI classification quality improvement
  - **UI/UX**:
    - Tab interface: Upload | Results | Stats
    - Four stat cards showing current database counts with icons
    - Four import type cards with Download Template + Import buttons
    - Progress bar during import with percentage complete
    - Scrollable results area showing all past imports
    - Visual success/error indicators throughout
    - Localized messages respecting user's language and script preferences
  - **Error Handling**:
    - Invalid Excel files: Show clear parsing error with suggestions
    - Missing required fields: Skip row, log error with row number
    - Invalid data formats: Skip row, log validation failure details
    - Duplicate HS codes: Skip duplicate, increment skipped count
    - Empty rows: Skip automatically without error
    - Large files: Process efficiently up to 10,000+ rows per file

### 9. Legal Defensibility Scoring
- **Functionality**: 1-10 score indicating strength of classification based on precedents and rule application
- **Purpose**: Help users understand classification reliability for customs defense
- **Trigger**: Automatically calculated for every classification
- **Progression**: Classification made → Analyze precedent strength → Check GIR rule application → Evaluate source authority (WCO/TARIC/EU Curia) → Calculate score → Display with breakdown
- **Success criteria**: Score correlates with customs acceptance rate, clear explanation of scoring factors, scores 8+ have precedent support

### 10. Advanced Visual Analytics Dashboard
- **Functionality**: Interactive charts and visual analytics using Recharts library with pie charts, bar charts, line charts, time-based filtering, and tabbed views
- **Purpose**: Provide deep insights into classification patterns, trends, confidence distribution, chapter usage, and defensibility metrics through visual data exploration
- **Trigger**: User navigates to Advanced Dashboard view from sidebar
- **Progression**: User selects dashboard → Choose time range filter (7d/30d/90d/all) → Navigate between Overview, Confidence, Chapters, and Timeline tabs → View interactive charts (pie, bar, line) → Hover for detailed tooltips → Analyze visual trends and patterns
- **Success criteria**:
  - Interactive pie charts showing confidence distribution with percentages and counts
  - Horizontal bar charts displaying top 10 most-used HS chapters
  - Line charts visualizing classification trends over time with daily data points
  - Vertical bar charts showing defensibility score distribution across 5 ranges (1-2, 3-4, 5-6, 7-8, 9-10)
  - Time range filtering (7/30/90 days, all time) updates all charts in real-time
  - Tabbed interface organizes different analytics views (Overview, Confidence, Chapters, Timeline)
  - Responsive charts adapt to container size and maintain readability
  - Custom tooltips show detailed information on hover with localized labels
  - Color-coded charts use theme colors (accent for high confidence, warning for medium, destructive for low)
  - Empty states clearly communicate when no data is available for selected time range

## Edge Case Handling

- **Non-existent HS Codes**: Zero Tolerance Blocker immediately rejects with error message, no display to user
- **Low Confidence Classifications**: Display warning badge, require user acknowledgment, suggest requesting more product information
- **Ambiguous Products**: AI asks clarifying questions about material composition, end use, or processing method before classification
- **Offline/API Failures**: Queue requests locally, display cached HS code database for search, graceful degradation with warnings
- **Rate Limiting**: Show countdown timer, queue excess requests, priority processing for owner accounts
- **Language Switching Mid-Conversation**: Preserve context, translate only new messages, maintain classification consistency, real-time script conversion applies to existing messages
- **Script Variant Changes**: Convert all visible content dynamically (chat messages, classification results, HS descriptions) without losing conversation state, user input automatically converts before sending
- **User Input Script Conversion**: When user types in non-preferred script (e.g., types Latin while Cyrillic selected), message auto-converts to selected script variant before sending to AI, visual indicator shows active script preference
- **Conflicting Precedents**: Display multiple valid interpretations with different defensibility scores, explain reasoning for each
- **Document Upload Failures**: Retry with different OCR methods, allow manual text input, provide clear error messages
- **CSV Parsing Errors**: Show specific row/column where error occurred, provide format hints, allow re-upload
- **CSV Column Mismatch**: Intelligently detect product description column regardless of header name, prompt user if ambiguous
- **Large CSV Files (>100 rows)**: Automatically truncate to first 100 rows with warning, suggest splitting file for larger imports
- **Empty CSV Rows**: Skip empty rows during parsing, only count valid product descriptions
- **Malformed CSV Data**: Display clear parsing errors with line numbers, suggest common fixes (quotes, commas, encoding)
- **Excel File Upload**: Parse .xlsx and .xls files directly using SheetJS library, auto-detect columns, handle multiple sheets (uses first sheet)
- **Excel Parsing Errors**: Show specific row/column where error occurred, handle corrupted files gracefully with clear error messages
- **Excel Column Detection**: Intelligently detect product description columns in Excel by searching for keywords (product, description, opis, proizvod) in header row
- **Large Excel Files (>100 rows)**: Automatically truncate to first 100 data rows with warning, ignore formatting/empty rows
- **Excel Export Language Consistency**: Export column headers and data in user's selected language and script variant (Latin/Cyrillic conversion applied)
- **Excel Export Filter Conflicts**: If favorites filter yields no results, show warning and export all records instead
- **Excel Export with Empty History**: Disable export button or show "No data to export" message when history is empty
- **Excel Download Failures**: Retry download, show clear error message, allow user to adjust filters and retry
- **Large History Exports**: Handle exports of 1000+ records efficiently, show progress indicator for large exports
- **Hierarchical Validation Errors**: Block display, log error details, prompt AI to reconsider classification at correct level

## Design Direction

The design should evoke authority, precision, and governmental reliability while remaining modern and accessible. Think of a fusion between official customs documentation and contemporary SaaS platforms - professional enough for regulatory work, intuitive enough for daily use. The interface should feel like a trusted legal advisor: serious, accurate, transparent.

## Color Selection

A professional palette balancing governmental authority with modern digital clarity.

- **Primary Color**: Deep Navy Blue `oklch(0.25 0.08 250)` - Conveys customs authority, legal seriousness, and governmental trust
- **Secondary Colors**: 
  - Slate Gray `oklch(0.45 0.02 250)` - Supporting professional tone for secondary actions
  - Cool Gray `oklch(0.75 0.01 250)` - Muted backgrounds and borders
- **Accent Color**: Emerald Green `oklch(0.55 0.15 155)` - Success states, verified classifications, high confidence scores (regulatory approval feel)
- **Warning/Error Colors**:
  - Amber `oklch(0.70 0.15 75)` - Medium confidence warnings
  - Red `oklch(0.55 0.22 25)` - Hallucination blocks, validation failures
- **Foreground/Background Pairings**:
  - Primary Navy `oklch(0.25 0.08 250)`: White text `oklch(0.99 0 0)` - Ratio 10.2:1 ✓
  - Emerald Accent `oklch(0.55 0.15 155)`: White text `oklch(0.99 0 0)` - Ratio 5.8:1 ✓
  - Background `oklch(0.98 0 0)`: Navy text `oklch(0.25 0.08 250)` - Ratio 10.2:1 ✓
  - Slate Secondary `oklch(0.45 0.02 250)`: White text `oklch(0.99 0 0)` - Ratio 6.5:1 ✓

## Font Selection

Typography should balance governmental formality with digital readability, projecting both authority and modern efficiency.

- **Primary Typeface**: IBM Plex Sans - Technical precision with approachable humanist characteristics, ideal for data-heavy interfaces
- **Secondary/Mono**: JetBrains Mono - For HS code display (XXXX.XX.XX format) to emphasize precision

**Typographic Hierarchy**:
- H1 (Page Titles): IBM Plex Sans SemiBold/32px/tight (-0.02em) letter spacing
- H2 (Section Headers): IBM Plex Sans SemiBold/24px/tight letter spacing
- H3 (Card Titles): IBM Plex Sans Medium/18px/normal letter spacing
- Body (Main Content): IBM Plex Sans Regular/15px/relaxed (1.6) line height
- Small (Metadata): IBM Plex Sans Regular/13px/normal
- HS Codes: JetBrains Mono Medium/16px/wide (0.05em) - monospace for alignment
- Legal Text: IBM Plex Sans Regular/14px/relaxed (1.7) - high readability

## Animations

Animations should reinforce precision and trustworthiness - smooth, purposeful transitions that feel reliable rather than playful. No frivolous motion.

Use subtle animations for:
- **Validation States**: Progressive reveal of validation layers (Layer 1→2→3) with checkmark animations
- **Confidence Indicators**: Smooth color transitions for high→medium→low confidence badges
- **Chat Messages**: Gentle slide-up for AI responses with typing indicator
- **HS Code Display**: Highlight animation when code appears, emphasizing verified status
- **Navigation**: Smooth page transitions maintaining spatial consistency
- **Card Interactions**: Subtle lift on hover (2px) with shadow intensification
- **Loading States**: Professional skeleton screens and progress indicators (no spinners)

Timing: 200-300ms for state changes, 400ms for page transitions, easing functions that feel precise (ease-out for enters, ease-in for exits).

## Component Selection

**Components**:
- **Sidebar**: Navigation with collapsible sections for Dashboard, Search, Documents, Favorites, Training (God Mode only)
- **Card**: HS code results, classification history entries, document uploads, precedent displays
- **Dialog**: Classification details modal, confirmation dialogs, error alerts for hallucination blocks
- **Button**: Primary (classify actions), Secondary (refine/edit), Destructive (clear/delete), Ghost (navigation)
- **Input/Textarea**: Product description entry, search fields, document notes
- **Tabs**: Switch between Chat/Search/History views, toggle between languages
- **Badge**: Confidence levels (high/medium/low), verification status, defensibility scores
- **ScrollArea**: Long chat histories, HS code chapter lists, legal precedent displays
- **Select**: Language picker (12 languages × 3 contexts), chapter filter, sorting options
- **Alert**: Zero Tolerance Blocker errors, API warnings, system notifications
- **Progress**: Defensibility score visualization (1-10 scale), validation layer progress
- **Tooltip**: Explain GIR rules, show full HS descriptions on hover, display precedent sources, export filter explanations
- **Separator**: Divide chat messages, section headers, validation layer results
- **Switch**: Toggle export options (all fields vs basic, favorites only)
- **Avatar**: User profile, system/AI message indicators

**Customizations**:
- **HS Code Display Component**: Monospace formatted code with hierarchical color coding (chapter→heading→subheading→national)
- **Validation Layer Indicator**: Three-step progress showing Zero Tolerance → Anti-Hallucination → Hierarchical validation
- **Confidence Badge**: Dynamic color/icon based on high (green check)/medium (amber warning)/low (red alert)
- **Defensibility Score Bar**: 1-10 gradient visualization with threshold markers at 7 and 9
- **Chat Message**: Distinct styling for user queries vs AI responses with embedded HS code highlighting
- **Language Selector Group**: Three linked selects for UI/Content/Communication language management
- **Classification Certificate Card**: Professional export format with verification hash and QR code placeholder
- **Excel Export Dialog**: Multi-option filter interface with switches for field selection, favorites filtering, and confidence level dropdown with real-time preview of record count

**States**:
- Buttons: Distinct hover (subtle lift + shadow), active (press down), focus (ring), disabled (reduced opacity + no interaction)
- Inputs: Default border, focus (primary ring + border color), error (red border + error icon), success (green border + check icon)
- HS Code Cards: Default, hover (lift + border glow), selected (primary border), verified (green accent border)

**Icon Selection** (Phosphor Icons):
- ChatCircle: Chat interface, conversation history
- MagnifyingGlass: HS code search
- Upload: Document upload
- Star: Favorites/bookmarks
- ShieldCheck: Validation success, verification status
- Warning: Medium confidence, caution states
- XCircle: Blocked hallucinations, errors
- CheckCircle: High confidence, successful classification
- FileText: Documents, certificates, reports
- Clock: History, audit trail
- GlobeHemisphereWest: Language selection
- LockKey: God Mode, admin features
- Scales: Legal defensibility, precedents
- TreeStructure: HS code hierarchy
- DownloadSimple: Excel export, file downloads
- Funnel: Filter options, data filtering

**Spacing**:
- Container padding: `p-6` (24px) on desktop, `p-4` (16px) on mobile
- Card internal spacing: `p-5` (20px)
- Section gaps: `gap-8` (32px) for major sections, `gap-4` (16px) within sections
- Button padding: `px-6 py-2.5` (24px/10px) for primary, `px-4 py-2` for secondary
- Chat message spacing: `gap-3` (12px) between messages
- Form field spacing: `gap-6` (24px) between fields, `gap-2` (8px) label-to-input

**Mobile**:
- Sidebar collapses to hamburger menu with drawer overlay
- Chat interface maintains full width with adjusted padding
- HS code cards stack vertically with touch-optimized sizing
- Language selects combine into single modal with tabs
- Defensibility score bar scales to fit mobile width
- Touch targets minimum 44×44px for all interactive elements
- Bottom navigation for primary actions (Classify, Search, History)
