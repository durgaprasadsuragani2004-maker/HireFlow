import { z } from 'zod';
import { INTERVIEW_STATUSES, INTERVIEW_TYPES } from '../config/constants';

export const scheduleInterviewSchema = z.object({
  applicationId: z.string().uuid('Invalid application ID format'),
  interviewerName: z.string().min(2, 'Interviewer name is required'),
  interviewerEmail: z.string().email('Valid interviewer email is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Start time must be HH:mm (24h)'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'End time must be HH:mm (24h)'),
  interviewType: z.enum([
    INTERVIEW_TYPES.TECHNICAL,
    INTERVIEW_TYPES.HR,
    INTERVIEW_TYPES.MANAGERIAL,
    INTERVIEW_TYPES.BEHAVIORAL,
    INTERVIEW_TYPES.FINAL,
  ]),
  meetingLink: z.string().url('Meeting link must be a valid URL').optional().or(z.literal('')),
  location: z.string().optional(),
  notes: z.string().max(1000).optional(),
}).refine(
  (data) => {
    return data.startTime < data.endTime;
  },
  {
    message: 'Start time must be strictly before end time',
    path: ['startTime'],
  }
);

export const updateInterviewSchema = z.object({
  status: z.enum([
    INTERVIEW_STATUSES.SCHEDULED,
    INTERVIEW_STATUSES.COMPLETED,
    INTERVIEW_STATUSES.CANCELLED,
    INTERVIEW_STATUSES.RESCHEDULED,
  ]).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  meetingLink: z.string().url().optional().or(z.literal('')),
  location: z.string().optional(),
  notes: z.string().max(1000).optional(),
  feedback: z.string().max(2000).optional(),
});
