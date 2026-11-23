import { Type } from '@google/genai';

const VALUE_ENUM = ['자유', '안전', '평등', '효율', '책임', '공동체', '프라이버시', '학습권'];

export const DELIBERATION_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    intake: {
      type: Type.OBJECT,
      properties: {
        accepted: { type: Type.BOOLEAN },
        rejectReason: { type: Type.STRING },
        rejectGuide: { type: Type.STRING },
      },
      required: ['accepted', 'rejectReason', 'rejectGuide'],
    },
    bill: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        clauses: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              no: { type: Type.STRING },
              heading: { type: Type.STRING },
              text: { type: Type.STRING },
            },
            required: ['no', 'heading', 'text'],
          },
        },
      },
      required: ['title', 'clauses'],
    },
    personas: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: {
            type: Type.STRING,
            enum: ['student', 'teacher', 'parent', 'admin', 'unseen'],
          },
          roleLabel: { type: Type.STRING },
          unseenDescription: { type: Type.STRING },
          stance: {
            type: Type.STRING,
            enum: ['SUPPORT', 'CONDITIONAL', 'OPPOSE'],
          },
          headline: { type: Type.STRING },
          statement: { type: Type.STRING },
          concerns: { type: Type.ARRAY, items: { type: Type.STRING } },
          demands: { type: Type.ARRAY, items: { type: Type.STRING } },
          values: {
            type: Type.ARRAY,
            items: { type: Type.STRING, enum: VALUE_ENUM },
          },
        },
        required: [
          'id',
          'roleLabel',
          'unseenDescription',
          'stance',
          'headline',
          'statement',
          'concerns',
          'demands',
          'values',
        ],
      },
    },
    conflicts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          valueA: { type: Type.STRING },
          valueB: { type: Type.STRING },
          description: { type: Type.STRING },
          sideA: {
            type: Type.ARRAY,
            items: { type: Type.STRING, enum: ['student', 'teacher', 'parent', 'admin', 'unseen'] },
          },
          sideB: {
            type: Type.ARRAY,
            items: { type: Type.STRING, enum: ['student', 'teacher', 'parent', 'admin', 'unseen'] },
          },
        },
        required: ['valueA', 'valueB', 'description', 'sideA', 'sideB'],
      },
    },
  },
  required: ['intake', 'bill', 'personas', 'conflicts'],
};

export const IMPACT_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    axes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          key: {
            type: Type.STRING,
            enum: ['legitimacy', 'equity', 'effectiveness', 'acceptance'],
          },
          label: { type: Type.STRING },
          score: { type: Type.INTEGER },
          reason: { type: Type.STRING },
        },
        required: ['key', 'label', 'score', 'reason'],
      },
    },
    summary: { type: Type.STRING },
    keyQuestion: { type: Type.STRING },
    sideEffects: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          type: {
            type: Type.STRING,
            enum: ['UNINTENDED', 'EVASION', 'INEQUITY', 'COST'],
          },
          description: { type: Type.STRING },
          affected: { type: Type.STRING },
          likelihood: { type: Type.INTEGER },
          severity: { type: Type.INTEGER },
        },
        required: ['title', 'type', 'description', 'affected', 'likelihood', 'severity'],
      },
    },
    alternatives: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
  required: ['axes', 'summary', 'keyQuestion', 'sideEffects', 'alternatives'],
};

export const REVISIONS_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    revisions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, enum: ['A', 'B'] },
          name: { type: Type.STRING },
          strategy: { type: Type.STRING },
          clauses: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                no: { type: Type.STRING },
                heading: { type: Type.STRING },
                text: { type: Type.STRING },
                changeType: {
                  type: Type.STRING,
                  enum: ['KEEP', 'MODIFIED', 'ADDED', 'REMOVED'],
                },
              },
              required: ['no', 'heading', 'text', 'changeType'],
            },
          },
          changeSummary: { type: Type.STRING },
          scores: {
            type: Type.OBJECT,
            properties: {
              legitimacy: { type: Type.INTEGER },
              equity: { type: Type.INTEGER },
              effectiveness: { type: Type.INTEGER },
              acceptance: { type: Type.INTEGER },
            },
            required: ['legitimacy', 'equity', 'effectiveness', 'acceptance'],
          },
          tradeoff: { type: Type.STRING },
        },
        required: ['id', 'name', 'strategy', 'clauses', 'changeSummary', 'scores', 'tradeoff'],
      },
    },
  },
  required: ['revisions'],
};

export const ASK_PERSONA_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    answer: { type: Type.STRING },
    stanceShift: {
      type: Type.STRING,
      enum: ['NONE', 'SOFTENED', 'HARDENED'],
    },
  },
  required: ['answer', 'stanceShift'],
};

export const REFLECTION_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    profile: { type: Type.STRING },
    tension: { type: Type.STRING },
    questions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    principle: { type: Type.STRING },
  },
  required: ['profile', 'tension', 'questions', 'principle'],
};
