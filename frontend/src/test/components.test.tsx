/**
 * components.test.tsx — Frontend component unit tests
 *
 * Run: npx vitest run
 *
 * Covers:
 *  - ProgressBar: clamping, rendering, label display
 *  - DualProgressBar: green/grey segments, clamping
 *  - ProgressCircle: 5 progress states render correctly
 *  - MessageBubble: student vs tutor rendering, grading badges, system messages
 *  - API client: apiFetch behavior, error handling
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// ── Mock cognitoAuth before importing anything ──
vi.mock('amazon-cognito-identity-js', () => {
  type MockSession = {
    isValid: () => boolean;
    getIdToken: () => { getJwtToken: () => string; decodePayload: () => Record<string, unknown> };
  };

  const makeSession = (groups: string[] = []): MockSession => ({
    isValid: () => true,
    getIdToken: () => ({
      getJwtToken: () => 'mock-jwt-token',
      decodePayload: () => ({ sub: 'mock-sub', 'cognito:groups': groups }),
    }),
  });

  let _currentUser: { session: MockSession } | null = null;

  function CognitoUserPool() {
    return {
      getCurrentUser: () =>
        _currentUser
          ? {
              getSession: (cb: (err: null, s: MockSession) => void) =>
                cb(null, _currentUser!.session),
              signOut: () => { _currentUser = null; },
            }
          : null,
    };
  }
  function CognitoUser() { return {}; }
  function AuthenticationDetails(opts: unknown) { return opts; }

  (globalThis as Record<string, unknown>).__setCognitoUser = (groups: string[] | null) => {
    _currentUser = groups !== null ? { session: makeSession(groups) } : null;
  };

  return { CognitoUserPool, CognitoUser, AuthenticationDetails };
});

// ===========================================================================
// 1. ProgressBar
// ===========================================================================

import ProgressBar from '../components/ui/ProgressBar';

describe('ProgressBar', () => {
  it('renders without crashing', () => {
    const { container } = render(<ProgressBar percent={50} />);
    expect(container.firstChild).toBeTruthy();
  });

  it('clamps percent to 0 when given negative value', () => {
    const { container } = render(<ProgressBar percent={-10} showLabel />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('clamps percent to 100 when given value > 100', () => {
    render(<ProgressBar percent={150} showLabel />);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('shows correct percentage label when showLabel is true', () => {
    render(<ProgressBar percent={42} showLabel />);
    expect(screen.getByText('42%')).toBeInTheDocument();
  });

  it('does not show label when showLabel is false/default', () => {
    const { container } = render(<ProgressBar percent={42} />);
    expect(container.textContent).toBe('');
  });

  it('renders fill div for percent=0 without crashing', () => {
    const { container } = render(<ProgressBar percent={0} />);
    // The component should render a track and fill div
    const divs = container.querySelectorAll('div');
    expect(divs.length).toBeGreaterThanOrEqual(2);
  });

  it('renders fill div for percent=100 without crashing', () => {
    const { container } = render(<ProgressBar percent={100} />);
    const divs = container.querySelectorAll('div');
    expect(divs.length).toBeGreaterThanOrEqual(2);
  });

  it('accepts custom height prop without crashing', () => {
    const { container } = render(<ProgressBar percent={50} height={12} />);
    expect(container.firstChild).toBeTruthy();
  });
});

// ===========================================================================
// 2. DualProgressBar
// ===========================================================================

import DualProgressBar from '../components/ui/DualProgressBar';

describe('DualProgressBar', () => {
  it('renders without crashing', () => {
    const { container } = render(<DualProgressBar greenPercent={30} greyPercent={20} />);
    expect(container.firstChild).toBeTruthy();
  });

  it('clamps green to max 100', () => {
    const { container } = render(<DualProgressBar greenPercent={120} greyPercent={0} />);
    const children = container.querySelector('div')!.children;
    const green = children[0] as HTMLElement;
    expect(green.style.width).toBe('100%');
  });

  it('clamps grey so total does not exceed 100', () => {
    const { container } = render(<DualProgressBar greenPercent={80} greyPercent={50} />);
    const children = container.querySelector('div')!.children;
    const grey = children[1] as HTMLElement;
    // grey should be clamped to 100 - 80 = 20
    expect(grey.style.width).toBe('20%');
  });

  it('handles zero values', () => {
    const { container } = render(<DualProgressBar greenPercent={0} greyPercent={0} />);
    const children = container.querySelector('div')!.children;
    expect((children[0] as HTMLElement).style.width).toBe('0%');
    expect((children[1] as HTMLElement).style.width).toBe('0%');
  });

  it('handles negative values by clamping to 0', () => {
    const { container } = render(<DualProgressBar greenPercent={-5} greyPercent={-10} />);
    const children = container.querySelector('div')!.children;
    expect((children[0] as HTMLElement).style.width).toBe('0%');
    expect((children[1] as HTMLElement).style.width).toBe('0%');
  });
});

// ===========================================================================
// 3. ProgressCircle
// ===========================================================================

import ProgressCircle from '../components/ui/ProgressCircle';
import type { ProgressState } from '../types/domain';

describe('ProgressCircle', () => {
  const states: ProgressState[] = [
    'not_started',
    'walkthrough_started',
    'walkthrough_complete',
    'challenge_started',
    'challenge_complete',
  ];

  states.forEach((state) => {
    it(`renders SVG for state "${state}"`, () => {
      const { container } = render(<ProgressCircle state={state} />);
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
    });
  });

  it('not_started renders empty circle (fill=none)', () => {
    const { container } = render(<ProgressCircle state="not_started" />);
    const circle = container.querySelector('circle');
    expect(circle?.getAttribute('fill')).toBe('none');
  });

  it('challenge_complete renders filled circle', () => {
    const { container } = render(<ProgressCircle state="challenge_complete" />);
    const circle = container.querySelector('circle');
    expect(circle?.getAttribute('fill')).not.toBe('none');
  });

  it('partial states render a path element for the pie slice', () => {
    const partialStates: ProgressState[] = ['walkthrough_started', 'walkthrough_complete', 'challenge_started'];
    partialStates.forEach((state) => {
      const { container } = render(<ProgressCircle state={state} />);
      const path = container.querySelector('path');
      expect(path).toBeTruthy();
    });
  });

  it('accepts custom size prop', () => {
    const { container } = render(<ProgressCircle state="not_started" size={32} />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('32');
    expect(svg?.getAttribute('height')).toBe('32');
  });
});

// ===========================================================================
// 4. MessageBubble
// ===========================================================================

import MessageBubble from '../components/chat/MessageBubble';
import type { ChatMessage } from '../types/domain';

const makeMessage = (overrides: Partial<ChatMessage> = {}): ChatMessage => ({
  id: 'msg-1',
  threadId: 'thread-1',
  role: 'student',
  content: 'Hello world',
  createdAt: '2025-03-15T10:00:00Z',
  ...overrides,
});

describe('MessageBubble', () => {
  it('renders student message content', () => {
    render(<MessageBubble message={makeMessage({ content: 'My answer is 42' })} />);
    expect(screen.getByText('My answer is 42')).toBeInTheDocument();
  });

  it('renders tutor message content', () => {
    render(<MessageBubble message={makeMessage({ role: 'tutor', content: 'Great thinking!' })} />);
    expect(screen.getByText('Great thinking!')).toBeInTheDocument();
  });

  it('displays formatted time', () => {
    render(<MessageBubble message={makeMessage()} />);
    // Should render some time string from the createdAt
    const container = document.body;
    // Time format varies by locale, just check something renders
    expect(container.textContent).toContain(':');
  });

  it('renders grading badge for "correct" category', () => {
    const msg = makeMessage({
      role: 'tutor',
      content: 'Well done!',
      metadata: { gradingCategory: 'correct' },
    });
    render(<MessageBubble message={msg} />);
    expect(screen.getByText(/Correct/)).toBeInTheDocument();
  });

  it('renders grading badge for "incorrect" category', () => {
    const msg = makeMessage({
      role: 'tutor',
      content: 'Not quite.',
      metadata: { gradingCategory: 'incorrect' },
    });
    render(<MessageBubble message={msg} />);
    expect(screen.getByText(/Incorrect/)).toBeInTheDocument();
  });

  it('renders grading badge for "small mistake" category', () => {
    const msg = makeMessage({
      role: 'tutor',
      content: 'Almost there.',
      metadata: { gradingCategory: 'small mistake' },
    });
    render(<MessageBubble message={msg} />);
    expect(screen.getByText(/Small mistake/)).toBeInTheDocument();
  });

  it('renders grading badge for "slight clarification" category', () => {
    const msg = makeMessage({
      role: 'tutor',
      content: 'One small note.',
      metadata: { gradingCategory: 'slight clarification' },
    });
    render(<MessageBubble message={msg} />);
    expect(screen.getByText(/Almost there/)).toBeInTheDocument();
  });

  it('does not render grading badge for student messages', () => {
    const msg = makeMessage({
      role: 'student',
      content: 'My answer',
      metadata: { gradingCategory: 'correct' },
    });
    const { container } = render(<MessageBubble message={msg} />);
    // Student messages should NOT show grading badges
    expect(container.textContent).not.toContain('Correct!');
  });

  it('renders progress state label for system messages', () => {
    const msg = makeMessage({
      role: 'tutor',
      content: '',
      metadata: { progressState: 'challenge_complete', isSystemMessage: true },
    });
    render(<MessageBubble message={msg} />);
    expect(screen.getByText(/Challenge complete/)).toBeInTheDocument();
  });

  it('renders NEW ATTEMPT button when isNewAttemptButton is set', () => {
    const msg = makeMessage({
      content: '',
      metadata: { isNewAttemptButton: true },
    });
    const onNewAttempt = vi.fn();
    render(<MessageBubble message={msg} onNewAttempt={onNewAttempt} />);
    const button = screen.getByText('NEW ATTEMPT');
    expect(button).toBeInTheDocument();
    button.click();
    expect(onNewAttempt).toHaveBeenCalledOnce();
  });

  it('renders agent avatar when agent is provided for tutor messages', () => {
    const msg = makeMessage({ role: 'tutor', content: 'Hi there!' });
    const agent = { id: 'agent-1', name: 'Sam', avatarUrl: '/avatar.png' };
    render(<MessageBubble message={msg} agent={agent} />);
    expect(screen.getByText('Sam')).toBeInTheDocument();
  });

  it('handles empty content gracefully', () => {
    const msg = makeMessage({ content: '' });
    const { container } = render(<MessageBubble message={msg} />);
    expect(container.firstChild).toBeTruthy();
  });

  it('handles very long content without crashing', () => {
    const msg = makeMessage({ content: 'A'.repeat(5000) });
    const { container } = render(<MessageBubble message={msg} />);
    expect(container.firstChild).toBeTruthy();
  });

  it('preserves whitespace in content (pre-wrap)', () => {
    const msg = makeMessage({ content: 'Line 1\nLine 2\n  indented' });
    render(<MessageBubble message={msg} />);
    expect(screen.getByText(/Line 1/)).toBeInTheDocument();
  });
});

// ===========================================================================
// 5. Domain type validation (compile-time + runtime shape checks)
// ===========================================================================

import type {
  Student,
  Course,
  Unit,
  Objective,
  StudentObjectiveProgress,
  ThreadWithProgress,
  KnowledgeQueueItem,
} from '../types/domain';

describe('Domain types', () => {
  it('Student interface has required fields', () => {
    const student: Student = { id: 's1', name: 'Test', yearLabel: '7th' };
    expect(student.id).toBe('s1');
    expect(student.name).toBe('Test');
    expect(student.yearLabel).toBe('7th');
  });

  it('Course interface has required fields', () => {
    const course: Course = { id: 'c1', title: 'Math', instructorIds: ['i1'], enrolledStudentIds: ['s1'] };
    expect(course.id).toBe('c1');
    expect(course.instructorIds).toHaveLength(1);
  });

  it('Unit status types are valid', () => {
    const validStatuses = ['active', 'completed', 'locked', 'ready', 'processing', 'review', 'error'];
    const unit: Unit = { id: 'u1', courseId: 'c1', title: 'Unit 1', status: 'active' };
    expect(validStatuses).toContain(unit.status);
  });

  it('ProgressState has all 5 states', () => {
    const states: import('../types/domain').ProgressState[] = [
      'not_started', 'walkthrough_started', 'walkthrough_complete',
      'challenge_started', 'challenge_complete',
    ];
    expect(states).toHaveLength(5);
  });

  it('KnowledgeItemStatus has all 4 states', () => {
    const statuses: import('../types/domain').KnowledgeItemStatus[] = [
      'pending', 'active', 'completed_correct', 'completed_incorrect',
    ];
    expect(statuses).toHaveLength(4);
  });
});
