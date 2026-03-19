# Speed Improvements Plan

## Context
Students experience noticeable delays across several flows: chat AI responses (1-3s blocking), knowledge queue grading (2-4s with double AI call on incorrect), and feedback report generation (can timeout at 60s). The knowledge grading label also appears to update after the feedback text, causing a jarring UX.

## 1. Chat Response Speed — Streaming + Backend Optimization

### Backend: Add streaming endpoint for chat messages
- **New endpoint**: `POST /threads/{threadId}/messages-stream` (or add `?stream=true` to existing)
- Since we're behind API Gateway HTTP API (no native streaming), use **chunked JSON responses** via Lambda:
  1. Return the student message immediately in the first response
  2. Use async Lambda self-invoke pattern (already exists for curriculum) to process the AI call
  3. Frontend polls for the tutor message via existing message list endpoint
- **Alternative (simpler)**: Keep synchronous but optimize the backend:
  - Parallelize DB lookups: fetch thread context, stage item, and conversation history concurrently using `concurrent.futures.ThreadPoolExecutor`
  - Save student message and fetch context in parallel (student message save doesn't depend on context)

### Frontend: Optimistic UI improvements
- Already shows typing indicator — ensure it appears instantly after send
- Show student message immediately (already done)

**Files to modify:**
- `backend/lambdalith/lambda_handler.py` — `handle_send_message()` (line 1659): parallelize DB calls with ThreadPoolExecutor
- `frontend/src/pages/ChatPage.tsx` — verify optimistic patterns are working

## 2. Knowledge Queue — Faster Next Item After Answer

### Problem
When a student answers incorrectly, `handle_complete_knowledge_queue_item` makes **2 sequential AI calls** (grade + generate retry question) plus **2 redundant full-table queries** before returning.

### Fix: Defer retry question generation + eliminate redundant queries
1. **Return immediately after grading**: After `grade_info()` completes, update the item status and return the result to the frontend right away
2. **Defer retry question generation**: Use async Lambda self-invoke to generate the retry question in the background (same pattern as curriculum upload)
3. **Advance next pending item immediately**: Move the "advance next pending" logic before the retry generation
4. **Eliminate duplicate queries**: The code queries all student items twice (lines 2707 and 2741) — combine into one query, filtered by unit using the GSI
5. **Remove redundant re-fetch**: Line 2698 re-fetches the item just updated — construct the response from known values instead

### Expected improvement
- Incorrect answer: ~2-4s → ~1-2s (removes second AI call from critical path)
- Correct answer: minor improvement from removing redundant query

**Files to modify:**
- `backend/lambdalith/lambda_handler.py`:
  - `handle_complete_knowledge_queue_item()` (line 2639): restructure flow
  - Add new `_internal` handler: `"generate-retry-question"` for async retry question gen
  - Router in `handler()` (line 3664): add new internal route

## 3. Feedback Generation — Speed + Correctness + New Metrics

### Speed: Parallelize AI summary generation
- Run `generate_teacher_summary()` and `generate_student_summary()` concurrently using `ThreadPoolExecutor`
- This cuts ~1-3s off report generation

### Speed: Make report generation async (non-blocking)
- When teacher or student first requests a report and none is cached:
  - Return a "generating" status immediately
  - Trigger async Lambda self-invoke to generate the report
  - Frontend shows "Sam is preparing your feedback..." and polls/refreshes
- This prevents the 60s timeout issue entirely

### Correctness checks
- **Proportion of answers**: `knowledgeCorrect/knowledgeTotal` logic looks correct — counts unique topics with any correct attempt
- **Timeliness badges**: `completedBeforeDeadline` only shows when ALL skills are complete — should also work for partial completion (show "In progress" with deadline info)
- **Feedback before assignment complete**: Currently, `handle_get_my_grading_report` returns null if no cached report, and `handle_get_unit_grading_report` (teacher) generates on-demand but can timeout. Fix: generate reports even when assignment is incomplete

### New metrics to add
- **Skills completed before deadline**: Already tracked as `skillCompletedBeforeDeadline` but not prominently displayed — add as a stat card
- **Completion date**: Show when the student finished (or "In progress") — use `latest_completion_ts` from objective details
- **Percentage completed by deadline**: `skillCompletedBeforeDeadline / skillTotal` — new stat card showing what fraction was done on time
- **Knowledge accuracy rate**: Already have `knowledgeCorrect/knowledgeTotal` — also show attempts count (total queue items vs topics)

**Files to modify:**
- `backend/lambdalith/lambda_handler.py`:
  - `handle_get_unit_grading_report()` (line 930): parallelize AI calls, add async generation pattern, add new metrics
  - `handle_get_my_grading_report()` (line 1230): trigger generation if missing (async)
  - Add `_internal` handler: `"generate-grading-report"`
- `backend/lambdalith/backend_code/grading_report_pipeline.py`: no changes needed (already modular)
- `frontend/src/pages/FeedbackUnitPage.tsx`: add new stat cards, handle "generating" state, add polling
- `frontend/src/types/domain.ts`: update `GradingReport` type with new fields

## 4. Knowledge Grading Label — Fix Timing

### Problem
After a wrong answer, the student sees "Good try, we'll revisit this." (frontend fallback text) and then the correct/incorrect label appears later after the queue refreshes.

### Root cause
In `ChatPage.tsx`, when grading completes:
1. The tutor feedback message is shown immediately (line 410-416)
2. The `gradedItemIds` set is updated (marks item as graded)
3. Then `refreshKnowledgeQueue()` is called (lines 427-432) which re-fetches all items
4. The label/status comes from the refreshed queue data

The label depends on the queue refresh completing, creating a visible delay between the feedback message and the status label.

### Fix
- Use the `updatedItem` from the API response directly to update the local knowledge item state, instead of waiting for the full queue refresh
- Set `is_correct` on the local item immediately from the response
- The queue refresh can still happen in the background for consistency

**Files to modify:**
- `frontend/src/pages/ChatPage.tsx`: update local knowledge item state from `completeKnowledgeAttempt` response before refreshing queue

## Implementation Order
1. **Knowledge grading label fix** (smallest, most visible UX win)
2. **Knowledge queue speed** (defer retry question gen)
3. **Chat response speed** (parallelize DB calls)
4. **Feedback generation** (async + new metrics)

## Verification
- Test each flow manually via the frontend after changes
- Check Lambda CloudWatch logs for timing improvements
- Verify knowledge queue items appear correctly after correct/incorrect answers
- Verify feedback page shows all stat cards and handles missing reports gracefully
- Run `npm run build` on frontend to catch TypeScript errors
