# Comprehensive Testing Plan - Google Drive to Local Upload Migration

## Pre-Testing Setup

### 1. Start the Application
```bash
cd /app
yarn dev
```

### 2. Access Admin Dashboard
```
URL: http://localhost:3000/admin/login
Credentials: Check .env.local for ADMIN_PASSWORD
```

### 3. Create Upload Directories
```bash
mkdir -p /app/public/uploads/customer-gallery
mkdir -p /app/public/uploads/public-gallery
mkdir -p /app/public/uploads/home-gallery
```

---

## Test Suite 1: Customer Gallery

### Test 1.1: Create Project & Folder
**Steps:**
1. Navigate to Admin → Customer Gallery
2. Enter reference ID: `TEST-001`
3. Click "Look up"
4. If no project exists, click "Create Project"
5. Click "Add Folder"
6. Enter folder name: `Test Raw Folder`

**Expected Result:**
- ✅ Project created successfully
- ✅ Folder appears in dropdown
- ✅ No errors in console

### Test 1.2: Upload Single Image
**Steps:**
1. Select "Test Raw Folder" from dropdown
2. Drag and drop a single JPG image (< 10MB)
3. Wait for upload to complete

**Expected Result:**
- ✅ Upload progress indicator shows
- ✅ Success alert: "Uploaded 1 files successfully!"
- ✅ Image appears in grid below
- ✅ Folder count updates (Total: 1, Selected: 0)
- ✅ Image displays correctly (not broken)

**Verification:**
```bash
# Check file exists
ls -la /app/public/uploads/customer-gallery/TEST-001/Test\ Raw\ Folder/

# Check database
# Images should have localPath, url, previewUrl fields
```

### Test 1.3: Upload Multiple Images
**Steps:**
1. Select multiple images (5-10 files)
2. Drag and drop them onto upload area
3. Wait for upload

**Expected Result:**
- ✅ All files uploaded
- ✅ Alert shows correct count
- ✅ All images visible in grid
- ✅ Folder count shows correct total

### Test 1.4: Upload Video File
**Steps:**
1. Upload a video file (.mp4 or .mov)
2. Wait for upload

**Expected Result:**
- ✅ Video uploads successfully
- ✅ Video thumbnail displays
- ✅ Video plays when clicked
- ✅ No console errors

### Test 1.5: Upload Large Files
**Steps:**
1. Upload a large image (20-50MB)
2. Monitor upload progress

**Expected Result:**
- ✅ Upload completes successfully
- ✅ No timeout errors
- ✅ Image displays at full quality

### Test 1.6: Mixed File Types
**Steps:**
1. Upload mix of: JPG, PNG, WebP, MP4
2. Verify all display correctly

**Expected Result:**
- ✅ All formats supported
- ✅ Correct previews for each type
- ✅ Videos have play controls

### Test 1.7: Delete Asset
**Steps:**
1. Hover over an uploaded image
2. Click "Delete" button
3. Confirm deletion

**Expected Result:**
- ✅ Asset removed from grid
- ✅ Folder count decreases
- ✅ File still in filesystem (soft delete in DB)

### Test 1.8: Multiple Folders
**Steps:**
1. Create second folder "Test Raw 2"
2. Upload files to second folder
3. Switch between folders

**Expected Result:**
- ✅ Each folder shows its own files
- ✅ Counts independent per folder
- ✅ No cross-contamination

---

## Test Suite 2: Public Gallery

### Test 2.1: Create Category
**Steps:**
1. Navigate to Admin → Public Gallery
2. Enter category name: "Weddings"
3. Click "Create Category"

**Expected Result:**
- ✅ Category created
- ✅ Appears in category list
- ✅ Can be selected

### Test 2.2: Upload to Category
**Steps:**
1. Select "Weddings" category
2. Upload 3-5 images
3. Wait for completion

**Expected Result:**
- ✅ Files upload successfully
- ✅ Alert shows correct count
- ✅ Images appear in media grid
- ✅ Category dropdown shows "Weddings" for all items

### Test 2.3: Change Category
**Steps:**
1. Create second category "Portraits"
2. Upload images to "Portraits"
3. In media grid, change an item's category

**Expected Result:**
- ✅ Item moves to new category
- ✅ Counts update correctly
- ✅ Item visible in new category

