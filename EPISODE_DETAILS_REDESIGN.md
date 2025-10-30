# 🎨 Episode Details Page - Comprehensive Redesign Plan

## Current Issues Identified

### **Episode Header**
- ❌ No thumbnail displayed
- ❌ Description missing
- ❌ Recorded/Published dates not shown
- ❌ No raw video link
- ❌ No YouTube link visible
- ❌ Cannot edit or delete from this page
- ❌ Duration format: "0:00 → 2:08" (inconsistent with list page)
- ❌ No comments section

### **Filters Section**
- ❌ Inconsistent behavior: Status (deselect to filter out) vs Speaker (select to filter in)
- ❌ Vertical layout wastes space
- ❌ Status filters lack clear selection indicators
- ❌ No visual consistency between filter types

### **Highlights Section**
- ❌ Missing prompt information (name + version)
- ❌ No comments system
- ❌ No raw_video_link shown
- ❌ No edited_video_link shown
- ❌ No social media targeting badges
- ❌ Cannot edit highlights
- ❌ Cannot add/remove/reorder segments

---

## Design Solutions

### **1. Episode Header Redesign**

```
┌──────────────────────────────────────────────────────────────┐
│ [← Back]                                      [Edit] [Delete] │
│                                                                │
│ ┌────────┐  Episode Title                         [Status]   │
│ │        │  Duration: 1:07:22 • Created: Jan 15, 2025        │
│ │ Thumb  │  🎬 YouTube • 📹 Raw Video                        │
│ │192x112 │                                                    │
│ └────────┘  Recorded: Jan 10, 2025 • Published: Jan 15, 2025│
│                                                                │
│             Description: Lorem ipsum dolor sit amet...        │
│                                                                │
│             💬 Comments (3) [View Comments]                   │
└──────────────────────────────────────────────────────────────┘
```

**Features:**
- Large thumbnail (left)
- All metadata visible
- Edit/Delete buttons (top right)
- Comments section with count
- Links clearly marked with icons
- Consistent duration format

### **2. Unified Filter System**

**Before:** Vertical, inconsistent
**After:** Horizontal, consistent multi-select

```
┌──────────────────────────────────────────────────────────────┐
│ Filters                                                       │
│                                                                │
│ Status:   [✓ Pending] [✓ Approved] [✓ Discarded]            │
│                                                                │
│ Speaker:  [✓ Host] [✓ Guest] [ André]  Clear (2 selected)   │
└──────────────────────────────────────────────────────────────┘
```

**Behavior:**
- **Both use checkboxes** (multi-select)
- **Horizontal layout** (more space-efficient)
- **Visual checkbox indicators** (✓)
- **Show count** when filters active
- **Clear button** for each filter type

### **3. Enhanced Highlights**

```
┌──────────────────────────────────────────────────────────────┐
│ 0:45 → 1:15  [Approved]  [Host] [Guest]          [Edit] [⋮] │
│                                                                │
│ Prompt: Viral Moments (v2)                                   │
│ Transcript text here...                                       │
│                                                                │
│ 💬 Comments (2) • 📹 Raw Video • ✂️ Edited Video            │
│ 📱 Posting to: [Instagram] [TikTok]                          │
│                                                                │
│ Segments: [1] [3] [7]  (3 segments, non-sequential)         │
└──────────────────────────────────────────────────────────────┘
```

**Features:**
- Prompt name + version
- Comments count + link
- Video links (raw + edited)
- Social media badges
- Segment chips showing which segments compose the highlight
- Edit button opens comprehensive editor
- Menu (⋮) for additional actions

### **4. Highlight Editor (New)**

```
┌────────────────────────────────────────────────────────────┐
│ Edit Highlight                                         [✕]  │
├────────────────────────────────────────────────────────────┤
│ Status: [Dropdown: Pending/Approved/Discarded]            │
│                                                             │
│ Segments: (Drag to reorder)                                │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ [⋮] Segment 1: 0:45-0:52  "Text..."          [✕]   │   │
│ │ [⋮] Segment 3: 1:05-1:12  "Text..."          [✕]   │   │
│ │ [⋮] Segment 7: 2:30-2:40  "Text..."          [✕]   │   │
│ │ [+] Add Segment                                      │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ Comments:                                                   │
│ [Textarea]                                                  │
│                                                             │
│ Video Links:                                                │
│ Raw Video:    [Input]                                      │
│ Edited Video: [Input]                                      │
│                                                             │
│ Social Media:                                               │
│ [☑ Instagram - @myprofile]                                │
│ [☐ TikTok - @myprofile]                                   │
│ [☐ LinkedIn - My Page]                                    │
│                                                             │
│                                    [Cancel] [Save Changes] │
└────────────────────────────────────────────────────────────┘
```

