## sApIens

# Sprint 2 Progress

## Live App

**App Link:**  
[https://sapiens-pp4l.vercel.app/](https://sapiens-f402hfs6b-lizzyg2003-1130s-projects.vercel.app)

Or run locally:

```bash
git clone https://github.com/elizamg/sapiens.git
cd sapiens/frontend
npm install
npm run dev
````

## Current User Flow

1. Click **Get Started**
2. Log in
3. Explore courses
4. Enter a unit
5. Look through questions at different stages of progress

## Backend

We weren't able to finish the backend this sprint, so our backend code doesn't run. Our endpoints are planned in the [FRONTEND_BACKEND_CONTRACT.md](FRONTEND_BACKEND_CONTRACT.md), with our specific pipelines planned in [agent_diagram.svg](https://github.com/elizamg/sapiens/blob/main/research_and_design/agent_diagram.svg). Our prompts can be found in [prompts](https://github.com/elizamg/sapiens/tree/main/backend/lambdalith/backend_code/prompts) (excluding our scaffolded question pipeline prompts and info feedback prompt, which haven't been finished).

---

## Team Updates

### Ben - Research and Backend

For this sprint, I started by researching best education and teaching practices ([teaching_methods_research.md](https://github.com/elizamg/sapiens/blob/main/research_and_design/teaching_methods_research.md)), to inform the "why" behind our usage of AI for homework, differentiate our product, and to clarify core design decisions before implimenting our project.

Based on this, I created a mock "assignments" page ([concept_assignment_page.pdf
](https://github.com/elizamg/sapiens/blob/main/research_and_design/concept_assignment_page.pdf)) to make our concept more concrete and allow my group and I to discuss and decide specifically what our system will do and how it will work. In addition, I created a specification for how our different LLM-based features will work ([agent_diagram.svg](https://github.com/elizamg/sapiens/blob/main/research_and_design/agent_diagram.svg)).

Some specific insights that came from this design work were:
- Moving from "easy-medium-hard" skill questions to scaffolded verses independent skill questions
- Prioritizing immediate feedback as a selling point of our product
- Splitting information questions and skills, since information needs to be delivered in a certain order (i.e. can't give the answer then allow the student to try the question again right after)
- Decide how feedback should be given for skills
- Removing the names from skills so the student needs to identify what tools they've learned to apply to the problem
- Using spaced repetition through a review section with adapative problems based on the student's past experience
- Having a capstone section where the student answers "explain-it-back-to-me" questions

The design decisions were discussed with my group, and Eliza had great ideas about what feedback to give for information questions and how to structure the UI.

After this, I worked on writing and testing the prompts for the different parts of the pipelines ([prompts](https://github.com/elizamg/sapiens/tree/main/backend/lambdalith/backend_code/prompts)); and writing and structuring the backend code. I also worked on fixing some git history issues our group ran into.

### Eliza — Frontend and Vercel Hosting

I built a few initial versions of the frontend and iterated by taking them back to the team. I implemented frontend changes that we discussed as a team and with our mentor.

We talked a lot about how we wanted the structure of questions to look and landed on having **Walkthrough** and **Challenge** subparts instead of difficulty-based questions. We also spent time thinking about how to display questions in the sidebar so it wouldn’t feel cluttered but would still give students the opportunity to explore.

With our mentor, we discussed how to indicate progress (we changed from stars to a progress circle), how green is typically reserved for success semantically (so we updated our color scheme), and how to make critical components stand out clearly to the user.

We also thought a lot about how to invite the user to engage and ask questions — by making walkthroughs feel like a conversation and adding suggested question pills.

All of these design decisions were made iteratively and are reflected in our current frontend.

---

### Brooke - AWS Infrastructure and Backend 

First, I worked on setting up the necessary AWS Infrastructure for our project.

Specifically, I've configured Congito for authentification (and worked with Eliza to include this in the frontend); created the DynamoDB tables for the different information our application needs to store and communicated with other teammembers to design our tables; and got our Lambda function set up (we're using one big Lambda function (a Lambdaith) for simplicity and fewer cold starts). Cognito is currently disabled for testing purposes.

Next, I started work on fufilling the frontend-backend contract through Lambda router code that registers incoming requests and sends back formatted information from the databases [febe-contract branch](https://github.com/elizamg/sapiens/tree/febe-contract). More recent changes can be seen in [backend-setup branch] (https://github.com/elizamg/sapiens/tree/backend-setup).

The backend is fully contract-complete and implemented using:

- AWS Lambda (Python 3.12)
- API Gateway (HTTP API v2)
- DynamoDB (multi-table design)
- Cognito JWT (production auth)
- Dev-header auth fallback (for browser testing)

All backend documentation lives in `/backend`:

- **Architecture Overview**  
  [backend/sapiens_backend_master_document.md](backend/sapiens_backend_master_document.md)

- **DynamoDB Table Schema**  
  [backend/table_schema.md](backend/table_schema.md)

- **API Route Schema**  
  [backend/route_schema.md](backend/route_schema.md)

- **Browser Testing Guide (No AWS Credentials Required)**  
  [backend/browser_testing_guide.md](backend/browser_testing_guide.md)

- **Production TODO & Hardening Checklist**  
  [backend/backend_TODO.md](backend/backend_TODO.md)

---





## Sprint 1 Progress

[Figma Demo](https://www.figma.com/proto/GtyuApL5TlYQUJhwWFYQNR/SAIPIENS?node-id=13007-15&t=kIJol6aDAmDJwseV-1&scaling=scale-down&content-scaling=fixed&page-id=3%3A2&starting-point-node-id=13007%3A15)


Running the Project

1. Clone the repo  
   git clone https://github.com/elizamg/sapiens.git

2. Navigate to the frontend  
   cd sapiens/frontend

3. Install dependencies  
   npm install

4. Start the dev server  
   npm run dev

5. Open the app  
   Visit http://localhost:5173 in your browser


Viewing Prompts and the Prompt Testing:

- Prompt testing can be viewed in the document Initial Prompt Testing.txt
- Initial prompts can be viewed in the document Initial_Prompts.rtf


sApIens is a process-first, AI-driven learning system that redefines how homework, feedback, and assessment work in schools.

Rather than producing answers or explanations, sApIens structures learning around student reasoning, adapting questions, feedback, and pacing based on how a student thinks, not just whether they are correct.

sApIens is not a tutor.
It is an instructional system designed to make thinking visible.

## Motivation

The American education system is facing a systemic mismatch:
- Teachers are overstretched and under-resourced
- Students receive limited individualized feedback
- Homework is graded on outcomes, not understanding
- AI is increasingly present—but institutionally restricted

Current policies attempt to limit AI usage in schools. sApIens explores a different approach:
What if AI were used to reshape learning workflows instead of bypassing them?

sApIens is built on the premise that AI can:
- Reduce repetitive grading and explanation work
- Surface student misconceptions in real time
- Preserve teacher authority and curriculum control
- Encourage genuine critical thinking at scale

## What sApIens Does

sApIens is a process-centric homework and assessment system built on teacher-provided materials.

At a high level:
1. Teachers upload curriculum artifacts (textbooks, worksheets, calendars)
2. Content is structured into units, skills, and knowledge components
3. AI generates adaptive, process-aware homework
4. Students work through assignments while the system responds to their reasoning
5. Teachers receive structured reports that reflect understanding, not just completion

The system emphasizes learning dynamics, not answer production.

## Core Principles
- Process over product
  
Reasoning, explanation, and reflection are primary signals.

- Adaptive instructional flow
  
Problem difficulty and sequencing change based on student input.

- Misconception detection
  
Errors trigger targeted feedback and reframed questions.

- Teacher-defined instruction
  
Curriculum originates from educators, not the model.

- Safety and focus by desig
  
Instructional agents are constrained, on-task, and privacy-preserving.

## Goal
To transform homework and assessment into a process-first learning system that makes student reasoning visible while reducing teacher workload. To not fear AI in schools, but utilize it to better the experience of learning.
