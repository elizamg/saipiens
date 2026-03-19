# AI Pipelines

This document describes the AI-powered pipelines that drive curriculum generation, tutoring, and grading in Sapiens. All pipelines use Google's **Gemini 3 Flash** model via the Google GenAI SDK.

## Overview

Sapiens uses four distinct AI pipelines, each serving a different stage of the learning workflow:

| Pipeline | Purpose | Trigger | Location |
|----------|---------|---------|----------|
| Curriculum Generation | Extract learning objectives from uploaded documents and generate questions | Teacher uploads PDFs | `gen_curriculum_pipeline.py` |
| Scaffolded Tutoring | Walk students through problems step-by-step | Student sends message in walkthrough stage | `scaffolded_question_pipeline.py` |
| Knowledge Grading | Grade factual recall answers (correct/incorrect + feedback) | Student submits answer to knowledge question | `info_question_pipeline.py` |
| Skill Grading | Grade applied skill answers (4-category rubric + feedback) | Student submits answer to skill/capstone challenge | `challenge_question_pipeline.py` |

## Shared Infrastructure

### Model Configuration

- **Model:** `gemini-3-flash-preview`
- **API Key:** `SAIPIENS_GEMINI_API_KEY` environment variable
- **Client:** Google GenAI SDK (`google.genai`)
- **Output format:** Structured JSON (via `response_mime_type: "application/json"` and `response_schema`)

### Prompt System

All prompts live in `backend/lambdalith/backend_code/prompts/` as paired files:
- `*_prompt.txt` — The prompt template with `{{PLACEHOLDER}}` variables
- `*_schema.json` — The JSON schema that constrains the model's output

The `Prompt` class (`utils/prompt.py`) renders templates by substituting `{{PLACEHOLDER}}` with provided arguments. The `get_prompt_details` utility (`utils/get_prompt_details.py`) loads prompt + schema pairs from disk.

### Retry Strategy

