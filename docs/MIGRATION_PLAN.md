# Migration Plan: Google Drive → Local File Upload

## Overview
Remove Google Drive dependency and implement direct file/folder uploads for:
1. Customer Gallery
2. Public Gallery  
3. Home Gallery

## Implementation Steps

### Phase 1: Create Upload Infrastructure ✅
1. Create upload API routes with multer
2. Configure storage directory
3. Update preview route to serve local files

### Phase 2: Update Admin UI
1. Replace Google Drive link inputs with file upload components
2. Add drag-and-drop file/folder upload
3. Update all gallery pages

### Phase 3: Database Migration
1. Add `localPath` field to schemas
2. Keep `driveFileId` for backward compatibility (optional)
3. Migrate existing records (if needed)

### Phase 4: Testing
1. Test file uploads
2. Test image/video display
3. Verify customer gallery workflows
4. Check public gallery

## Storage Structure
```
/app/public/uploads/
├── customer-gallery/
│   └── {referenceId}/
│       └── {folderName}/
│           └── {files}
├── public-gallery/
│   └── {categoryId}/
│       └── {files}
└── home-gallery/
    └── {files}
```

## API Routes to Create
- POST `/api/admin/customer-gallery/{refId}/upload` - Upload customer files
- POST `/api/admin/public-gallery/upload` - Upload public gallery files
- POST `/api/admin/home-gallery/upload` - Upload home gallery files

## Database Fields
- `localPath`: string - Path relative to /public/uploads/
- `url`: string - Public URL (computed from localPath)
- Remove or deprecate: `driveFileId`, `previewUrl` (Drive-specific)

## Timeline
- Phase 1: 15 minutes
- Phase 2: 30 minutes  
- Phase 3: 10 minutes
- Phase 4: 15 minutes
**Total: ~70 minutes**
