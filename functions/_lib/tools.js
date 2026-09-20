export const FEELING_TOOL = {
  type: 'function',
  name: 'express_feeling',
  description: 'Call BEFORE speaking each response. Reports how you perceive the user and your own state.',
  parameters: {
    type: 'object',
    properties: {
      user_feeling: {
        type: 'string',
        enum: ['happy', 'concerned', 'sad', 'unsure', 'unknown'],
        description: 'happy=lifted; concerned=heavy; sad=low+confirmed; unsure=words say fine but voice does not match; unknown=user has not spoken yet, no read possible',
      },
      self_feeling: {
        type: 'string',
        enum: ['calm', 'attentive', 'thinking', 'delighted', 'wink', 'dying'],
        description: 'calm=default listening; attentive=perked up; thinking=composing; delighted=rare big joy; wink=handing over a suggestion; dying=comic tired, rare',
      },
      primary: {
        type: 'string',
        enum: ['user', 'self'],
        description: 'Which face to display now',
      },
    },
    required: ['user_feeling', 'self_feeling', 'primary'],
  },
};

export const END_CALL_TOOL = {
  type: 'function',
  name: 'end_call',
  description: 'Call to end the check-in call. Client tears down the call after your farewell audio finishes.',
  parameters: {
    type: 'object',
    properties: {
      reason: {
        type: 'string',
        enum: ['complete', 'unresponsive', 'safety'],
        description: 'complete=natural end after one suggestion; unresponsive=3 silences; safety=after 988 handoff',
      },
    },
    required: ['reason'],
  },
};
