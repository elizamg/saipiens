## Skill Question User Flow

To start a skill question, the user first selects one from the sidebar. The skill questions are named "Skill 1" and so on in the side bar.

Each skill question can have multiple "attempts". Each attempt is independent. There are two types of attempts: challenge and walkthrough. A single skill question can have multiple attempts of each type in any order.

A skill question is complete when a student completes a challenge attempt. This results in the circle progress indicator for the skill question being completely green, and the overall skill progress bar going up.

When the user opens a skill question, they are first see a walkthrough attempt. In the top right corner across from the title, there is a purple button that says "SKIP WALKTHROUGH". Pressing this button creates a new challenge attempt and moves the user to viewing the challenge attempt. When avalible, the new challenge attempt should pick a different question generated for the skill (there are at least one questions generated for each skill). (The user can nagivate between attempts using arrow buttons to either side of the title.) In challenge attempts, the "SKIP WALKTHROUGH" button is replaced with a label saying "CHALLENGE".

If the user gets the challenge completely wrong, they get feedback and a "Start Walkthrough" button shows up at the bottom of the screen.

If the user gets the challenge completely correct, they aren't able to submit any more answers (only clarifying questions).

If the user just has a small mistake, they're able to submit a new answer for grading.

The circle progress indicator should turn grey after a student has submitted any response. Overriding this, the circle should turn half green and half grey once the student has completed a walkthrough question. Finally, overriding all the others, the circle should be fully filled with green once the student has completed a challenge attempt for that skill question.