**Features:**
- Drag handles (⋮) for reordering
- Delete segment (✕)
- Add segment button with segment picker
- Comments textarea
- Video link inputs
- Social media checkboxes
- Non-sequential segments supported
- Reordering can shuffle timestamps

---

## Database Schema Updates Needed

### **1. Highlight Comments Table**

```sql
CREATE TABLE highlight_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    highlight_id UUID NOT NULL REFERENCES highlights(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_highlight_comments_highlight_id ON highlight_comments(highlight_id);
```

### **2. Segment Highlights Junction (NEW)**

Need to track which segments compose each highlight with ordering:

```sql
CREATE TABLE highlight_segments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    highlight_id UUID NOT NULL REFERENCES highlights(id) ON DELETE CASCADE,
    segment_id UUID NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
    sequence_order INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(highlight_id, segment_id)
);

CREATE INDEX idx_highlight_segments_highlight_id ON highlight_segments(highlight_id);
CREATE INDEX idx_highlight_segments_segment_id ON highlight_segments(segment_id);
```

### **3. Update Highlights Table**

Add video links:

```sql
ALTER TABLE highlights
ADD COLUMN raw_video_link TEXT,
ADD COLUMN edited_video_link TEXT;
```

### **4. Social Profiles & Junction**

Already exists in schema:
- `social_profiles` table
- `highlight_profiles` junction table

---

## Implementation Plan

### **Phase 1: Database** ✓
1. Create migration `006_highlight_enhancements.sql`
2. Add `highlight_comments` table
3. Add `highlight_segments` table
4. Add video link fields to highlights

### **Phase 2: Backend APIs** ✓
1. Create `/api/highlights/{id}/comments` endpoints (CRUD)
2. Create `/api/highlights/{id}/segments` endpoints (CRUD with ordering)
3. Update highlights endpoints to include:
   - Prompt info
   - Video links
   - Social profiles
   - Comments count
   - Segments list

### **Phase 3: Episode Header** ✓
1. Display thumbnail
2. Show all metadata
3. Add Edit/Delete buttons
4. Add Comments section
5. Fix duration format
6. Add all links

### **Phase 4: Unified Filters** ✓
1. Make status filters multi-select with checkboxes
2. Redesign horizontal layout
3. Make both filter types consistent
4. Add visual indicators

### **Phase 5: Enhanced Highlights** ✓
1. Display prompt info
2. Show comments count
3. Show video links
4. Show social media badges
5. Show segment composition

### **Phase 6: Highlight Editor** ✓
1. Create comprehensive edit dialog
2. Add segment management (add/remove/reorder)
3. Add comments textarea
4. Add video link inputs
5. Add social media checkboxes
6. Implement drag-and-drop for segments

---

## UI Components Needed

### **New Components:**
1. `Checkbox` (from shadcn) - Already added
2. `Select` (from shadcn) - For status dropdown
3. `Textarea` (from shadcn) - For comments
4. `DragHandle` (custom) - For segment reordering
5. `SegmentPicker` (custom) - Modal to add segments

### **Modified Components:**
1. Episode detail page - Complete overhaul
2. Highlight card - Enhanced with all new data

---

## Accessibility Considerations

- **Keyboard Navigation**: All filters navigable by keyboard
- **Screen Readers**: Proper ARIA labels on all interactive elements
- **Focus Management**: Clear focus states on checkboxes and buttons
- **Drag-and-Drop**: Alternative keyboard shortcuts for reordering

---

## Performance Optimizations

- **Lazy Load**: Segments/highlights load on demand
- **Debounced Search**: If adding segment search
- **Optimistic Updates**: UI updates before API confirmation
- **Batch Operations**: Update multiple segments at once

---

**Estimated Implementation Time:** 3-4 hours for complete overhaul

**Priority Order:**
1. Episode Header (High visibility, quick win)
2. Unified Filters (Improves UX significantly)
3. Database Schema (Foundation for rest)
4. Backend APIs (Enable frontend features)
5. Enhanced Highlights (Most complex, highest value)
6. Highlight Editor (Power user feature)

