# Test Plan - Image Quality Fix Validation

## Quick Validation Steps

### 1. Visual Inspection Test
**Goal:** Verify images display at full quality

**Steps:**
1. Start the application: `yarn dev`
2. Navigate to your gallery pages
3. Open an image in full view
4. Right-click → "Open in new tab"
5. Zoom in to 200% - check for pixelation

**Expected Result:**
- ✅ Sharp, clear images even when zoomed
- ✅ No visible compression artifacts
- ✅ Colors match original upload

**Previous Behavior:**
- ❌ Pixelated at 100% zoom
- ❌ Visible JPEG compression blocks
- ❌ Washed out colors

---

### 2. File Size Comparison Test
**Goal:** Confirm original files are being served

**Steps:**
1. Find a high-res image in your Drive folder
2. Note the original file size (e.g., 25 MB)
3. Open browser DevTools → Network tab
4. Load the image in your gallery
5. Check the transferred file size in Network tab

**Expected Result:**
- ✅ Network transfer size matches original file size
- ✅ Content-Length header shows full size

**Previous Behavior:**
- ❌ Only 300-800 KB transferred (thumbnail)
- ❌ Content-Length much smaller than original

---

### 3. API Endpoint Direct Test
**Goal:** Test the API directly

**Test with curl:**
```bash
# Replace FILE_ID with actual Google Drive file ID
curl -I "http://localhost:3000/api/drive/preview/YOUR_FILE_ID_HERE"
```

**Expected Headers:**
```
HTTP/1.1 200 OK
Content-Type: image/jpeg
Content-Length: 25437184    ← Should match original file size
Cache-Control: public, max-age=31536000, immutable
Content-Disposition: inline
```

**For RAW files (.ARW, .CR2, etc.):**
```
Content-Type: image/x-sony-arw   ← Proper RAW MIME type
Content-Length: 24571392         ← Full RAW file size
```

---

### 4. Different Format Test
**Goal:** Verify all formats work

**Test each format:**

| Format | File Extension | Expected Behavior |
|--------|---------------|-------------------|
| Standard JPEG | .jpg, .jpeg | ✅ Display in browser, full quality |
| PNG | .png | ✅ Display in browser, full quality |
| WebP | .webp | ✅ Display in browser, full quality |
| HEIC (iPhone) | .heic | ✅ Display in modern browsers |
| Sony RAW | .arw | ⬇️ Download (browser can't display) |
| Canon RAW | .cr2, .cr3 | ⬇️ Download (browser can't display) |
| Nikon RAW | .nef | ⬇️ Download (browser can't display) |
| DNG | .dng | ⬇️ Download (browser can't display) |
| Video | .mp4, .mov | ▶️ Stream with full quality |

---

### 5. Performance Test
**Goal:** Check if originals load reasonably fast

**Tools:**
- Browser DevTools → Network tab
- Lighthouse (Performance audit)

**Acceptable Ranges:**
- Small images (< 5 MB): Load in < 2 seconds
- Large images (5-20 MB): Load in 2-5 seconds  
- Very large (20-50 MB): Load in 5-10 seconds

**Note:** First load is slower; subsequent loads use cache.

---

### 6. Browser Console Test
**Goal:** Check for JavaScript errors

**Steps:**
1. Open Browser DevTools → Console
2. Navigate through gallery
3. Open various images/videos

**Expected:**
- ✅ No red errors related to image loading
- ✅ No CORS errors
- ✅ No MIME type warnings

---

### 7. Mobile Responsive Test
**Goal:** Ensure quality maintained on mobile

**Steps:**
1. Open site on mobile device or use DevTools mobile emulation
2. View gallery images
3. Pinch to zoom

**Expected:**
- ✅ Images remain sharp when zoomed
- ✅ Loading performance acceptable on 4G
- ⚠️ May be slower on 3G (expected with full-size images)

---

## Automated Test Script

Create a simple Node.js test:

```javascript
// test-image-quality.js
const https = require('https');

const testFileId = 'YOUR_FILE_ID_HERE'; // Replace with actual ID
const apiUrl = `http://localhost:3000/api/drive/preview/${testFileId}`;

https.get(apiUrl, (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Content-Type:', res.headers['content-type']);
  console.log('Content-Length:', res.headers['content-length'], 'bytes');
  console.log('Cache-Control:', res.headers['cache-control']);
  
  const sizeInMB = (parseInt(res.headers['content-length']) / 1024 / 1024).toFixed(2);
  console.log(`\nFile Size: ${sizeInMB} MB`);
  
  if (parseInt(res.headers['content-length']) > 1000000) {
    console.log('\n✅ PASS: Serving large original file (not thumbnail)');
  } else {
    console.log('\n❌ FAIL: File too small, might be thumbnail');
  }
});
```

**Run:**
```bash
node test-image-quality.js
```

---

## Before vs After Comparison

### Example: High-res Sony ARW RAW file (6000x4000px)

**BEFORE Fix:**
```
Content-Type: image/jpeg
Content-Length: 653824 (638 KB)
Quality: Compressed thumbnail
Zoom: Pixelated at 100%
```

**AFTER Fix:**
```
Content-Type: image/x-sony-arw
Content-Length: 24571392 (23.4 MB)
Quality: Original RAW file
Zoom: Sharp at 200%+
```

**Quality Improvement:** ~3,663% more data = Original quality preserved ✅

---

## Known Limitations

### RAW Format Browser Support
**Issue:** Browsers cannot natively display RAW formats (.ARW, .CR2, etc.)

**Current Behavior:** 
- Browser prompts to download
- File downloads as original RAW

**User Experience Options:**
1. **Keep as-is:** Professional photographers download originals (current)
2. **Add conversion:** Server converts RAW → high-quality JPEG for viewing
3. **Hybrid:** Show JPEG preview, offer RAW download button

**To implement option 2 (if needed):**
```javascript
// Would require Sharp library to convert RAW → JPEG
import sharp from 'sharp';

// In route.js, add conversion for RAW files
if (isRawFormat(name)) {
  const buffer = await streamToBuffer(res.data);
  const converted = await sharp(buffer)
    .jpeg({ quality: 95 })
    .toBuffer();
  return new NextResponse(converted, {
    headers: { 'Content-Type': 'image/jpeg' }
  });
}
```

---

## Success Criteria

Your fix is working correctly if:

- ✅ Standard images (JPG, PNG) display at original quality
- ✅ File sizes match originals (check Network tab)
- ✅ No compression artifacts visible
- ✅ Videos stream smoothly without quality loss
- ✅ HEIC files display on supported browsers
- ✅ RAW files download as originals (or convert if implemented)
- ✅ Proper MIME types in headers
- ✅ Cache headers set correctly

---

## Rollback Plan (If Needed)

If the fix causes issues, you can revert:

```bash
cd /app
git diff src/app/api/drive/preview/[fileId]/route.js
git checkout HEAD -- src/app/api/drive/preview/[fileId]/route.js
```

Or restore from backup in `/app/lca-photography-website/`

---

## Next Steps After Validation

Once you confirm quality is fixed:

1. **Optimize loading speed** (if needed):
   - Add lazy loading
   - Implement progressive images
   - Consider CDN

2. **Monitor performance**:
   - Check Google Drive API usage
   - Monitor bandwidth costs
   - Track page load times

3. **User feedback**:
   - Ask clients about quality improvement
   - Gather feedback on load times
   - Adjust based on real usage

4. **Consider enhancements**:
   - RAW file conversion (if needed)
   - Watermarking option
   - Download button for originals

---

**Questions or Issues?** Check the IMAGE_QUALITY_FIX_SUMMARY.md for technical details.