### Test 2.4: Delete Media Item
**Steps:**
1. Click "Delete" on a media item
2. Confirm deletion

**Expected Result:**
- ✅ Item removed from grid
- ✅ Total count decreases
- ✅ No errors

### Test 2.5: Category Order
**Steps:**
1. Set category order values (0, 1, 2)
2. Check if categories reorder

**Expected Result:**
- ✅ Categories sort by order value
- ✅ Order persists after refresh

### Test 2.6: Pagination
**Steps:**
1. Upload 30+ images to one category
2. Navigate through pages

**Expected Result:**
- ✅ Pagination controls appear
- ✅ Page navigation works
- ✅ Correct items per page (24)

---

## Test Suite 3: Home Gallery

### Test 3.1: Upload Hero Images
**Steps:**
1. Navigate to Admin → Home Gallery
2. Upload 5 high-quality images
3. Verify upload

**Expected Result:**
- ✅ All images upload
- ✅ Success message appears
- ✅ Images appear in hero items grid

### Test 3.2: Upload Hero Video
**Steps:**
1. Upload a video file
2. Check display

**Expected Result:**
- ✅ Video uploads successfully
- ✅ Video plays inline with controls
- ✅ Poster/thumbnail shows

### Test 3.3: Reorder Items
**Steps:**
1. Set order values: 0, 1, 2, 3, 4
2. Save and refresh
3. Verify order

**Expected Result:**
- ✅ Items display in order
- ✅ Order persists
- ✅ API returns items in correct order

### Test 3.4: Delete Hero Item
**Steps:**
1. Delete an item
2. Confirm

**Expected Result:**
- ✅ Item removed
- ✅ Remaining items still visible
- ✅ No errors

---

## Test Suite 4: Customer Dashboard (End-to-End)

### Test 4.1: View Customer Gallery
**Steps:**
1. As admin, upload files to TEST-001 project
2. Open customer dashboard: `/customer-dashboard`
3. Enter reference ID: `TEST-001`

**Expected Result:**
- ✅ Customer sees uploaded files
- ✅ Images load and display correctly
- ✅ Can select files for editing
- ✅ Selection count increases

### Test 4.2: Image Quality Verification
**Steps:**
1. Upload a high-res image (5000x3000px, 25MB)
2. View in customer dashboard
3. Open image in new tab
4. Zoom to 200%

**Expected Result:**
- ✅ Image displays at full resolution
- ✅ No pixelation or compression
- ✅ Original quality preserved
- ✅ File size matches original

---

## Test Suite 5: Public Pages

### Test 5.1: My Work Page
**Steps:**
1. Upload images to Public Gallery
2. Visit: `/my-work`
3. Browse categories

**Expected Result:**
- ✅ All images display
- ✅ Category filtering works
- ✅ Images load quickly
- ✅ No broken images

### Test 5.2: Home Page Hero
**Steps:**
1. Upload hero images/videos
2. Visit: `/`
3. Check hero section

**Expected Result:**
- ✅ Hero media displays
- ✅ Videos autoplay (if configured)
- ✅ Images are crisp and clear
- ✅ Responsive on mobile

---

## Test Suite 6: Performance & Quality

### Test 6.1: Load Time
**Steps:**
1. Upload 20 images to a gallery
2. Open page
3. Measure load time (DevTools → Network)

**Expected Result:**
- ✅ Initial load < 3 seconds
- ✅ Images lazy load
- ✅ No layout shift

### Test 6.2: File Size Verification
**Steps:**
1. Upload original file (e.g., 25MB image)
2. Check served file size:
```bash
curl -I http://localhost:3000/uploads/customer-gallery/TEST-001/folder/file.jpg
# Check Content-Length header
```

**Expected Result:**
- ✅ Content-Length matches original file size
- ✅ No compression applied
- ✅ Original quality served

### Test 6.3: Concurrent Uploads
**Steps:**
1. Open 2 browser tabs
2. Upload files simultaneously in both
3. Monitor for conflicts

**Expected Result:**
- ✅ Both uploads complete successfully
- ✅ No file name conflicts
- ✅ All files accessible

---

## Test Suite 7: Error Handling

### Test 7.1: No Folder Selected
**Steps:**
1. In Customer Gallery, don't select a folder
2. Try to upload files

