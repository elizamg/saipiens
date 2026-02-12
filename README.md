## sApIens

# Sprint 2 Progress

## Live App

**App Link:**  
https://sapiens-pp4l.vercel.app/

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
3. Log in
4. Explore courses
5. Enter a unit
6. Look through questions at different stages of progress

---

## Team Updates

### Eliza — Frontend

I built a few initial versions of the frontend and iterated by taking them back to the team. I implemented frontend changes that we discussed as a team and with our mentor.

We talked a lot about how we wanted the structure of questions to look and landed on having **Walkthrough** and **Challenge** subparts instead of difficulty-based questions. We also spent time thinking about how to display questions in the sidebar so it wouldn’t feel cluttered but would still give students the opportunity to explore.

With our mentor, we discussed how to indicate progress (we changed from stars to a progress circle), how green is typically reserved for success semantically (so we updated our color scheme), and how to make critical components stand out clearly to the user.

We also thought a lot about how to invite the user to engage and ask questions — by making walkthroughs feel like a conversation and adding suggested question pills.

All of these design decisions were made iteratively and are reflected in our current frontend.

---

### Brooke — TODO

*To be added.*

---

### Ben — TODO

*To be added.*



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