All AI calls use [tenacity](https://tenacity.readthedocs.io/) for automatic retries:
- Configurable attempt limits and timeout windows per pipeline
- Exponential backoff for rate-limited calls (curriculum generation)
- Graceful fallback on failure (e.g., retry question generation falls back to original question)

---

## 1. Curriculum Generation Pipeline

**File:** `gen_curriculum_pipeline.py`
**Class:** `Gen_Curriculum_Pipeline`

### Purpose

Transforms uploaded curriculum documents (PDFs) into structured learning objectives and questions.

### Flow

```
Teacher uploads PDF(s)
        │
        ▼
┌─────────────────────┐
│ Upload to Gemini     │  (upload_pdf)
│ Files API            │  Retries: 2 attempts, 120s timeout
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Identify Knowledge   │  (identify_knowledge)
│ from uploaded file   │  Retries: 3 attempts, 11min timeout
└─────────┬───────────┘
          │
          ▼ Returns list of { type: "knowledge"|"skill", description }
          │
          ▼
┌─────────────────────┐
│ Generate Questions   │  (async, parallel)
│ 1 per objective      │  Concurrency: 2, Retries: 6, 5min timeout
│                      │  Exponential backoff (2x, 1-10s)
└─────────────────────┘
```

### Prompts Used

| Prompt | Input | Output |
|--------|-------|--------|
| `identify_knowledge` | Uploaded PDF file | `{ knowledge_list: [{ type, description }] }` |
| `gen_skill_question` | Grade, Subject, Skill description | `{ Question: string }` |
| `gen_info_question` | Grade, Subject, Knowledge description | `{ Question: string }` |

### Integration with Lambda

When a teacher uploads documents:

1. `POST /courses/{courseId}/units/upload` — Creates Unit, stages files in S3, returns presigned URLs
2. Browser uploads files directly to S3
3. `POST /units/{unitId}/process` — Lambda invokes itself asynchronously (`InvocationType: Event`)
4. Background Lambda:
   - Downloads files from S3
   - Runs `Gen_Curriculum_Pipeline`
   - Persists Objectives, ItemStages (3 per objective), Questions, and KnowledgeTopics to DynamoDB
   - Updates Unit status to `"ready"` or `"error"`
5. Frontend polls `GET /units/{unitId}/upload-status` every 3 seconds

### Rate Limiting

Question generation is rate-limited to 2 concurrent requests (via `asyncio.Semaphore`) to stay within the Gemini free-tier limit of 5 requests/minute. Retries use exponential backoff.

---

## 2. Scaffolded Tutoring Pipeline

**File:** `scaffolded_question_pipeline.py`
**Function:** `scaffolded_question_step(subject, grade, question, conversation)`

### Purpose

Acts as an AI tutor that walks students through problems step-by-step during the walkthrough stage.

### Behavior

- **First turn** (empty conversation): Introduces the problem and explains the first step
- **Subsequent turns**: Evaluates the student's last response — if correct, explains the next step; if incorrect, helps correct their work
- **Completion**: Sets `Is_Finished: true` when the student reaches a satisfactory answer

### Input

| Parameter | Source | Example |
|-----------|--------|---------|
| `subject` | Course title | "Life Science" |
| `grade` | Student year label | "7" |
| `question` | Objective title / stage prompt | "Explain what happens to chromosomes during mitosis..." |
| `conversation` | Chat history (oldest-first) | `[{role: "tutor", content: "..."}, {role: "student", content: "..."}]` |

### Output

```json
{
  "Tutor_Response": "Great observation! Now let's think about...",
  "Is_Finished": false
}
```

### Prompt

| Prompt | Variables |
|--------|-----------|
| `scaffolded_question` | `{{GRADE}}`, `{{SUBJECT}}`, `{{QUESTION}}`, `{{CONVERSATION}}` |

Conversation is formatted as:
```
[Student]: Their message here
[Tutor]: Tutor's response here
```

### Retry Configuration

- 3 attempts max
- 3-minute timeout window

---

## 3. Knowledge Grading Pipeline

**File:** `info_question_pipeline.py`
**Functions:** `grade_info(...)`, `generate_info_question(...)`

### Purpose

Grades factual recall (knowledge) answers as correct or incorrect and provides feedback. Also generates new questions for retry attempts.

### Grading: `grade_info(grade, subject, information, question, answer)`

| Parameter | Source | Example |
|-----------|--------|---------|
| `grade` | Student year label | "7" |
| `subject` | Course title | "Science" |
| `information` | Knowledge topic description | "Mitosis: the process by which a cell..." |
| `question` | The question text | "How many chromosomes will each daughter cell contain?" |
| `answer` | Student's submitted answer | "26 chromosomes" |

**Output:** `(is_correct: bool, tutor_feedback: str)`

**Prompt:** `gen_info_feedback` with variables `{{GRADE}}`, `{{SUBJECT}}`, `{{INFORMATION}}`, `{{QUESTION}}`, `{{ANSWER}}`

### Question Generation: `generate_info_question(grade, subject, description)`

Generates a new question for a knowledge topic (used when a student answers incorrectly and needs a retry).

**Output:** `str` (the question text)

**Prompt:** `gen_info_question` with variables `{{GRADE}}`, `{{SUBJECT}}`, `{{DESCRIPTION}}`

### Integration

When a student completes a knowledge queue item (`POST /knowledge-queue/{id}/complete`):

1. `grade_info()` determines correctness and generates feedback
2. If incorrect: `generate_info_question()` creates a new retry question, and a new queue item is appended
3. The next pending queue item is advanced to `"active"` status
4. Response includes the updated item, feedback, and optional new queue item

---

## 4. Skill Grading Pipeline

**File:** `challenge_question_pipeline.py`
**Function:** `grade_skill(grade, subject, skill, question, answer)`

### Purpose

Grades applied skill and capstone answers using a 4-category rubric.

### Input

| Parameter | Source | Example |
|-----------|--------|---------|
| `grade` | Student year label | "7" |
| `subject` | Course title | "Science" |
| `skill` | Skill description | "Applying Newton's First Law to real-world scenarios" |
| `question` | The challenge question | "A hockey puck slides across ice..." |
| `answer` | Student's submitted answer | "The puck will keep moving because..." |

### Output

`(category: GradingCategory, feedback: str)`

### Grading Categories

| Category | Meaning |
|----------|---------|
| `correct` | Fully correct answer |
| `slight clarification` | Mostly right, minor clarification needed |
| `small mistake` | On the right track but has a meaningful error |
| `incorrect` | Fundamentally wrong approach or answer |

**Prompt:** `grade_skill` with variables `{{GRADE}}`, `{{SUBJECT}}`, `{{SKILL}}`, `{{QUESTION}}`, `{{ANSWER}}`

---

## Prompt Inventory

All prompt files in `backend/lambdalith/backend_code/prompts/`:

| Prompt Name | Files | Used By |
|-------------|-------|---------|
| `identify_knowledge` | `identify_knowledge_prompt.txt` + `_schema.json` | Curriculum generation |
| `gen_skill_question` | `gen_skill_question_prompt.txt` + `_schema.json` | Curriculum generation |
| `gen_info_question` | `gen_info_question_prompt.txt` + `_schema.json` | Curriculum generation + retry |
| `scaffolded_question` | `scaffolded_question_prompt.txt` + `_schema.json` | Walkthrough tutoring |
| `gen_info_feedback` | `gen_info_feedback_prompt.txt` + `_schema.json` | Knowledge grading |
| `grade_skill` | `grade_skill_prompt.txt` + `_schema.json` | Skill/capstone grading |
| `grade_info` | `grade_info_prompt.txt` + `_schema.json` | (alternate grading prompt) |
| `gen_clarifying_questions` | `gen_clarifying_questions_prompt.txt` + `_schema.json` | Clarifying questions (future) |
| `gen_clarifying_question_answer` | `...prompt.txt` + `_schema.json` | Clarifying question answers (future) |
| `gen_mock_student_answer` | `...prompt.txt` | Test data generation |

## Running Pipelines Locally

Each pipeline file has a `__main__` block for standalone testing:

```bash
cd backend/lambdalith/backend_code
export SAIPIENS_GEMINI_API_KEY=<your-key>

# Curriculum generation — downloads sample PDF, identifies knowledge, generates questions
python gen_curriculum_pipeline.py

# Scaffolded tutoring — interactive CLI conversation with the AI tutor
python scaffolded_question_pipeline.py

# Knowledge grading — generates a question, prompts for your answer, grades it
python info_question_pipeline.py
```

## Design Decisions

### Why Gemini Flash?

Gemini 3 Flash provides fast, low-cost structured JSON output — ideal for the high volume of grading and question generation calls. The free tier supports development and testing.

### Why Structured JSON Output?

All prompts use `response_mime_type: "application/json"` with a `response_schema`. This ensures:
- Deterministic output parsing (no regex or string extraction)
- Type-safe responses (booleans, enums, strings)
- Fewer retries from malformed output

### Why Async Curriculum Generation?

API Gateway has a 30-second integration timeout. Curriculum generation can take 30-120 seconds for large PDFs. The async pattern (Lambda self-invocation with `InvocationType: Event`) allows the frontend to return immediately and poll for status.

### Why Rate-Limited Parallel Generation?

The free-tier Gemini API has a 5 requests/minute limit. Using `asyncio.Semaphore(2)` with exponential backoff keeps throughput high while avoiding 429 errors.