**Expected Result:**
- ✅ Upload button disabled or shows alert
- ✅ Clear error message

### Test 7.2: No Category Selected
**Steps:**
1. In Public Gallery, don't select category
2. Try to upload

**Expected Result:**
- ✅ Upload blocked
- ✅ Alert: "Select a category first"

### Test 7.3: Upload Invalid File
**Steps:**
1. Try to upload a .txt or .pdf file
2. Check behavior

**Expected Result:**
- ✅ File rejected or gracefully handled
- ✅ Appropriate error message

### Test 7.4: Network Error
**Steps:**
1. Start upload
2. Disconnect network mid-upload
3. Reconnect

**Expected Result:**
- ✅ Error message displayed
- ✅ User can retry
- ✅ No partial uploads in DB

---

## Test Suite 8: Database Verification

### Test 8.1: Check Asset Records
**Steps:**
```bash
# Connect to MongoDB Atlas or local
# Check customer_assets collection

Expected fields:
- referenceId
- folderName
- name
- localPath: "/uploads/customer-gallery/{ref}/{folder}/{file}"
- url: same as localPath
- previewUrl: same as localPath
- mimeType
- size
- source: "local"
- importedAt
```

### Test 8.2: Check Public Gallery Records
**Steps:**
```bash
# Check public_gallery_media collection

Expected fields:
- categoryId
- name
- localPath
- url
- previewUrl
- mimeType
- type: "photo" or "video"
- order
- importedAt
```

---

## Test Suite 9: Backwards Compatibility

### Test 9.1: Existing Drive Files (if any)
**Steps:**
1. If you have old Drive records with `driveFileId`
2. Check if they still display

**Expected Result:**
- ✅ Old Drive files still work (if Drive integration kept)
- OR
- ✅ Clear migration path provided

---

## Test Suite 10: Production Readiness

### Checklist Before Deployment

- [ ] All uploads work in all 3 galleries
- [ ] Images display at original quality
- [ ] Videos play correctly
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Delete functions work
- [ ] Pagination works (Public Gallery)
- [ ] Customer dashboard displays files correctly
- [ ] Public pages display files correctly
- [ ] Upload directories have correct permissions
- [ ] .gitignore includes `/public/uploads/`
- [ ] Backup strategy for uploads folder
- [ ] Storage monitoring in place

### Performance Benchmarks
- Upload speed: < 2 seconds per 10MB file
- Page load: < 3 seconds
- Image display: < 1 second
- No memory leaks after 100 uploads

---

## Troubleshooting Guide

### Issue: Files not uploading
**Check:**
1. Directory permissions: `chmod 755 /app/public/uploads`
2. Check browser console for errors
3. Check network tab for failed requests
4. Verify API route is running

### Issue: Images not displaying
**Check:**
1. localPath is correct
2. File actually exists in /public/uploads/
3. Next.js static file serving is working
4. No CORS issues

### Issue: "Upload failed" error
**Check:**
1. File size limits (check UPLOAD_MAX_SIZE)
2. Disk space available
3. MongoDB connection
4. Check server logs: `tail -f /tmp/nextjs-dev.log`

### Issue: Slow uploads
**Check:**
1. File sizes
2. Network connection
3. Server resources
4. Consider adding upload progress indicator

---

## Success Criteria

✅ **All tests pass**
✅ **No Google Drive API calls**
✅ **Images display at original quality**
✅ **Faster loading than Drive integration**
✅ **Works offline/local development**
✅ **No MongoDB SSL issues**
✅ **Clean admin UI**
✅ **Responsive file upload**

---

## Regression Testing

After any code changes, re-run:
1. Test Suite 1 (Customer Gallery) - Full
2. Test Suite 2 (Public Gallery) - Upload & Display
3. Test Suite 3 (Home Gallery) - Upload & Display
4. Test Suite 4 (Customer Dashboard) - View files
5. Test Suite 6.2 (Quality verification)

---

## Documentation Updates Needed

1. Update README with new upload instructions
2. Document upload directory structure
3. Add backup procedures for uploads folder
4. Update deployment guide
5. Create admin user guide for file uploads

---

**Testing Timeline:** 2-3 hours for complete testing
**Critical Tests:** Suites 1, 2, 3, 4, 6
**Nice-to-Have Tests:** Suites 7, 8, 9
