import mongoose from 'mongoose';

const LeadSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['new', 'connected', 'not connected'],
    default: 'new',
  },
  response: {
    type: String,
    enum: [
      'discussed',
      'callback',
      'interested',
      'busy',
      'rnr',
      'switched off',
      null,
    ],
    default: null,
  },
  telecaller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  callDate: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Lead = mongoose.model('Lead', LeadSchema);
export default Lead;
